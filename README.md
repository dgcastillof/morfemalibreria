# Morfema Librería

Sitio web estático de la librería Morfema en Buenos Aires. El proyecto contiene los archivos que se publican en Firebase Hosting. Puedes visitarlo en [https://morfemalibreria.com.ar/](https://morfemalibreria.com.ar/).

## Requisitos previos

- **Node.js** 18 o superior (probado con Node 20)
- **Firebase CLI**. Instálalo globalmente con:

```bash
npm install -g firebase-tools
```

## Ejecutar pruebas

Las pruebas se ejecutan con el comando:

```bash
npm test
```

Este comando verifica que `public/books.json` pueda analizarse correctamente.

## Formato de código

Utiliza [Prettier](https://prettier.io/) para mantener el estilo consistente. Ejecuta:

```bash
npm run format
```

Esto formatea los archivos HTML, CSS y JavaScript dentro de `public/`.

## Servidor local

Para previsualizar el sitio en tu máquina ejecuta:

```bash
npm start
```

Este comando inicia `http-server` en la carpeta `public`.

## Despliegue en Firebase Hosting

1. Inicia sesión con tu cuenta de Firebase si no lo has hecho:

```bash
firebase login
```

2. Despliega el sitio usando:

```bash
firebase deploy --only hosting
```

El archivo `firebase.json` define la configuración de Hosting.

## Licencia

Este proyecto se distribuye bajo la [Licencia MIT](LICENSE).
