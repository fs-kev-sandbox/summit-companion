# Summit Companion

Aplicación web pequeña para usar durante el openSUSE América Summit Barranquilla 2026. Incluye agenda personal, notas por charla, checklist del evento y registro básico para retos CTF.

La app no usa backend, login ni base de datos remota. Todo se guarda en `localStorage` del navegador.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre la URL local que muestre Vite.

## Build

```bash
npm run build
```

El sitio estático queda en `dist/`.

## PWA / instalación móvil

La app incluye un manifest, iconos SVG locales y un service worker básico. En producción cachea el shell de la app y assets visitados para abrirla sin red después de la primera carga.

Para probar la PWA localmente:

```bash
npm run build
npm run preview
```

Abre la URL local que muestre Vite. Si pruebas el build con la misma base de GitHub Pages, entra a `/summit-companion/`. En Chrome/Edge puedes revisar `Application > Manifest` y `Application > Service Workers` en DevTools. La instalación suele aparecer en la barra de dirección o en el menú del navegador. En móvil, abre la URL por HTTPS y usa la opción de instalar/agregar a pantalla de inicio.

Notas:

- El service worker solo se registra en builds de producción (`npm run build` + `npm run preview` o despliegue real).
- Los datos siguen guardándose en `localStorage`; instalar la PWA no cambia la persistencia ni la exportación.
- Si cambias mucho la app y ves una versión antigua, recarga una vez con conexión para actualizar el cache.

## Despliegue estático

Puedes publicar el contenido de `dist/` en cualquier hosting estático, por ejemplo GitHub Pages, Netlify, Vercel o un servidor web simple. No requiere variables de entorno ni servicios externos.

### GitHub Pages

El proyecto usa `base: "/summit-companion/"` en Vite para que los assets funcionen bajo la ruta del repositorio:

```text
https://fs-kev-sandbox.github.io/summit-companion/
```

El workflow `.github/workflows/deploy.yml` construye la app con `npm ci` y `npm run build`, sube `dist/` como artifact de Pages y publica el sitio automáticamente cuando hay push a `main`.

Para activar GitHub Pages en el repositorio:

1. Entra a `Settings > Pages`.
2. En `Build and deployment`, cambia `Source` a `GitHub Actions`.
3. Guarda la configuración si GitHub lo solicita.
4. Haz push a `main`.
5. Revisa `Actions > Deploy to GitHub Pages` hasta que termine correctamente.

También puedes lanzar el despliegue manualmente desde `Actions > Deploy to GitHub Pages > Run workflow`.

Antes de desplegar localmente puedes validar:

```bash
npm run build
```

La PWA solo será instalable desde GitHub Pages cuando el sitio esté servido por HTTPS y el navegador haya cargado correctamente `manifest.webmanifest` y `sw.js`.

## Uso en el evento

- En `Hoy`, revisa las charlas de prioridad alta y las próximas por hora.
- En `Agenda`, cambia el estado de cada charla y abre su panel de notas.
- En `Checklist`, marca preparación general y pasos del CTF.
- En `CTF`, crea un registro por reto con comandos, hallazgos, hipótesis, pistas y aprendizaje.
- En `Exportar`, descarga tus notas completas en Markdown para Joplin/GitHub o en JSON para respaldo, y restaura backups JSON cuando cambies de navegador o dispositivo.

## Persistencia

Los datos se guardan en el navegador actual mediante `localStorage`. Si cambias de navegador, dispositivo o limpias datos del sitio, debes exportar antes para conservar una copia.
