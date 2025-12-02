import { useState } from 'react'
import './App.css'
import bustPattern from './assets/descarga-removebg-preview.png'
import menuImage1 from './assets/juramento menu.jpeg'
import menuImage2 from './assets/juramento menu2.jpeg'

function App() {
  const [showWifiPassword, setShowWifiPassword] = useState(false)
  const [showMenuImages, setShowMenuImages] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [hasVisitedInstagram, setHasVisitedInstagram] = useState(false)
  const [wifiPassword] = useState('Juramento2025!')
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
  }

  const handleImageClick = (imageSrc: string) => {
    setZoomedImage(imageSrc)
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
            onClick={() => setShowMenuImages(true)}
          >
            Menú
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
