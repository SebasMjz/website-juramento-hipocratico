import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './TablePage.css'
import bustPattern from '../assets/descarga-removebg-preview.png'

type TableData = {
    id: number
    code: string
    name: string
    description: string | null
    needs_attention: boolean
}

type PageState = 'loading' | 'error' | 'idle' | 'calling' | 'attended'

function TablePage() {
    const [searchParams] = useSearchParams()
    const qrCode = searchParams.get('code')

    const [state, setState] = useState<PageState>('loading')
    const [table, setTable] = useState<TableData | null>(null)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        if (!qrCode) {
            setError('Código QR inválido')
            setState('error')
            return
        }

        loadTable()
    }, [qrCode])

    const loadTable = async () => {
        try {
            setState('loading')

            // Autenticar anónimamente
            const { error: authError } = await supabase.auth.signInAnonymously()
            if (authError) throw authError

            // Buscar la mesa por qr_code
            const { data, error: fetchError } = await supabase
                .from('dining_tables')
                .select('id, code, name, description, needs_attention')
                .eq('qr_code', qrCode)
                .maybeSingle()

            if (fetchError) throw fetchError
            if (!data) throw new Error('Mesa no encontrada')

            setTable(data)
            setState(data.needs_attention ? 'calling' : 'idle')

            // Suscribirse a cambios en tiempo real
            const channel = supabase
                .channel(`table-${data.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'dining_tables',
                        filter: `id=eq.${data.id}`,
                    },
                    (payload: { new: TableData }) => {
                        const newData = payload.new as TableData
                        setTable(newData)

                        // Si needs_attention cambió de true a false, el mesero atendió
                        if (table?.needs_attention && !newData.needs_attention) {
                            setState('attended')
                            // Volver a idle después de 5 segundos
                            setTimeout(() => setState('idle'), 5000)
                        } else if (newData.needs_attention) {
                            setState('calling')
                        } else {
                            setState('idle')
                        }
                    }
                )
                .subscribe()

            return () => {
                channel.unsubscribe()
            }
        } catch (err) {
            console.error('Error loading table:', err)
            setError(err instanceof Error ? err.message : 'Error al cargar la mesa')
            setState('error')
        }
    }

    const handleCallWaiter = async () => {
        if (!table) return

        try {
            setState('calling')

            const { error } = await supabase
                .from('dining_tables')
                .update({ needs_attention: true })
                .eq('qr_code', qrCode)

            if (error) throw error

            setTable({ ...table, needs_attention: true })
        } catch (err) {
            console.error('Error calling waiter:', err)
            alert('Error al llamar al mesero. Por favor, intenta de nuevo.')
            setState('idle')
        }
    }

    if (state === 'loading') {
        return (
            <div className="table-page">
                <div className="background-illustration">
                    <div className="pattern-row row-normal" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                    <div className="pattern-row row-flipped" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                    <div className="pattern-row row-normal" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                    <div className="pattern-row row-flipped" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                </div>
                <div className="content-wrapper">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Cargando...</p>
                </div>
            </div>
        )
    }

    if (state === 'error') {
        return (
            <div className="table-page">
                <div className="background-illustration">
                    <div className="pattern-row row-normal" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                    <div className="pattern-row row-flipped" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                    <div className="pattern-row row-normal" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                    <div className="pattern-row row-flipped" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                </div>
                <div className="content-wrapper">
                    <div className="error-container">
                        <div className="error-icon">❌</div>
                        <h2 className="error-title">Error</h2>
                        <p className="error-message">{error}</p>
                        <p className="error-hint">Por favor, verifica el código QR e intenta de nuevo.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="table-page">
            <div className="background-illustration">
                <div className="pattern-row row-normal" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                <div className="pattern-row row-flipped" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                <div className="pattern-row row-normal" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                <div className="pattern-row row-flipped" style={{ backgroundImage: `url(${bustPattern})` }}></div>
            </div>

            <div className="content-wrapper">
                <div className="table-info">
                    <div className="title-section">
                        <span className="title-small">MESA</span>
                        <h1 className="title-main">{table?.code}</h1>
                        {table?.name && <span className="title-small">{table.name}</span>}
                    </div>

                    {table?.description && (
                        <p className="table-description">{table.description}</p>
                    )}

                    {state === 'idle' && (
                        <div className="action-section">
                            <button className="call-waiter-button" onClick={handleCallWaiter}>
                                <span className="button-icon">👋</span>
                                <span className="button-text">Llamar Mesero</span>
                            </button>
                            <p className="action-hint">Presiona el botón para solicitar atención</p>
                        </div>
                    )}

                    {state === 'calling' && (
                        <div className="status-section calling">
                            <div className="status-icon">⏳</div>
                            <h2 className="status-title">Mesero en camino</h2>
                            <p className="status-message">
                                En un momento vendrá un mesero a su mesa.
                            </p>
                            <p className="status-message">Gracias por su preferencia.</p>
                            <p className="status-quote">
                                "La salud es la mayor posesión. La alegría es el mayor tesoro. La confianza es el mayor amigo." - Buda
                            </p>
                        </div>
                    )}

                    {state === 'attended' && (
                        <div className="status-section attended">
                            <div className="status-icon">✅</div>
                            <h2 className="status-title">¡Atendido!</h2>
                            <p className="status-message">
                                El mesero ya está en camino a su mesa.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TablePage
