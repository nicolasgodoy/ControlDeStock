import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs, deleteDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC9Oa6gIrryUDt07QOgD7HxHzeapwGiv8Y",
    authDomain: "controldestock-725f3.firebaseapp.com",
    projectId: "controldestock-725f3",
    storageBucket: "controldestock-725f3.firebasestorage.app",
    messagingSenderId: "3831284562",
    appId: "1:3831284562:web:556b50ddf850610d4e708b",
    measurementId: "G-SXRFX2VN58"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class DataManager {
    constructor() {
        this.currentUser = null;
        this.dataCache = {
            inventory: [],
            sales: [],
            notes: []
        };
        this.unsubscribe = null;
        this.syncCallbacks = [];
    }

    // --- AUTENTICACIÓN ---

    async login(username, token) {
        try {
            console.log('🔐 Intentando login con usuario:', username);
            const docRef = doc(db, "Usuarios", username);
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

        const docRef = doc(db, "Usuarios", this.currentUser);
        this.unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                this.dataCache.inventory = data.inventory || [];
                this.dataCache.sales = data.sales || [];
                this.dataCache.notes = data.notes || [];
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
            const docRef = doc(db, "Usuarios", this.currentUser);
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
        const newItem = {
            id: this.generateId(),
            tipo: itemData.tipo,
            talla: itemData.talla,
            color: itemData.color,
            cantidad: parseInt(itemData.cantidad) || 0,
            precio: parseFloat(itemData.precio) || 0,
            categoria: itemData.categoria,
            fechaCreacion: new Date().toISOString(),
            ultimaModificacion: new Date().toISOString(),
            creadoPor: this.currentUser
        };

        this.dataCache.inventory.push(newItem);
        await this.saveInventory();
        return newItem;
    }

    async updateItem(id, itemData) {
        const index = this.dataCache.inventory.findIndex(item => item.id === id);
        if (index !== -1) {
            this.dataCache.inventory[index] = {
                ...this.dataCache.inventory[index],
                tipo: itemData.tipo,
                talla: itemData.talla,
                color: itemData.color,
                cantidad: parseInt(itemData.cantidad) || 0,
                precio: parseFloat(itemData.precio) || 0,
                categoria: itemData.categoria,
                ultimaModificacion: new Date().toISOString()
            };
            await this.saveInventory();
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
            const docRef = doc(db, "Usuarios", this.currentUser);
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
            const docRef = doc(db, "Usuarios", this.currentUser);
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

    async registerSale(itemId, quantity, cliente = "Consumidor Final", estado = "pagado") {
        const itemIndex = this.dataCache.inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return { success: false, message: "Producto no encontrado" };

        const item = this.dataCache.inventory[itemIndex];
        if (item.cantidad < quantity) {
            return { success: false, message: "Stock insuficiente" };
        }

        // 1. Descontar stock
        item.cantidad -= quantity;
        item.ultimaModificacion = new Date().toISOString();

        // 2. Registrar venta
        const newSale = {
            id: this.generateId(),
            itemId: item.id,
            producto: item.tipo,
            talla: item.talla,
            color: item.color,
            cantidad: quantity,
            precioUnitario: item.precio,
            totalVenta: item.precio * quantity,
            fecha: new Date().toISOString(),
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
                this.dataCache.inventory[itemIndex].cantidad += sale.cantidad;
                this.dataCache.inventory[itemIndex].ultimaModificacion = new Date().toISOString();
            }
        }

        this.dataCache.sales.splice(saleIndex, 1);
        const saved = await this.saveAllData();
        return { success: saved };
    }

    async saveAllData() {
        if (!this.currentUser) return false;

        try {
            const docRef = doc(db, "Usuarios", this.currentUser);
            await setDoc(docRef, {
                inventory: this.dataCache.inventory,
                sales: this.dataCache.sales,
                notes: this.dataCache.notes,
                lastUpdate: new Date().toISOString()
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
            const docRef = doc(db, "Usuarios", this.currentUser);
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
            const docRef = doc(db, "Usuarios", this.currentUser);
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
