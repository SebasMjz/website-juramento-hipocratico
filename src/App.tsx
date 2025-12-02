import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import './App.css'
import bustPattern from './assets/descarga-removebg-preview.png'
import menuImage1 from './assets/juramento menu.jpeg'
import menuImage2 from './assets/juramento menu2.jpeg'

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

function App() {
  const { id } = useParams<{ id: string }>()
  const tableId = id ? parseInt(id, 10) : null

  // Estados generales
  const [showWifiPassword, setShowWifiPassword] = useState(false)
  const [showMenuImages, setShowMenuImages] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  const [wifiPassword] = useState('Juramento2025!')


  // Estados de mesa
  const [state, setState] = useState<PageState>(tableId ? 'loading' : 'menu')
  const [table, setTable] = useState<TableData | null>(null)
  const [error, setError] = useState<string>('')
  const [socratesQuote, setSocratesQuote] = useState<string>('')

  useEffect(() => {
    if (tableId && !isNaN(tableId)) {
      loadTable()
    } else if (id) {
      // Si hay ID pero no es válido
      setError('ID de mesa inválido')
      setState('error')
    }
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

  const instagramUrl = 'https://www.instagram.com/el.juramento.hipocratico'

  // Inicializar estado leyendo de localStorage
  const [hasVisitedInstagram, setHasVisitedInstagram] = useState(() => {
    return localStorage.getItem('hasVisitedInstagram') === 'true'
  })

  const handleWifiClick = () => {
    if (!hasVisitedInstagram) {
      // Guardar en localStorage para persistir si la página se recarga
      localStorage.setItem('hasVisitedInstagram', 'true')
      setHasVisitedInstagram(true)

      // Abrir Instagram en una nueva pestaña
      window.open(instagramUrl, '_blank')

      // Mostrar la contraseña
      setTimeout(() => {
        setShowWifiPassword(true)
      }, 500)
    } else {
      setShowWifiPassword(true)
    }
  }

  const handleImageClick = (imageSrc: string) => {
    setZoomedImage(imageSrc)
  }

  // Renderizado condicional basado en el estado
  if (state === 'loading') {
    return (
      <div className="app-container">
        <div className="background-illustration">
          <div className="pattern-row" style={{ backgroundImage: `url(${bustPattern})` }}></div>
          <div className="pattern-row" style={{ backgroundImage: `url(${bustPattern})` }}></div>
          <div className="pattern-row" style={{ backgroundImage: `url(${bustPattern})` }}></div>
          <div className="pattern-row" style={{ backgroundImage: `url(${bustPattern})` }}></div>
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
      <div className="app-container">
        <div className="background-illustration">
          <div className="pattern-row" style={{ backgroundImage: `url(${bustPattern})` }}></div>
          <div className="pattern-row" style={{ backgroundImage: `url(${bustPattern})` }}></div>
          <div className="pattern-row" style={{ backgroundImage: `url(${bustPattern})` }}></div>
          <div className="pattern-row" style={{ backgroundImage: `url(${bustPattern})` }}></div>
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
    <div className="app-container">
      <div className="background-illustration">
        {/* Fila 1: Normal */}
        <div
          className="pattern-row row-normal"
          style={{ backgroundImage: `url(${bustPattern})` }}
        ></div>
        {/* Fila 2: Volteada, desplazada */}
        <div
          className="pattern-row row-flipped"
          style={{ backgroundImage: `url(${bustPattern})` }}
        ></div>
        {/* Fila 3: Normal */}
        <div
          className="pattern-row row-normal"
          style={{ backgroundImage: `url(${bustPattern})` }}
        ></div>
        {/* Fila 4: Volteada, desplazada */}
        <div
          className="pattern-row row-flipped"
          style={{ backgroundImage: `url(${bustPattern})` }}
        ></div>
      </div>

      <div className="content-wrapper">
        {state === 'menu' && (
          <>
            <div className="title-section">
              <span className="title-small">EL</span>
              <h1 className="title-main">JURAMENTO</h1>
              <span className="title-small">HIPOCRATICO</span>
            </div>

            <div className="main-buttons">
              <button
                className="main-button wifi-button"
                onClick={handleWifiClick}
              >
                Contraseña WiFi
              </button>

              <button
                className="main-button mesas-button"
                onClick={() => setShowMenuImages(true)}
              >
                Menú
              </button>

              {/* Botón de Llamar Mesero solo si hay mesa */}
              {table && (
                <button
                  className="main-button menu-button call-waiter"
                  onClick={handleCallWaiter}
                >
                  Llamar Mesero
                </button>
              )}
            </div>
          </>
        )}

        {state === 'calling' && (
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
        )}

        {state === 'attended' && (
          <div className="table-info">
            <div className="status-section attended">
              <div className="status-icon">✅</div>
              <h2 className="status-title">¡Atendido!</h2>
              <p className="status-message">
                El mesero ya está en camino a su mesa.
              </p>
            </div>
          </div>
        )}
      </div>

      {showWifiPassword && (
        <div className="wifi-modal">
          <div className="modal-content">
            <h2>Contraseña WiFi</h2>
            <p className="instagram-note">
              ¡Gracias por seguirnos en Instagram!
            </p>
            <div className="wifi-password">
              <span className="password-text">{wifiPassword}</span>
              <button
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(wifiPassword)
                  alert('Contraseña copiada al portapapeles')
                }}
              >
                📋 Copiar
              </button>
            </div>
            <button
              className="close-button"
              onClick={() => setShowWifiPassword(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}


      {showMenuImages && (
        <div className="menu-modal">
          <div className="modal-content menu-images-content">
            <h2>Nuestro Menú</h2>
            <p className="zoom-hint">Haz clic en las imágenes para ampliar</p>
            <div className="menu-images">
              <img
                src={menuImage1}
                alt="Menú página 1"
                className="menu-image clickable"
                onClick={() => handleImageClick(menuImage1)}
              />
              <img
                src={menuImage2}
                alt="Menú página 2"
                className="menu-image clickable"
                onClick={() => handleImageClick(menuImage2)}
              />
            </div>
            <button
              className="close-button"
              onClick={() => setShowMenuImages(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div className="zoom-modal" onClick={() => setZoomedImage(null)}>
          <div className="zoom-content">
            <button
              className="zoom-close-button"
              onClick={() => setZoomedImage(null)}
            >
              ✕
            </button>
            <img
              src={zoomedImage}
              alt="Menú ampliado"
              className="zoomed-image"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
