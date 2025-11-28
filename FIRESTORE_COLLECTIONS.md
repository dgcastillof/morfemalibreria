# Colecciones de Firestore - Morfema

Este documento describe la estructura de las colecciones de Firestore utilizadas en Morfema.

## Índice

1. [users](#users)
2. [memberships](#memberships)
3. [listings](#listings)
4. [reviews](#reviews)
5. [Despliegue](#despliegue)
6. [Custom Claims](#custom-claims)

---

## users

**Ruta:** `users/{uid}`

Almacena el perfil mínimo de cada usuario.

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `displayName` | string | ✅ | Nombre para mostrar (2-100 caracteres) |
| `emailVerified` | boolean | ✅ | Si el email ha sido verificado |
| `photoURL` | string | ❌ | URL de la foto de perfil |
| `bio` | string | ❌ | Biografía del usuario (máx. 500 caracteres) |
| `createdAt` | timestamp | ✅ | Fecha de creación del perfil |
| `updatedAt` | timestamp | ✅ | Última actualización del perfil |

### Permisos

| Operación | Quién puede |
|-----------|-------------|
| **Read** | El propio usuario, admin, o moderador |
| **Create** | El propio usuario |
| **Update** | El propio usuario (no puede cambiar `createdAt`) |
| **Delete** | Solo admin |

### Ejemplo

```javascript
// Crear perfil de usuario
const userProfile = {
  displayName: "Juan Pérez",
  emailVerified: true,
  photoURL: "https://example.com/photo.jpg",
  bio: "Amante de la literatura latinoamericana",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

await setDoc(doc(db, "users", uid), userProfile);
```

---

## memberships

**Ruta:** `memberships/{uid}`

Estado de membresía del "Club Morfema" para cada usuario.

### Campos

| Campo | Tipo | Requerido | Valores válidos | Descripción |
|-------|------|-----------|-----------------|-------------|
| `status` | string | ✅ | `active`, `inactive`, `pending`, `cancelled`, `expired` | Estado actual de la membresía |
| `plan` | string | ✅ | `free`, `basic`, `premium`, `annual` | Tipo de plan |
| `startDate` | timestamp | ✅ | - | Fecha de inicio de la membresía |
| `endDate` | timestamp | ❌ | - | Fecha de expiración |
| `autoRenew` | boolean | ❌ | - | Renovación automática |
| `paymentMethod` | string | ❌ | - | Método de pago configurado |
| `createdAt` | timestamp | ✅ | - | Fecha de creación del registro |
| `updatedAt` | timestamp | ✅ | - | Última actualización |

### Permisos

| Operación | Quién puede |
|-----------|-------------|
| **Read** | El propio usuario, admin, o moderador |
| **Create** | Solo admin (sistema) |
| **Update** | Usuario (solo `autoRenew` y `paymentMethod`), admin (todo) |
| **Delete** | Solo admin |

### Ejemplo

```javascript
// Admin crea membresía para usuario
const membership = {
  status: "active",
  plan: "premium",
  startDate: serverTimestamp(),
  endDate: Timestamp.fromDate(new Date("2026-01-01")),
  autoRenew: true,
  paymentMethod: "card",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

await setDoc(doc(db, "memberships", uid), membership);
```

---

## listings

**Ruta:** `listings/{listingId}`

Libros publicados por usuarios para venta en la plataforma.

### Campos

| Campo | Tipo | Requerido | Valores válidos | Descripción |
|-------|------|-----------|-----------------|-------------|
| `userId` | string | ✅ | - | UID del usuario vendedor |
| `title` | string | ✅ | - | Título del libro (1-200 caracteres) |
| `author` | string | ✅ | - | Autor del libro (1-200 caracteres) |
| `isbn` | string | ❌ | - | ISBN del libro |
| `description` | string | ❌ | - | Descripción (máx. 2000 caracteres) |
| `condition` | string | ✅ | `new`, `like_new`, `good`, `acceptable`, `poor` | Condición del libro |
| `price` | number | ✅ | > 0 | Precio de venta |
| `currency` | string | ✅ | 3 caracteres (ej: `COP`, `USD`) | Moneda |
| `images` | array | ❌ | - | URLs de imágenes del libro |
| `status` | string | ✅ | `draft`, `pending_review`, `active`, `sold`, `removed` | Estado del listing |
| `category` | string | ❌ | - | Categoría del libro |
| `createdAt` | timestamp | ✅ | - | Fecha de creación |
| `updatedAt` | timestamp | ✅ | - | Última actualización |

### Permisos

| Operación | Quién puede |
|-----------|-------------|
| **Read** | Público (solo `active`), dueño, admin, o moderador |
| **Create** | Usuario autenticado (solo `draft` o `pending_review`) |
| **Update** | Dueño (no puede auto-aprobar), staff (puede aprobar) |
| **Delete** | Dueño o admin |

### Flujo de estados

```
draft → pending_review → active → sold
                      ↘ removed
```

### Ejemplo

```javascript
// Usuario crea un listing
const listing = {
  userId: auth.currentUser.uid,
  title: "Cien años de soledad",
  author: "Gabriel García Márquez",
  isbn: "978-0060883287",
  description: "Primera edición, excelente estado",
  condition: "like_new",
  price: 45000,
  currency: "COP",
  images: ["https://storage.example.com/img1.jpg"],
  status: "pending_review",
  category: "ficcion",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

await addDoc(collection(db, "listings"), listing);
```

---

## reviews

**Ruta:** `reviews/{slug}/comments/{commentId}`

Comentarios en las reseñas literarias (colección existente).

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ | Nombre del comentarista (1-100 caracteres) |
| `message` | string | ✅ | Contenido del comentario (1-1000 caracteres) |
| `createdAt` | timestamp | ✅ | Fecha de creación |
| `recaptchaToken` | string | ❌ | Token de reCAPTCHA |
| `approved` | boolean | - | Si el comentario está aprobado (manejado por admin) |

### Permisos

| Operación | Quién puede |
|-----------|-------------|
| **Read** | Público (solo aprobados), staff (todos) |
| **Create** | Cualquiera |
| **Update/Delete** | Solo admin |

---

## Despliegue

### Desplegar solo las reglas de Firestore

```bash
firebase deploy --only firestore:rules
```

### Desplegar reglas e índices

```bash
firebase deploy --only firestore
```

### Validar reglas antes de desplegar

```bash
firebase emulators:start --only firestore
```

### Ver reglas actuales

```bash
firebase firestore:rules:get
```

---

## Custom Claims

Las reglas utilizan Custom Claims de Firebase Auth para determinar roles. Estos claims deben configurarse desde el backend (Cloud Functions o Admin SDK).

### Claims disponibles

| Claim | Tipo | Descripción |
|-------|------|-------------|
| `admin` | boolean | Acceso total a todas las operaciones |
| `moderator` | boolean | Puede ver contenido pendiente y gestionar listings |

### Configurar claims (Admin SDK)

```javascript
const admin = require('firebase-admin');

// Asignar rol de admin
await admin.auth().setCustomUserClaims(uid, { admin: true });

// Asignar rol de moderador
await admin.auth().setCustomUserClaims(uid, { moderator: true });

// Asignar ambos roles
await admin.auth().setCustomUserClaims(uid, { admin: true, moderator: true });

// Remover claims
await admin.auth().setCustomUserClaims(uid, {});
```

### Verificar claims en el cliente

```javascript
const idTokenResult = await auth.currentUser.getIdTokenResult();
const isAdmin = idTokenResult.claims.admin === true;
const isModerator = idTokenResult.claims.moderator === true;
```

---

## Consideraciones de seguridad

1. **Timestamps**: Todas las colecciones requieren `createdAt` y `updatedAt` con validación estricta.
2. **Inmutabilidad**: `createdAt` y `userId` no pueden modificarse después de la creación.
3. **Auto-asignación**: Los usuarios no pueden crear sus propias membresías ni auto-aprobar listings.
4. **Validación de datos**: Todos los campos tienen validaciones de tipo y tamaño.
5. **Principio de mínimo privilegio**: Cada rol tiene acceso solo a lo necesario.

---

## Próximos pasos

- [ ] Implementar Cloud Functions para gestión de membresías
- [ ] Añadir índices compuestos para queries de listings
- [ ] Implementar webhooks de pago para actualizar membresías
- [ ] Crear panel de moderación para aprobar listings
