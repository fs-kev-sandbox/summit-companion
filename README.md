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

## Despliegue estático

Puedes publicar el contenido de `dist/` en cualquier hosting estático, por ejemplo GitHub Pages, Netlify, Vercel o un servidor web simple. No requiere variables de entorno ni servicios externos.

## Uso en el evento

- En `Hoy`, revisa las charlas de prioridad alta y las próximas por hora.
- En `Agenda`, cambia el estado de cada charla y abre su panel de notas.
- En `Checklist`, marca preparación general y pasos del CTF.
- En `CTF`, crea un registro por reto con comandos, hallazgos, hipótesis, pistas y aprendizaje.
- En `Exportar`, descarga tus notas completas en Markdown para Joplin/GitHub o en JSON para respaldo.

## Persistencia

Los datos se guardan en el navegador actual mediante `localStorage`. Si cambias de navegador, dispositivo o limpias datos del sitio, debes exportar antes para conservar una copia.
