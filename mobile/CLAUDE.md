# Zylen Mobile

Port React Native (Expo SDK 57) de la app web en ../src. 

- Convenciones de porteo web→native: lee PORTING.md
- Docs de Expo SDK 57: https://docs.expo.dev/versions/v57.0.0/
- Gestor de paquetes: pnpm. Typecheck: `pnpm typecheck`
- Las rutas en app/ son thin re-exports; las pantallas viven en src/screens/
- El código de src/{store,services,types,constants,utils} viene copiado de la
  web — al arreglar bugs de lógica, arréglalos en AMBAS apps.
