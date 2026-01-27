# Control de Stock - Ropa

Aplicación web para gestión de inventario de ropa con sistema de notas compartidas.

## 🚀 Características

- ✅ Sistema de autenticación con usuario + token
- ✅ Gestión completa de inventario (agregar, editar, eliminar)
- ✅ Sistema de notas compartidas entre usuarios
- ✅ Exportación a Excel (.xlsx)
- ✅ Copiar datos al portapapeles
- ✅ Dark Mode / Light Mode
- ✅ Sincronización en tiempo real con Firebase
- ✅ DataCache para rendimiento óptimo

## 📋 Configuración de Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Firestore Database

### 2. Obtener Configuración

1. En la configuración del proyecto, copia los datos de configuración
2. Abre el archivo `js/data-manager.js`
3. Reemplaza la configuración en las líneas 7-13:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

### 3. Crear Usuarios en Firestore

En Firestore, crea una colección llamada `usuarios` con los siguientes documentos:

**Usuario 1:**
- ID del documento: `usuario1` (o el nombre que prefieras)
- Campos:
  ```json
  {
    "token": "TOKEN_SECRETO_1",
    "inventory": [],
    "notes": [],
    "lastUpdate": "2026-01-26T00:00:00.000Z"
  }
  ```

**Usuario 2:**
- ID del documento: `usuario2` (o el nombre que prefieras)
- Campos:
  ```json
  {
    "token": "TOKEN_SECRETO_2",
    "inventory": [],
    "notes": [],
    "lastUpdate": "2026-01-26T00:00:00.000Z"
  }
  ```

### 4. Configurar Reglas de Seguridad

En Firestore Rules, configura:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read, write: if true;  // Para desarrollo
      // Para producción, implementar validación de tokens
    }
  }
}
```

## 🔐 Credenciales de Acceso

Los usuarios deben ingresar con:
- **Usuario**: El ID del documento en Firestore (ej: `usuario1`)
- **Token**: El token secreto configurado en Firestore

## 🎨 Categorías de Prendas

La aplicación incluye 6 categorías con colores distintos:

1. **Remeras** - Naranja/Rojo
2. **Pantalones** - Azul/Cyan
3. **Vestidos** - Rosa/Rojo
4. **Accesorios** - Verde
5. **Calzado** - Púrpura/Rosa
6. **Otros** - Amarillo/Naranja

## 📊 Estructura de Datos

### Prenda (Inventory Item)
```javascript
{
  id: "unique_id",
  tipo: "Remera",
  talla: "M",
  color: "Azul",
  cantidad: 15,
  precio: 2500.00,
  categoria: "remeras",
  fechaCreacion: "2026-01-26T...",
  ultimaModificacion: "2026-01-26T...",
  creadoPor: "usuario1"
}
```

### Nota
```javascript
{
  id: "unique_id",
  texto: "Recordar pedir más stock",
  autor: "usuario1",
  fecha: "2026-01-26T..."
}
```

## 🚀 Cómo Usar

1. Abre `index.html` en un navegador (usa Live Server o similar)
2. Ingresa con tu usuario y token
3. Comienza a agregar prendas al inventario
4. Comparte notas con el otro usuario
5. Exporta datos cuando lo necesites

## 🛠️ Tecnologías

- HTML5
- CSS3 (con variables CSS para temas)
- JavaScript ES6+ (Modules)
- Firebase Firestore
- XLSX.js para exportación

## 📝 Notas Importantes

- Las notas son compartidas entre todos los usuarios
- El inventario es compartido entre todos los usuarios
- Los cambios se sincronizan en tiempo real
- El sistema usa dataCache para minimizar peticiones a Firebase
- Funciona offline con los datos en caché

## 🎯 Próximas Mejoras Sugeridas

- [ ] Historial de cambios
- [ ] Filtros avanzados
- [ ] Gráficos de stock
- [ ] Alertas de stock bajo
- [ ] Categorías personalizadas
- [ ] Imágenes de prendas

---

Desarrollado con el mismo diseño y arquitectura de la aplicación de Control de Tiempo.
