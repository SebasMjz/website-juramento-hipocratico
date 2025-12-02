import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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

type PageState = 'loading' | 'error' | 'menu' | 'calling' | 'attended'

// Frases de Sócrates
const SOCRATES_QUOTES = [
    "La vida no examinada no merece la pena ser vivida.",
    "Solo sé que no sé nada.",
    "El conocimiento es la única virtud y la ignorancia el único vicio.",
    "La sabiduría comienza en la maravilla.",
    "Conócete a ti mismo."
]

// Función para obtener una frase aleatoria
const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * SOCRATES_QUOTES.length)
    return SOCRATES_QUOTES[randomIndex]
}

function TablePage() {
    const { id } = useParams<{ id: string }>()
    const tableId = id ? parseInt(id, 10) : null

    const [state, setState] = useState<PageState>('loading')
    const [table, setTable] = useState<TableData | null>(null)
    const [error, setError] = useState<string>('')
    const [socratesQuote, setSocratesQuote] = useState<string>('')

    useEffect(() => {
        if (!tableId || isNaN(tableId)) {
            setError('ID de mesa inválido')
            setState('error')
            return
        }

        loadTable()
    }, [tableId])

    const loadTable = async () => {
        try {
            setState('loading')

            // Buscar la mesa por ID (sin autenticación)
            const { data, error: fetchError } = await supabase
                .from('dining_tables')
                .select('id, code, name, description, needs_attention')
                .eq('id', tableId)
                .maybeSingle()

            if (fetchError) {
                console.error('Supabase error:', fetchError)
                throw fetchError
            }

            if (!data) throw new Error('Mesa no encontrada')

            setTable(data)
            setState(data.needs_attention ? 'calling' : 'menu')

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
                            // Volver a menu después de 5 segundos
                            setTimeout(() => setState('menu'), 5000)
                        } else if (newData.needs_attention) {
                            setState('calling')
                        } else {
                            setState('menu')
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
            // Seleccionar frase aleatoria de Sócrates
            setSocratesQuote(getRandomQuote())
            setState('calling')

            const { error } = await supabase
                .from('dining_tables')
                .update({ needs_attention: true })
                .eq('id', table.id)

            if (error) throw error

            setTable({ ...table, needs_attention: true })
        } catch (err) {
            console.error('Error calling waiter:', err)
            setState('menu')
        }
    }

    const handleBackToMenu = () => {
        setState('menu')
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

    // Estado: MENU - Mostrar botones principales
    if (state === 'menu') {
        return (
            <div className="table-page">
                <div className="background-illustration">
                    <div className="pattern-row row-normal" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                    <div className="pattern-row row-flipped" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                    <div className="pattern-row row-normal" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                    <div className="pattern-row row-flipped" style={{ backgroundImage: `url(${bustPattern})` }}></div>
                </div>

                <div className="content-wrapper">
                    <div className="menu-container">
                        <div className="title-section">
                            <span className="title-small">E L</span>
                            <h1 className="title-main">JURAMENTO</h1>
                            <span className="title-subtitle">HIPOCRÁTICO</span>
                        </div>

                        <div className="menu-buttons">
                            <button className="menu-button">
                                CONTRASEÑA WIFI
                            </button>
                            <button className="menu-button">
                                MENÚ
                            </button>
                            <button className="menu-button call-waiter" onClick={handleCallWaiter}>
                                LLAMAR MESERO
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Estado: CALLING - Mesero en camino
    if (state === 'calling') {
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

                        <div className="status-section calling">
                            <div className="status-icon-small">⏳</div>
                            <h2 className="status-title">Mesero en camino</h2>
                            <p className="status-message">
                                En un momento vendrá un mesero a su mesa.
                            </p>
                            <p className="status-message">Gracias por su preferencia.</p>
                            <p className="status-quote">
                                "{socratesQuote}" - Sócrates
                            </p>
                            <button className="back-button" onClick={handleBackToMenu}>
                                ← Volver
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Estado: ATTENDED - Atendido
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
                    <div className="status-section attended">
                        <div className="status-icon">✅</div>
                        <h2 className="status-title">¡Atendido!</h2>
                        <p className="status-message">
                            El mesero ya está en camino a su mesa.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TablePage
