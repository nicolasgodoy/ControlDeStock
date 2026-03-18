import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs, deleteDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class DataManager {
    constructor() {
        this.currentUser = null;
        this.dataCache = {
            inventory: [],
            sales: [],
            notes: [],
            capitalInvertido: {},
            tallaMapping: {
                "XS": "36",
                "S": "38",
                "M": "40",
                "L": "42",
                "XL": "44",
                "XXL": "46",
                "Única": "Única"
            }
        };
        this.unsubscribe = null;
        this.syncCallbacks = [];

        // Cloudinary Config
        this.cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        this.cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    }

    // --- AUTENTICACIÓN ---

    async login(username, token) {
        try {
            console.log('🔐 Intentando login con usuario:', username);
            const docRef = doc(db, "UsuariosControlStock", username);
            const docSnap = await getDoc(docRef);

            console.log('📄 Documento existe:', docSnap.exists());

            if (!docSnap.exists()) {
                console.warn('❌ Usuario no encontrado en Firebase');
                return { success: false, message: "Usuario no encontrado en la base de datos" };
            }

            const userData = docSnap.data();
            console.log('📊 Datos del usuario obtenidos:', { hasToken: !!userData.token });

            if (userData.token !== token) {
                console.warn('❌ Token incorrecto');
                return { success: false, message: "Token incorrecto" };
            }

            console.log('✅ Login exitoso');
            this.currentUser = username;
            this.startRealtimeSync();
            return { success: true, user: { name: username } };
        } catch (error) {
            console.error("❌ Error en login:", error);
            console.error("Código de error:", error.code);
            console.error("Mensaje de error:", error.message);

            // Mensajes de error más específicos
            if (error.code === 'permission-denied') {
                return { success: false, message: "Permiso denegado. Verifica las reglas de Firebase." };
            } else if (error.code === 'unavailable') {
                return { success: false, message: "Firebase no disponible. Verifica tu conexión a internet." };
            } else if (error.message.includes('network')) {
                return { success: false, message: "Error de red. Verifica tu conexión a internet." };
            }

            return { success: false, message: `Error: ${error.message}` };
        }
    }

    logout() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.currentUser = null;
        this.dataCache = { inventory: [], sales: [], notes: [] };
    }

    // --- SINCRONIZACIÓN EN TIEMPO REAL ---

    async startRealtimeSync() {
        if (!this.currentUser) return;

        if (this.unsubscribe) this.unsubscribe();

        const docRef = doc(db, "UsuariosControlStock", this.currentUser);
        this.unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                this.dataCache.inventory = data.inventory || [];
                this.dataCache.sales = data.sales || [];
                this.dataCache.notes = data.notes || [];

                // Migración y carga de capital
                const storedCapital = data.capitalInvertido;
                if (typeof storedCapital === 'number') {
                    // Si es un número (formato viejo), lo migramos a un objeto "general"
                    this.dataCache.capitalInvertido = { "general": storedCapital };
                } else {
                    this.dataCache.capitalInvertido = storedCapital || {};
                }

                this.notifySync(this.dataCache);
            }
        }, (error) => {
            console.error("Error en sincronización:", error);
        });
    }

    onDataSync(callback) {
        this.syncCallbacks.push(callback);
    }

    notifySync(data) {
        this.syncCallbacks.forEach(cb => cb(data));
    }

    // --- GESTIÓN DE INVENTARIO ---

    async getInventory() {
        // Retornar desde cache si está disponible
        if (this.dataCache.inventory.length > 0) {
            return this.dataCache.inventory;
        }

        // Si no hay cache, cargar desde Firebase
        if (!this.currentUser) return [];

        try {
            const docRef = doc(db, "UsuariosControlStock", this.currentUser);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.dataCache.inventory = data.inventory || [];
                return this.dataCache.inventory;
            }
        } catch (error) {
            console.error("Error al obtener inventario:", error);
        }

        return [];
    }

    async addItem(itemData) {
        // itemData.stockPorTalla es un objeto: { "M": 10, "L": 5 }
        const stockPorTalla = itemData.stockPorTalla || {};
        const totalCantidad = Object.values(stockPorTalla).reduce((a, b) => a + (parseInt(b) || 0), 0);

        // Determinar talla descriptiva para compatibilidad (ej: "M, L")
        const tallasDisponibles = Object.keys(stockPorTalla).filter(t => (parseInt(stockPorTalla[t]) || 0) > 0);
        const tallaLabel = tallasDisponibles.length > 0 ? tallasDisponibles.join(', ') : "Sin stock";

        const newItem = {
            id: this.generateId(),
            tipo: itemData.tipo,
            talla: tallaLabel, // Etiqueta para vista rápida
            stockPorTalla: stockPorTalla, // Nuevo campo detallado
            color: itemData.color,
            cantidad: totalCantidad,
            precio: parseFloat(itemData.precio) || 0,
            categoria: itemData.categoria,
            images: itemData.images || [], // Máximo 3 fotos
            fechaCreacion: new Date().toISOString(),
            ultimaModificacion: new Date().toISOString(),
            creadoPor: this.currentUser
        };

        this.dataCache.inventory.push(newItem);
        await this.saveAllData(); // Cambiado de saveInventory a saveAllData para consistencia
        return newItem;
    }

    async updateItem(id, itemData) {
        const index = this.dataCache.inventory.findIndex(item => item.id === id);
        if (index !== -1) {
            const stockPorTalla = itemData.stockPorTalla || {};
            const totalCantidad = Object.values(stockPorTalla).reduce((a, b) => a + (parseInt(b) || 0), 0);

            const tallasDisponibles = Object.keys(stockPorTalla).filter(t => (parseInt(stockPorTalla[t]) || 0) > 0);
            const tallaLabel = tallasDisponibles.length > 0 ? tallasDisponibles.join(', ') : "Sin stock";

            this.dataCache.inventory[index] = {
                ...this.dataCache.inventory[index],
                tipo: itemData.tipo,
                talla: tallaLabel,
                stockPorTalla: stockPorTalla,
                color: itemData.color,
                cantidad: totalCantidad,
                precio: parseFloat(itemData.precio) || 0,
                categoria: itemData.categoria,
                images: itemData.images || [], // Actualizar fotos
                ultimaModificacion: new Date().toISOString()
            };
            await this.saveAllData();
            return true;
        }
        return false;
    }

    async deleteItem(id) {
        this.dataCache.inventory = this.dataCache.inventory.filter(item => item.id !== id);
        await this.saveInventory();
        return true;
    }

    async saveInventory() {
        if (!this.currentUser) return false;

        try {
            const docRef = doc(db, "UsuariosControlStock", this.currentUser);
            await setDoc(docRef, {
                inventory: this.dataCache.inventory,
                sales: this.dataCache.sales,
                lastUpdate: new Date().toISOString()
            }, { merge: true });
            this.notifySync(this.dataCache);
            return true;
        } catch (error) {
            console.error("Error al guardar inventario:", error);
            return false;
        }
    }

    // --- GESTIÓN DE VENTAS ---

    async getSales() {
        if (this.dataCache.sales.length > 0) {
            return this.dataCache.sales;
        }

        if (!this.currentUser) return [];

        try {
            const docRef = doc(db, "UsuariosControlStock", this.currentUser);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.dataCache.sales = data.sales || [];
                return this.dataCache.sales;
            }
        } catch (error) {
            console.error("Error al obtener ventas:", error);
        }

        return [];
    }

    async registerSale(itemId, quantity, cliente = "Consumidor Final", estado = "pagado", tallaSeleccionada = null) {
        const itemIndex = this.dataCache.inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return { success: false, message: "Producto no encontrado" };

        const item = this.dataCache.inventory[itemIndex];

        // Verificar stock de la talla específica
        if (tallaSeleccionada && item.stockPorTalla) {
            const stockTalla = parseInt(item.stockPorTalla[tallaSeleccionada]) || 0;
            if (stockTalla < quantity) {
                return { success: false, message: `Stock insuficiente en talla ${tallaSeleccionada} (disponible: ${stockTalla})` };
            }
            // Descontar de la talla específica
            item.stockPorTalla[tallaSeleccionada] = stockTalla - quantity;
        } else {
            // Fallback para items sin stockPorTalla (migrados)
            if (item.cantidad < quantity) {
                return { success: false, message: "Stock insuficiente" };
            }
        }

        // 1. Descontar stock total
        item.cantidad -= quantity;
        item.ultimaModificacion = new Date().toISOString();

        // Actualizar etiqueta de tallas
        if (item.stockPorTalla) {
            const tallasDisponibles = Object.keys(item.stockPorTalla).filter(t => (parseInt(item.stockPorTalla[t]) || 0) > 0);
            item.talla = tallasDisponibles.length > 0 ? tallasDisponibles.join(', ') : "Sin stock";
        }

        // 2. Registrar venta
        const newSale = {
            id: this.generateId(),
            itemId: item.id,
            producto: item.tipo,
            talla: tallaSeleccionada || item.talla,
            color: item.color,
            cantidad: quantity,
            precioUnitario: item.precio,
            totalVenta: item.precio * quantity,
            fecha: new Date().toISOString(),
            itemFechaCreacion: item.fechaCreacion || null, // Guardar fecha de creación del item original
            vendedor: this.currentUser,
            cliente: cliente || "Consumidor Final",
            estado: estado // 'pagado' o 'deuda'
        };

        if (!this.dataCache.sales) this.dataCache.sales = [];
        this.dataCache.sales.unshift(newSale);

        // 3. Guardar todo
        const saved = await this.saveAllData();
        return { success: saved, sale: newSale };
    }

    async updateSaleStatus(saleId, newStatus) {
        if (!this.dataCache.sales) return { success: false, message: "No hay ventas registradas" };

        const saleIndex = this.dataCache.sales.findIndex(s => s.id === saleId);
        if (saleIndex === -1) return { success: false, message: "Venta no encontrada" };

        this.dataCache.sales[saleIndex].estado = newStatus;
        if (newStatus === 'pagado') {
            this.dataCache.sales[saleIndex].fechaPago = new Date().toISOString();
        }

        const saved = await this.saveAllData();
        return { success: saved };
    }
    async deleteSale(saleId, restoreStock = true) {
        const saleIndex = this.dataCache.sales.findIndex(s => s.id === saleId);
        if (saleIndex === -1) return { success: false, message: "Venta no encontrada" };

        const sale = this.dataCache.sales[saleIndex];

        if (restoreStock) {
            const itemIndex = this.dataCache.inventory.findIndex(i => i.id === sale.itemId);
            if (itemIndex !== -1) {
                const item = this.dataCache.inventory[itemIndex];
                item.cantidad += sale.cantidad;

                // Restaurar en la talla específica si existe
                if (sale.talla && item.stockPorTalla && item.stockPorTalla[sale.talla] !== undefined) {
                    item.stockPorTalla[sale.talla] = (parseInt(item.stockPorTalla[sale.talla]) || 0) + sale.cantidad;

                    // Actualizar etiqueta tallas
                    const tallasDisponibles = Object.keys(item.stockPorTalla).filter(t => (parseInt(item.stockPorTalla[t]) || 0) > 0);
                    item.talla = tallasDisponibles.length > 0 ? tallasDisponibles.join(', ') : "Sin stock";
                }

                item.ultimaModificacion = new Date().toISOString();
            }
        }

        this.dataCache.sales.splice(saleIndex, 1);
        const saved = await this.saveAllData();
        return { success: saved };
    }

    async updateCapital(amount, month = "general") {
        if (!this.dataCache.capitalInvertido || typeof this.dataCache.capitalInvertido !== 'object') {
            this.dataCache.capitalInvertido = {};
        }
        this.dataCache.capitalInvertido[month] = parseFloat(amount) || 0;
        return await this.saveAllData();
    }

    getFinancialStats(monthFilter = null) {
        const sales = this.dataCache.sales || [];
        const inventory = this.dataCache.inventory || [];
        const month = monthFilter || "general";

        // Obtener capital para el mes específico. 
        // Si hay mes pero no hay capital cargado para ese mes, es 0 (no usamos general como fallback si el usuario está filtrando un lote específico)
        const capitalInvertidoMap = this.dataCache.capitalInvertido || {};
        let capital = 0;
        if (monthFilter) {
            capital = capitalInvertidoMap[monthFilter] || 0;
        } else {
            capital = capitalInvertidoMap["general"] || 0;
        }

        // Ventas Totales (Históricas) - Esto se usa para el estado de recuperación global
        const totalVentas = sales.reduce((sum, s) => sum + (s.totalVenta || 0), 0);

        // Ventas según el lote (mes de creación del item)
        let ventasMensuales = 0;
        if (monthFilter) {
            ventasMensuales = sales
                .filter(s => {
                    // 1. Intentar usar la fecha guardada en la venta (para nuevas ventas)
                    if (s.itemFechaCreacion) {
                        return s.itemFechaCreacion.startsWith(monthFilter);
                    }
                    // 2. Fallback: buscar el item en el inventario actual
                    const item = inventory.find(i => i.id === s.itemId);
                    if (item && item.fechaCreacion) {
                        return item.fechaCreacion.startsWith(monthFilter);
                    }
                    // 3. Última opción: usar la fecha de la venta (comportamiento anterior)
                    return s.fecha.startsWith(monthFilter);
                })
                .reduce((sum, s) => sum + (s.totalVenta || 0), 0);
        } else {
            ventasMensuales = totalVentas;
        }

        // Ganancia Neta: Ventas del filtro vs Capital del filtro
        const gananciaNeta = ventasMensuales - capital;

        // Porcentaje recuperado: Si hay filtro, se basa en las ventas del lote. Si no, en las totales.
        const ventasParaRecuperacion = monthFilter ? ventasMensuales : totalVentas;
        const porcentajeRecuperado = capital > 0 ? (ventasParaRecuperacion / capital) * 100 : 0;

        // Nuevas métricas para el sidebar
        let prendasMensuales = 0;
        let stockMensual = 0;
        if (monthFilter) {
            const filteredInventory = inventory.filter(i => (i.fechaCreacion || i.fecha || '').startsWith(monthFilter));
            prendasMensuales = filteredInventory.length;
            stockMensual = filteredInventory.reduce((sum, i) => sum + (parseInt(i.cantidad) || 0), 0);
        } else {
            prendasMensuales = inventory.length;
            stockMensual = inventory.reduce((sum, i) => sum + (parseInt(i.cantidad) || 0), 0);
        }

        return {
            capitalInvertido: capital,
            totalVentas: totalVentas,
            ventasMensuales: ventasMensuales,
            gananciaNeta: gananciaNeta,
            porcentajeRecuperado: porcentajeRecuperado,
            prendasMensuales,
            stockMensual
        };
    }

    async saveAllData() {
        if (!this.currentUser) return false;

        try {
            const docRef = doc(db, "UsuariosControlStock", this.currentUser);
            await setDoc(docRef, {
                inventory: this.dataCache.inventory,
                sales: this.dataCache.sales,
                notes: this.dataCache.notes,
                capitalInvertido: this.dataCache.capitalInvertido || {},
                lastUpdate: new Date().toISOString(),
                updatedBy: this.currentUser
            }, { merge: true });
            this.notifySync(this.dataCache);
            return true;
        } catch (error) {
            console.error("Error al guardar datos:", error);
            return false;
        }
    }

    // --- GESTIÓN DE NOTAS ---

    async getNotes() {
        // Retornar desde cache si está disponible
        if (this.dataCache.notes.length > 0) {
            return this.dataCache.notes;
        }

        // Si no hay cache, cargar desde Firebase
        if (!this.currentUser) return [];

        try {
            const docRef = doc(db, "UsuariosControlStock", this.currentUser);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.dataCache.notes = data.notes || [];
                return this.dataCache.notes;
            }
        } catch (error) {
            console.error("Error al obtener notas:", error);
        }

        return [];
    }

    async addNote(texto) {
        if (!texto.trim()) return false;

        const newNote = {
            id: this.generateId(),
            texto: texto.trim(),
            autor: this.currentUser,
            fecha: new Date().toISOString()
        };

        this.dataCache.notes.unshift(newNote);
        await this.saveNotes();
        return newNote;
    }

    async deleteNote(id) {
        this.dataCache.notes = this.dataCache.notes.filter(note => note.id !== id);
        await this.saveNotes();
        return true;
    }

    async saveNotes() {
        if (!this.currentUser) return false;

        try {
            const docRef = doc(db, "UsuariosControlStock", this.currentUser);
            await setDoc(docRef, {
                notes: this.dataCache.notes,
                lastUpdate: new Date().toISOString()
            }, { merge: true });
            this.notifySync(this.dataCache);
            return true;
        } catch (error) {
            console.error("Error al guardar notas:", error);
            return false;
        }
    }

    // --- EXPORTACIÓN ---

    async copyToClipboard() {
        try {
            const inventory = await this.getInventory();
            if (!inventory || inventory.length === 0) return false;

            // Header
            let tsv = "Tipo\tTalla\tColor\tCantidad\tPrecio\tCategoría\n";

            // Rows
            inventory.forEach(item => {
                tsv += `${item.tipo}\t${item.talla}\t${item.color}\t${item.cantidad}\t$${item.precio.toFixed(2)}\t${item.categoria}\n`;
            });

            await navigator.clipboard.writeText(tsv);
            return true;
        } catch (error) {
            console.error("Error al copiar al portapapeles:", error);
            return false;
        }
    }

    async exportToExcel() {
        try {
            const inventory = await this.getInventory();
            if (!inventory || inventory.length === 0) {
                alert("No hay datos para exportar");
                return false;
            }

            // Preparar datos para XLSX
            const rows = inventory.map(item => ({
                "Tipo": item.tipo,
                "Talla": item.talla,
                "Color": item.color,
                "Cantidad": item.cantidad,
                "Precio": `$${item.precio.toFixed(2)}`,
                "Categoría": item.categoria,
                "Última Modificación": new Date(item.ultimaModificacion).toLocaleDateString()
            }));

            // Crear libro y hoja
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");

            // Generar archivo y descargar
            XLSX.writeFile(workbook, `Inventario_Stock_${new Date().toISOString().split('T')[0]}.xlsx`);
            return true;
        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            alert("Error al exportar a Excel. Asegúrate de que la librería XLSX esté cargada.");
            return false;
        }
    }

    async exportSalesToExcel() {
        try {
            const sales = await this.getSales();
            if (!sales || sales.length === 0) {
                alert("No hay ventas registradas para exportar");
                return false;
            }

            // Preparar datos para XLSX
            const rows = sales.map(sale => ({
                "Fecha": new Date(sale.fecha).toLocaleDateString(),
                "Hora": new Date(sale.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                "Producto": sale.producto,
                "Talla": sale.talla,
                "Color": sale.color,
                "Cliente": sale.cliente || "Consumidor Final",
                "Cantidad": sale.cantidad,
                "Precio Unit.": `$${sale.precioUnitario.toFixed(2)}`,
                "Total Venta": `$${sale.totalVenta.toFixed(2)}`,
                "Estado": (sale.estado === 'pagado' ? 'Pagado' : 'DEUDA'),
                "Vendedor": sale.vendedor
            }));
            // Crear libro y hoja
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

            // Generar archivo y descargar
            XLSX.writeFile(workbook, `Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
            return true;
        } catch (error) {
            console.error("Error al exportar reporte de ventas:", error);
            alert("Error al exportar reporte de ventas.");
            return false;
        }
    }

    async exportBalanceToExcel(monthFilter = null) {
        try {
            const stats = this.getFinancialStats(monthFilter);

            // Preparar datos para reporte
            const rows = [
                { "Concepto": "Capital Invertido Total", "Monto": `$${stats.capitalInvertido.toFixed(2)}` },
                { "Concepto": "Ventas Históricas Totales", "Monto": `$${stats.totalVentas.toFixed(2)}` },
                { "Concepto": monthFilter ? `Ventas de ${monthFilter}` : "Ventas del Período", "Monto": `$${stats.ventasMensuales.toFixed(2)}` },
                { "Concepto": "Ganancia Neta (Total)", "Monto": `$${stats.gananciaNeta.toFixed(2)}` },
                { "Concepto": "Porcentaje de Recuperación", "Monto": `${stats.porcentajeRecuperado.toFixed(1)}%` },
                { "Concepto": "Fecha de Reporte", "Monto": new Date().toLocaleDateString() }
            ];

            // Crear libro y hoja
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Balance");

            // Nombre del archivo
            const fileName = `Balance_Financiero_${monthFilter ? monthFilter : 'General'}_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Generar archivo y descargar
            XLSX.writeFile(workbook, fileName);
            return true;
        } catch (error) {
            console.error("Error al exportar reporte de balance:", error);
            alert("Error al exportar reporte de balance.");
            return false;
        }
    }

    // --- CLOUDINARY UPLOAD ---

    async uploadImage(file) {
        if (!this.cloudinaryCloudName || !this.cloudinaryUploadPreset) {
            console.error("Cloudinary config missing");
            throw new Error("Configuración de Cloudinary ausente. Por favor configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en el archivo .env");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", this.cloudinaryUploadPreset);
        formData.append("folder", `AppcontrolStock`);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.cloudinaryCloudName}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || "Error al subir imagen a Cloudinary");
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("Error uploading to Cloudinary:", error);
            throw error;
        }
    }

    // --- UTILIDADES ---

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getTotalItems() {
        const count = this.dataCache.inventory ? this.dataCache.inventory.length : 0;
        console.log('📊 Calculando Total Prendas (modelos):', count);
        return count;
    }

    getTotalStock() {
        if (!this.dataCache.inventory) return 0;

        const total = this.dataCache.inventory.reduce((sum, item) => {
            // Asegurar que cantidad sea un número para evitar errores de tipo sum + "10" = "010"
            const qty = parseInt(item.cantidad) || 0;
            return sum + qty;
        }, 0);

        console.log('📊 Calculando Stock Total (unidades):', total);
        return total;
    }
}

const dataManager = new DataManager();
export default dataManager;
