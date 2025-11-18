import { useState } from 'react'
import './App.css'
import bustPattern from './assets/descarga-removebg-preview.png'

function App() {
  const [showWifiPassword, setShowWifiPassword] = useState(false)
  const [showMesasMenu, setShowMesasMenu] = useState(false)
  const [hasVisitedInstagram, setHasVisitedInstagram] = useState(false)
  const [wifiPassword] = useState('Cafe2024!')
  const instagramUrl = 'https://www.instagram.com/el.juramento.hipocratico'

  const handleWifiClick = () => {
    if (!hasVisitedInstagram) {
      // Abrir Instagram en una nueva pestaña
      window.open(instagramUrl, '_blank')
      // Marcar como visitado y mostrar la contraseña después de un breve delay
      setHasVisitedInstagram(true)
      setTimeout(() => {
        setShowWifiPassword(true)
      }, 500)
    } else {
      setShowWifiPassword(!showWifiPassword)
    }
    setShowMesasMenu(false)
  }

  const handleMesasClick = () => {
    setShowMesasMenu(!showMesasMenu)
    setShowWifiPassword(false)
  }

  const handleMesaAction = (action: string) => {
    alert(`Acción: ${action}`)
    setShowMesasMenu(false)
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
            onClick={handleMesasClick}
          >
            Mesas
          </button>
        </div>
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

      {showMesasMenu && (
        <div className="mesas-menu">
          <div className="menu-content">
            <h2>Opciones de Mesa</h2>
            <div className="mesa-actions">
              <button 
                className="action-button cuenta-button"
                onClick={() => handleMesaAction('Pedir Cuenta')}
              >
                <span className="action-icon">🧾</span>
                Pedir Cuenta
              </button>
              <button 
                className="action-button mesero-button"
                onClick={() => handleMesaAction('Llamar Mesero')}
              >
                <span className="action-icon">👋</span>
                Llamar Mesero
              </button>
              <button 
                className="action-button cancelar-button"
                onClick={() => handleMesaAction('Cancelar')}
              >
                <span className="action-icon">❌</span>
                Cancelar
              </button>
            </div>
            <button 
              className="close-button"
              onClick={() => setShowMesasMenu(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
