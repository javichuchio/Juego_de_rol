# Mobile UI (separada del frontend web)

Esta carpeta se creo para rehacer la interfaz movil sin tocar la version web actual.

## Estructura

- `react-native/`: opcion recomendada para rehacer UI movil con JavaScript/TypeScript.
- `flutter/`: opcion alternativa para rehacer UI movil con Dart.

## Recomendacion

Para este proyecto, lo mas directo es usar **React Native** porque:
- puedes reaprovechar logica y estilo de trabajo de JavaScript.
- mantienes el backend Node/Express tal cual (`backend/`).
- mejoras experiencia movil (navegacion, componentes nativos, rendimiento percibido).

## Backend reutilizable

No hace falta rehacer servidor:
- autenticacion: `/api/auth/register`, `/api/auth/login`, `/api/me`
- progreso: `/api/progress`, `/api/progress/reset`

Solo debes apuntar la app movil a la URL del backend (IP local o dominio).

## Siguientes pasos sugeridos

1. Elegir stack principal: `react-native` o `flutter`.
2. Inicializar proyecto dentro de la carpeta elegida.
3. Crear capas: `auth`, `game-state`, `api-client`.
4. Conectar login/registro y carga/guardado de progreso.
5. Migrar pantallas del juego de web a UI movil.
