import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import './App.css'
import bustPattern from './assets/descarga-removebg-preview.png'

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

  // Estados para datos dinámicos desde menu_media
  const [wifiPassword, setWifiPassword] = useState<string>('')
  const [menuImages, setMenuImages] = useState<string[]>([])


  // Estados de mesa
  const [state, setState] = useState<PageState>(tableId ? 'loading' : 'menu')
  const [table, setTable] = useState<TableData | null>(null)

  const [socratesQuote, setSocratesQuote] = useState<string>('')

  // Ref para acceder al estado actual de la mesa dentro del callback de suscripción
  const tableRef = useRef<TableData | null>(null)

  useEffect(() => {
    tableRef.current = table
  }, [table])

  // Cargar datos del menú (WiFi y imágenes) desde menu_media
  useEffect(() => {
    loadMenuData()
  }, [])

  useEffect(() => {
    if (tableId && !isNaN(tableId)) {
      loadTable()
    } else {
      // Si no hay ID o es invalido, mostrar menu normal
      setState('menu')
    }
  }, [tableId])

  // Detectar cuando el usuario vuelve a la pagina y recargar la mesa si es necesario
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && tableId && !isNaN(tableId)) {
        // Cuando la pagina se vuelve visible, recargar los datos de la mesa
        console.log('Pagina visible, recargando mesa...')
        loadTable()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [tableId])

  const loadMenuData = async () => {
    try {

      // Obtener todos los registros de menu_media
      const { data, error } = await supabase
        .from('menu_media')
        .select('description, image_url')
        .order('id', { ascending: true })

      if (error) {
        console.error('Error loading menu data:', error)
        // Usar valores por defecto si hay error
        setWifiPassword('sabidulatte')
        setMenuImages([])
        return
      }

      if (data && data.length > 0) {
        // Buscar la contraseña WiFi (primer registro con description)
        const wifiRecord = data.find(item => item.description)
        if (wifiRecord?.description) {
          setWifiPassword(wifiRecord.description)
        } else {
          setWifiPassword('sabidulatte') // Valor por defecto
        }

        // Obtener todas las imágenes
        const images = data
          .filter(item => item.image_url)
          .map(item => item.image_url as string)

        setMenuImages(images)
      } else {
        // Si no hay datos, usar valores por defecto
        setWifiPassword('sabidulatte')
        setMenuImages([])
      }
    } catch (err) {
      console.error('Error fetching menu data:', err)
      setWifiPassword('sabidulatte')
      setMenuImages([])
    }
  }

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
        // Si hay error de red/db, fallar silenciosamente al menú
        setState('menu')
        return
      }

      if (!data) {
        console.warn('Mesa no encontrada')
        // Si no existe la mesa, mostrar menú normal
        setState('menu')
        return
      }

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

            // Usar la referencia para obtener el estado anterior real
            const currentTable = tableRef.current

            // Si needs_attention cambió de true a false, el mesero atendió
            // O si simplemente recibimos false y estábamos en estado 'calling'
            if ((currentTable?.needs_attention && !newData.needs_attention) ||
              (!newData.needs_attention && state === 'calling')) {
              setState('attended')
              // Volver a menu después de 5 segundos
              setTimeout(() => setState('menu'), 5000)
            } else if (newData.needs_attention) {
              setState('calling')
            } else {
              // Si no requiere atención y no venimos de calling, mostrar menú
              if (state !== 'attended') {
                setState('menu')
              }
            }
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    } catch (err) {
      console.error('Error loading table:', err)
      // En caso de cualquier excepción, asegurar que el usuario vea el menú
      setState('menu')
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
      // Guardar el ID de la mesa en localStorage ANTES de abrir Instagram
      if (tableId) {
        localStorage.setItem('lastTableId', tableId.toString())
      }

      // Guardar que ya visitó Instagram
      localStorage.setItem('hasVisitedInstagram', 'true')
      setHasVisitedInstagram(true)

      // Marcar que estamos abriendo Instagram
      localStorage.setItem('openingInstagram', 'true')

      // Mostrar la contraseña PRIMERO para asegurar que la UI responda
      setShowWifiPassword(true)

      // Intentar abrir Instagram con un pequeño delay
      setTimeout(() => {
        window.open(instagramUrl, '_blank')
      }, 500)
    } else {
      setShowWifiPassword(true)
    }
  }

  // Detectar cuando el usuario vuelve de Instagram y recargar si es necesario
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Si la página se vuelve visible y acabamos de abrir Instagram
      if (document.visibilityState === 'visible') {
        const wasOpeningInstagram = localStorage.getItem('openingInstagram')

        if (wasOpeningInstagram === 'true') {
          // Limpiar la bandera
          localStorage.removeItem('openingInstagram')

          // Recargar la página para restaurar el estado
          // Esto evita que se quede en blanco
          setTimeout(() => {
            window.location.reload()
          }, 100)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

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
            {menuImages.length > 0 ? (
              <>
                <p className="zoom-hint">Haz clic en las imágenes para ampliar</p>
                <div className="menu-images">
                  {menuImages.map((imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Menú página ${index + 1}`}
                      className="menu-image clickable"
                      onClick={() => handleImageClick(imageUrl)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="no-menu-message">No hay imágenes del menú disponibles en este momento.</p>
            )}
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
