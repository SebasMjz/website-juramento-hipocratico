# Solución Simple para el Problema de Instagram

## El Problema
Cuando el usuario hace clic en "Contraseña WiFi", se abre Instagram, y al volver la página se queda en blanco.

## Solución Más Simple

En lugar de intentar recargar la página, vamos a **eliminar la funcionalidad de abrir Instagram automáticamente** y dejar que el usuario lo haga manualmente.

### Opción 1: Eliminar la Recarga Automática

Elimina todo el `useEffect` de `visibilitychange` (líneas 251-276 en App.tsx)

### Opción 2: No Abrir Instagram Automáticamente

Cambia `handleWifiClick` para que solo muestre la contraseña y un enlace a Instagram, sin abrirlo automáticamente.

### Opción 3: Usar un Enlace en Lugar de window.open

En lugar de `window.open(instagramUrl, '_blank')`, usa un enlace `<a>` que el usuario puede hacer clic.

## Recomendación

La opción más simple y que funciona mejor es **Opción 2**: Mostrar la contraseña WiFi y un botón/enlace para que el usuario abra Instagram manualmente si quiere.

Esto evita:
- Problemas de recarga
- Páginas en blanco
- Pérdida de estado
- Bugs de navegación

## Código Sugerido

```tsx
const handleWifiClick = () => {
  setShowWifiPassword(true)
  
  if (!hasVisitedInstagram) {
    localStorage.setItem('hasVisitedInstagram', 'true')
    setHasVisitedInstagram(true)
  }
}
```

Y en el modal de WiFi, agregar un botón:

```tsx
<a 
  href={instagramUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="instagram-button"
>
  Síguenos en Instagram
</a>
```

Esto es más simple, más confiable, y no causa problemas.
