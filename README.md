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

Este comando ejecuta el proceso de build y luego verifica que `dist/books.json` pueda analizarse correctamente.

## Formato de código

Utiliza [Prettier](https://prettier.io/) para mantener el estilo consistente. Ejecuta:

```bash
npm run format
```

Esto formatea los archivos HTML, CSS y JavaScript dentro de `src/`.

## Servidor local

Para previsualizar el sitio en tu máquina ejecuta:

```bash
npm start
```

Este comando inicia `http-server` en la carpeta `dist`.

## Configuración de Firebase

El proyecto está asociado al proyecto de Firebase `morfemalibreria-b8c79` definido en `.firebaserc`:

```json
{
  "projects": {
    "default": "morfemalibreria-b8c79"
  }
}
```

El archivo `firebase.json` configura Firebase Hosting para publicar el contenido de la carpeta `dist` e ignorar `firebase.json`, archivos ocultos y `node_modules`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
```

Si tienes permisos sobre el proyecto actual puedes usarlo directamente. En caso contrario crea un proyecto nuevo en Firebase y reemplaza el ID anterior ejecutando:

```bash
firebase use --add
```

Luego selecciona tu proyecto y confirma la actualización de `.firebaserc`.

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
