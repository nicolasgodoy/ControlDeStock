# 🔧 Guía de Configuración de Firestore

## ✅ Firebase ya está configurado

La configuración de Firebase ya está actualizada en el archivo `data-manager.js`.

---

## 📝 Crear Usuarios en Firestore

Sigue estos pasos para crear los 2 usuarios en Firestore:

### Paso 1: Ir a Firebase Console

1. Abre tu navegador
2. Ve a: https://console.firebase.google.com/
3. Selecciona tu proyecto: **controldestock-725f3**

### Paso 2: Ir a Firestore Database

1. En el menú lateral, haz clic en **"Firestore Database"**
2. Si es la primera vez, haz clic en **"Crear base de datos"**
3. Selecciona **"Iniciar en modo de prueba"** (o modo producción)
4. Elige la ubicación (recomendado: southamerica-east1 para Argentina)
5. Haz clic en **"Habilitar"**

### Paso 3: Crear Colección "usuarios"

1. Haz clic en **"Iniciar colección"**
2. ID de la colección: `usuarios`
3. Haz clic en **"Siguiente"**

### Paso 4: Crear Usuario 1

**ID del documento:** `maria` (o el nombre que prefieras)

**Campos a agregar:**

| Campo | Tipo | Valor |
|-------|------|-------|
| `token` | string | `STOCK2026_MARIA_ABC123` |
| `inventory` | array | `[]` (array vacío) |
| `notes` | array | `[]` (array vacío) |
| `lastUpdate` | string | `2026-01-26T00:00:00.000Z` |

**Pasos:**
1. Haz clic en **"Agregar campo"**
2. Nombre del campo: `token`
3. Tipo: `string`
4. Valor: `STOCK2026_MARIA_ABC123`
5. Repite para los demás campos
6. Para `inventory` y `notes`, selecciona tipo **"array"** y déjalos vacíos
7. Haz clic en **"Guardar"**

### Paso 5: Crear Usuario 2

1. Haz clic en **"Agregar documento"**
2. **ID del documento:** `lucia` (o el nombre que prefieras)

**Campos a agregar:**

| Campo | Tipo | Valor |
|-------|------|-------|
| `token` | string | `STOCK2026_LUCIA_XYZ789` |
| `inventory` | array | `[]` (array vacío) |
| `notes` | array | `[]` (array vacío) |
| `lastUpdate` | string | `2026-01-26T00:00:00.000Z` |

3. Haz clic en **"Guardar"**

---

## 🔐 Credenciales de Acceso

Una vez creados los usuarios, estas serán las credenciales:

### Usuario 1
- **Usuario:** `maria`
- **Token:** `STOCK2026_MARIA_ABC123`

### Usuario 2
- **Usuario:** `lucia`
- **Token:** `STOCK2026_LUCIA_XYZ789`

> **Nota:** Puedes cambiar los nombres de usuario y tokens por los que prefieras. Solo asegúrate de que coincidan con lo que creas en Firestore.

---

## 🔒 Configurar Reglas de Seguridad

### Paso 1: Ir a Reglas

1. En Firestore Database, haz clic en la pestaña **"Reglas"**

### Paso 2: Copiar estas reglas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      // Permitir lectura y escritura para todos (modo desarrollo)
      allow read, write: if true;
    }
  }
}
```

### Paso 3: Publicar

1. Haz clic en **"Publicar"**
2. Espera la confirmación

> **Importante:** Estas reglas son para desarrollo. Para producción, deberías implementar validación de tokens más segura.

---

## 🚀 Probar la Aplicación

### Paso 1: Abrir la aplicación

1. Abre Visual Studio Code
2. Instala la extensión **"Live Server"** si no la tienes
3. Haz clic derecho en `index.html`
4. Selecciona **"Open with Live Server"**

### Paso 2: Hacer Login

1. La aplicación abrirá con el modal de login
2. Ingresa:
   - **Usuario:** `maria`
   - **Token:** `STOCK2026_MARIA_ABC123`
3. Haz clic en **"Ingresar"**

### Paso 3: Probar Funcionalidades

✅ **Agregar una prenda:**
1. Haz clic en **"+ Nueva Prenda"**
2. Completa los datos:
   - Tipo: `Remera`
   - Talla: `M`
   - Color: `Azul`
   - Cantidad: `10`
   - Precio: `2500`
   - Categoría: Selecciona un color
3. Haz clic en **"Guardar"**

✅ **Agregar una nota:**
1. Haz clic en la pestaña **"📝 Notas Compartidas"**
2. Escribe: `Recordar pedir más stock de remeras`
3. Haz clic en **"+"**

✅ **Exportar datos:**
1. Haz clic en **"📊 Descargar Excel (.xlsx)"**
2. Se descargará un archivo Excel con el inventario

✅ **Probar sincronización:**
1. Abre otra pestaña del navegador
2. Ingresa con el otro usuario (`lucia`)
3. Verifica que veas las mismas prendas y notas

---

## 📊 Verificar en Firestore

1. Ve a Firebase Console
2. Abre Firestore Database
3. Verás que los documentos de usuarios ahora tienen datos en `inventory` y `notes`

---

## 🎨 Cambiar Tema

- Haz clic en el botón ☀️ en el header
- La aplicación cambiará entre Dark Mode y Light Mode
- El tema se guarda automáticamente

---

## ❓ Solución de Problemas

### Error: "Usuario no encontrado"
- ✅ Verifica que el nombre de usuario sea exactamente igual al ID del documento en Firestore
- ✅ Firestore es case-sensitive: `Maria` ≠ `maria`

### Error: "Token incorrecto"
- ✅ Verifica que el token sea exactamente igual al que pusiste en Firestore
- ✅ No debe tener espacios al principio o al final

### No se guardan los datos
- ✅ Verifica que las reglas de Firestore permitan escritura
- ✅ Revisa la consola del navegador (F12) para ver errores

### La app no carga
- ✅ Asegúrate de usar Live Server (no abrir el archivo directamente)
- ✅ Verifica que todos los archivos JS estén en la carpeta `js/`

---

## 📝 Personalización

### Cambiar nombres de usuario

1. En Firestore, cambia el ID del documento
2. Actualiza las credenciales que compartes con las usuarias

### Cambiar tokens

1. En Firestore, edita el campo `token`
2. Usa tokens más seguros si lo deseas

### Agregar más categorías

1. Edita `index.html` (líneas 216-227)
2. Agrega más botones de color
3. Edita `estilos.css` para agregar el gradiente correspondiente

---

## ✅ Checklist Final

- [ ] Firestore Database creado
- [ ] Colección `usuarios` creada
- [ ] Usuario 1 creado con token
- [ ] Usuario 2 creado con token
- [ ] Reglas de seguridad configuradas
- [ ] Aplicación abierta con Live Server
- [ ] Login exitoso con usuario 1
- [ ] Prenda agregada correctamente
- [ ] Nota compartida creada
- [ ] Exportación a Excel funciona
- [ ] Sincronización verificada con usuario 2

---

¡Listo! Tu aplicación de Control de Stock está completamente configurada y lista para usar. 🎉
