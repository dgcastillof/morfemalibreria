# Morfema Librería

Sitio web estático de la librería Morfema en Buenos Aires. El proyecto contiene los archivos que se publican en Firebase Hosting. Puedes visitarlo en [https://morfemalibreria.com.ar/](https://morfemalibreria.com.ar/).

## Estructura del Proyecto

```
morfema/
├── config/                 # Archivos de configuración
│   ├── books.schema.json   # Esquema JSON para validación de libros
│   ├── firestore.indexes.json
│   └── firestore.rules     # Reglas de seguridad de Firestore
├── public/                 # Archivos estáticos
│   ├── books.json          # Catálogo de libros
│   ├── robots.txt          # Configuración para crawlers
│   ├── sitemap.xml         # Mapa del sitio
│   └── images/             # Imágenes y assets
│       ├── fotos/          # Portadas de libros
│       ├── favicon.ico
│       ├── logo.png
│       └── ...
├── scripts/                # Scripts de build y utilidades
│   ├── build.js            # Script principal de compilación
│   └── generate-sitemap.js # Generador de sitemap
├── src/                    # Código fuente
│   ├── pages/              # Páginas HTML principales
│   │   ├── index.html      # Página de inicio
│   │   ├── catalogo.html   # Catálogo de libros
│   │   ├── libro.html      # Detalle de libro
│   │   ├── login.html      # Inicio de sesión
│   │   ├── registro.html   # Registro de usuario
│   │   └── ...
│   ├── components/         # Componentes compartidos
│   │   ├── navbar.html     # Barra de navegación
│   │   ├── navbar.js       # Lógica del navbar
│   │   └── gtm.html        # Google Tag Manager
│   ├── content/            # Contenido editorial
│   │   └── textos-de-morfema/  # Artículos y textos
│   ├── js/                 # Módulos JavaScript
│   │   ├── core/           # Inicialización y config
│   │   │   ├── firebase-app.js
│   │   │   ├── firebase-config.js
│   │   │   ├── load-gtm.js
│   │   │   └── session-listener.js
│   │   ├── auth/           # Autenticación
│   │   │   ├── auth-esm.js
│   │   │   ├── login-controller.js
│   │   │   ├── registro-controller.js
│   │   │   └── ...
│   │   ├── features/       # Funcionalidades
│   │   │   ├── cart.js     # Carrito de compras
│   │   │   ├── comments-esm.js
│   │   │   ├── analytics-esm.js
│   │   │   └── admin.js
│   │   └── utils/          # Utilidades compartidas
│   ├── styles/             # Hojas de estilo
│   │   ├── styles.css      # Estilos principales
│   │   ├── auth.css        # Estilos de autenticación
│   │   └── sections.css    # Estilos de secciones
│   └── templates/          # Plantillas EJS
│       └── layout.ejs      # Layout base
├── test/                   # Pruebas
│   ├── test.js             # Suite de pruebas principal
│   ├── auth-validation.js  # Pruebas de validación
│   └── auth-forms-dom.js   # Pruebas DOM
├── dist/                   # Carpeta de salida (generada)
├── firebase.json           # Configuración de Firebase Hosting
├── package.json            # Dependencias y scripts npm
└── README.md
```

### Dónde agregar nuevos archivos

| Tipo de archivo | Ubicación | Notas |
|-----------------|-----------|-------|
| Nueva página HTML | `src/pages/` | Se copia a `dist/` en el build |
| Nuevo componente | `src/components/` | Para elementos reutilizables |
| Módulo de autenticación | `src/js/auth/` | Controladores y lógica de auth |
| Nueva funcionalidad | `src/js/features/` | Carrito, comentarios, etc. |
| Utilidades compartidas | `src/js/utils/` | Helpers y funciones comunes |
| Estilos CSS | `src/styles/` | Se minifica en el build |
| Artículos/textos | `src/content/textos-de-morfema/` | Preserva la estructura |
| Portadas de libros | `public/images/fotos/` | Se procesan con Sharp |
| Otras imágenes | `public/images/` | Se copian a `dist/` |
| Config de Firebase | `config/` | Reglas, índices, schemas |

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

Este comando ejecuta el proceso de build y luego verifica:

1. **Archivos requeridos**: Todas las páginas HTML y módulos ESM necesarios existen en `dist/`
2. **Validación de datos**: `dist/books.json` es válido según el esquema JSON
3. **Módulos ESM**: Los módulos de autenticación contienen los exports esperados
4. **Validación de formularios**: Las funciones de validación de email, contraseña, etc. funcionan correctamente
5. **Estructura DOM**: Los formularios de auth tienen la estructura HTML esperada (requiere jsdom)

### Scripts de prueba disponibles

| Comando | Descripción |
|---------|-------------|
| `npm test` | Ejecuta build + todas las pruebas |
| `npm run test:validation` | Solo pruebas de validación de auth (sin build) |
| `npm run test:dom` | Solo pruebas DOM de formularios auth (requiere jsdom) |

### Instalar dependencias de prueba

Para ejecutar las pruebas DOM, instala jsdom:

```bash
npm install
```

### Qué cubren las pruebas de auth

- **Validación de email**: Formatos válidos e inválidos
- **Validación de contraseña**: Longitud mínima (6 caracteres)
- **Coincidencia de contraseñas**: Verificación en registro
- **Estructura de formularios**: Campos, botones, mensajes de error
- **Páginas auth en dist/**: login.html, registro.html, olvide-clave.html, verifica-email.html
- **Módulos ESM**: auth-esm.js, user-profile.js, controladores

## Formato de código

Utiliza [Prettier](https://prettier.io/) para mantener el estilo consistente. Ejecuta:

```bash
npm run format
```

Esto formatea los archivos HTML, CSS y JavaScript dentro de `src/`.

## Generar `dist`

Después de editar los archivos HTML o JavaScript vuelve a compilar el sitio con:

```bash
npm run build
```

El comando genera la carpeta `dist/` lista para publicar.

## Servidor local

Para previsualizar el sitio en tu máquina ejecuta:

```bash
npm start
```

Este comando inicia `http-server` en la carpeta `dist`.

## Guía para portadas de libros

- Sube las portadas originales a `public/images/fotos/` en formato PNG o JPG. Con un ancho de ~1200px o menos es suficiente para generar todas las variantes.
- El build (`npm run build`) usa Sharp para crear automáticamente versiones WebP y JPG en 480px (para listas y tarjetas, donde las portadas no superan ~300px de ancho en pantalla) y 900px (para la vista de detalle, preparada para pantallas HiDPI).
- WebP es el formato preferido y las versiones JPG quedan como fallback de compatibilidad; las plantillas ya referencian las versiones comprimidas mediante `<picture>` y `srcset`.

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
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

Si tienes permisos sobre el proyecto actual puedes usarlo directamente. En caso contrario crea un proyecto nuevo en Firebase y reemplaza el ID anterior ejecutando:

```bash
firebase use --add
```

Luego selecciona tu proyecto y confirma la actualización de `.firebaserc`.

### Credenciales de Firebase (`src/js/core/firebase-config.js`)

La configuración de Firebase se centraliza en `src/js/core/firebase-config.js`. Este archivo exporta un objeto con las credenciales necesarias para conectar con los servicios de Firebase.

**Valores requeridos:**

| Clave                  | Descripción                                      |
|------------------------|--------------------------------------------------|
| `apiKey`               | Clave de API del proyecto                        |
| `authDomain`           | Dominio de autenticación                         |
| `projectId`            | ID del proyecto de Firebase                      |
| `storageBucket`        | Bucket de almacenamiento                         |
| `messagingSenderId`    | ID del remitente para Cloud Messaging            |
| `appId`                | ID de la aplicación web                          |
| `measurementId`        | ID de medición para Analytics (opcional)         |

**Cómo obtener estos valores:**

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Haz clic en el ícono de engranaje > Configuración del proyecto
4. En "Tus apps", selecciona tu aplicación web
5. Copia los valores del objeto `firebaseConfig`

**Gestión de entornos:**

Para usar diferentes proyectos de Firebase (desarrollo vs producción), puedes:

1. **Desarrollo local:** Edita directamente `src/firebase-config.js` con las credenciales del proyecto de desarrollo.

2. **CI/CD con variables de entorno:** Configura las variables de entorno antes del build:
   ```bash
   export FIREBASE_API_KEY="tu-api-key"
   export FIREBASE_PROJECT_ID="tu-project-id"
   # ... otras variables
   npm run build
   ```

> **Nota:** El archivo `public/firebase-config.js` está obsoleto y ya no se incluye en el build. Usa exclusivamente `src/js/core/firebase-config.js`.

## Sistema de comentarios

Las reseñas permiten comentarios guardados en Firebase. Consulta la sección
[Credenciales de Firebase](#credenciales-de-firebase-srcfirebase-configjs) para
configurar las claves de tu proyecto.

Los comentarios nuevos se guardan con el estado `approved: false` y no son
visibles públicamente hasta que un administrador los aprueba desde
`/admin.html?slug=ID_DE_RESEÑA`.

Para aprobarlos debes iniciar sesión con un usuario que tenga el claim
personalizado `admin: true` en Firebase Authentication.

## Reglas de seguridad de Firestore

Las reglas están en `config/firestore.rules` y limitan los campos permitidos al crear
comentarios. Para aplicarlas ejecuta:

```bash
firebase deploy --only firestore:rules
```

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
