import dataManager from './data-manager.js';

class UIController {
    constructor() {
        this.currentEditingId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.loadTheme();
    }

    initializeElements() {
        // Modals
        this.loginModal = document.getElementById('loginModal');
        this.itemModal = document.getElementById('itemModal');
        this.mainApp = document.getElementById('mainApp');

        // Views
        this.viewInventory = document.getElementById('viewInventory');
        this.viewSales = document.getElementById('viewSales');
        this.viewNotes = document.getElementById('viewNotes');

        // Tabs
        this.tabInventory = document.getElementById('tabInventory');
        this.tabSales = document.getElementById('tabSales');
        this.tabNotes = document.getElementById('tabNotes');

        // Grids/Lists
        this.inventoryGrid = document.getElementById('inventoryGrid');
        this.salesTableBody = document.getElementById('salesTableBody');
        this.notesList = document.getElementById('notesList');

        // Inputs
        this.searchInput = document.getElementById('searchInput');
        this.filterCategory = document.getElementById('filterCategory');
        this.salesFilterDate = document.getElementById('salesFilterDate');
        this.salesSearchInput = document.getElementById('salesSearchInput');
        this.noteInput = document.getElementById('noteInput');

        // Stats
        this.totalItems = document.getElementById('totalItems');
        this.totalStock = document.getElementById('totalStock');
        this.currentUserDisplay = document.getElementById('currentUserDisplay');
        this.userName = document.getElementById('userName');
        this.userInitialLetter = document.getElementById('userInitialLetter');
        this.btnExportExcel = document.getElementById('btnExportExcel');

        // Custom Modals
        this.confirmModal = document.getElementById('confirmModal');
        this.saleModal = document.getElementById('saleModal');
        this.confirmTitle = document.getElementById('confirmTitle');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.btnConfirmOk = document.getElementById('btnConfirmOk');
        this.btnConfirmCancel = document.getElementById('btnConfirmCancel');
        this.saleQuantityInput = document.getElementById('saleQuantity');
        this.saleCustomerInput = document.getElementById('saleCustomer');
        this.saleStatusInput = document.getElementById('saleStatus');
        this.saleItemInfo = document.getElementById('saleItemInfo');
        this.btnConfirmSale = document.getElementById('btnConfirmSale');

        this.currentSalesPage = 1;
        this.salesPerPage = 10;
        this.activeTab = 'inventory';
    }

    attachEventListeners() {
        // Login
        document.getElementById('btnLogin').addEventListener('click', () => this.handleLogin());
        document.getElementById('loginToken').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Logout
        document.getElementById('btnLogout').addEventListener('click', () => this.handleLogout());

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Tabs
        this.tabInventory.addEventListener('click', () => this.switchTab('inventory'));
        this.tabSales.addEventListener('click', () => this.switchTab('sales'));
        this.tabNotes.addEventListener('click', () => this.switchTab('notes'));

        // Inventory Actions
        document.getElementById('btnAddItem').addEventListener('click', () => this.showItemModal());
        document.getElementById('btnExportExcel').addEventListener('click', () => this.exportExcel());
        document.getElementById('btnCopy').addEventListener('click', () => this.copyToClipboard());

        // Search & Filter
        this.searchInput.addEventListener('input', () => this.filterInventory());
        this.filterCategory.addEventListener('change', () => this.filterInventory());
        this.salesFilterDate.addEventListener('change', () => this.renderSales());
        this.salesSearchInput.addEventListener('input', () => this.renderSales());

        // Item Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.closeItemModal());
        document.getElementById('btnCancelItem').addEventListener('click', () => this.closeItemModal());
        document.getElementById('btnSaveItem').addEventListener('click', () => this.saveItem());

        // Color Selector
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectColor(e.target));
        });

        // Notes
        document.getElementById('btnAddNote').addEventListener('click', () => this.addNote());
        this.noteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addNote();
        });

        // Context Menu / Overlay clicks to close modals
        window.addEventListener('click', (e) => {
            if (e.target === this.confirmModal) this.closeConfirm();
            if (e.target === this.saleModal) this.closeSaleModal();
            if (e.target === this.itemModal) this.closeItemModal();
        });

        // Close buttons
        document.getElementById('closeSaleModal').addEventListener('click', () => this.closeSaleModal());
        this.btnConfirmCancel.addEventListener('click', () => this.closeConfirm());

        // Data Sync
        dataManager.onDataSync((data) => {
            this.renderInventory(data.inventory);
            this.renderSales(data.sales);
            this.renderNotes(data.notes);
            this.updateStats();
        });
    }

    // --- AUTENTICACIÓN ---

    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const token = document.getElementById('loginToken').value.trim();
        const errorDiv = document.getElementById('loginError');

        if (!username || !token) {
            errorDiv.textContent = 'Por favor completa todos los campos';
            return;
        }

        const result = await dataManager.login(username, token);

        if (result.success) {
            this.loginModal.style.display = 'none';
            this.mainApp.style.display = 'block';
            this.currentUserDisplay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> <span class="hide-mobile">${username}</span>`;
            this.userName.textContent = username;

            // Set initial
            if (this.userInitialLetter) {
                this.userInitialLetter.textContent = username.charAt(0).toUpperCase();
            }

            // Cargar datos
            await this.loadData();
            this.showNotification('¡Bienvenido/a!');
        } else {
            errorDiv.textContent = result.message;
        }
    }

    handleLogout() {
        if (confirm('¿Seguro que deseas cerrar sesión?')) {
            dataManager.logout();
            this.loginModal.style.display = 'flex';
            this.mainApp.style.display = 'none';
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginToken').value = '';
            document.getElementById('loginError').textContent = '';
            this.inventoryGrid.innerHTML = '';
            this.notesList.innerHTML = '';
        }
    }

    // --- CARGA DE DATOS ---

    async loadData() {
        const inventory = await dataManager.getInventory();
        const sales = await dataManager.getSales();
        const notes = await dataManager.getNotes();

        this.renderInventory(inventory);
        this.renderSales(sales);
        this.renderNotes(notes);
        this.updateStats();
    }

    // --- VENTAS ---

    renderSales(sales = dataManager.dataCache.sales) {
        if (!sales || sales.length === 0) {
            this.salesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                        No hay ventas registradas
                    </td>
                </tr>
            `;
            document.getElementById('salesPagination').innerHTML = '';
            return;
        }

        // Filtros
        const searchTerm = this.salesSearchInput.value.toLowerCase();
        const filterDate = this.salesFilterDate.value;

        let filtered = sales;
        if (searchTerm) {
            filtered = filtered.filter(s => s.producto.toLowerCase().includes(searchTerm));
        }
        if (filterDate) {
            filtered = filtered.filter(s => s.fecha.startsWith(filterDate));
        }

        // Paginación
        const totalSales = filtered.length;
        const startIndex = (this.currentSalesPage - 1) * this.salesPerPage;
        const pagedSales = filtered.slice(startIndex, startIndex + this.salesPerPage);

        this.salesTableBody.innerHTML = pagedSales.map(sale => this.createSaleRow(sale)).join('');
        this.renderSalesPagination(totalSales);
    }

    createSaleRow(sale) {
        const date = new Date(sale.fecha);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const statusClass = sale.estado === 'pagado' ? 'status-paid' : 'status-debt';
        const statusText = sale.estado === 'pagado' ? 'PAGADO' : 'DEUDA';

        return `
            <tr>
                <td>
                    <div style="font-weight: 500;">${formattedDate}</div>
                    <div style="font-size: 11px; opacity: 0.6;">${formattedTime}</div>
                </td>
                <td>${sale.producto}</td>
                <td><span class="info-value" style="font-size: 12px;">${sale.talla}</span></td>
                <td><div style="font-size: 13px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${sale.cliente}">${sale.cliente}</div></td>
                <td>${sale.cantidad}</td>
                <td style="color: #20e2d7; font-weight: bold;">$${sale.totalVenta.toFixed(2)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        ${sale.estado === 'deuda' ? `
                            <button class="btn-trash" style="color: #43e97b;" data-pay-sale="${sale.id}" title="Marcar como pagado">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                        ` : ''}
                        <button class="btn-trash" data-delete-sale="${sale.id}" title="Anular venta">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderSalesPagination(totalSales) {
        // Limpiar y Reasignar Listeners borrar venta
        const deleteBtns = this.salesTableBody.querySelectorAll('[data-delete-sale]');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const saleId = btn.getAttribute('data-delete-sale');
                this.handleDeleteSale(saleId);
            });
        });

        // Listeners Marcar como pagado
        const payBtns = this.salesTableBody.querySelectorAll('[data-pay-sale]');
        payBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const saleId = btn.getAttribute('data-pay-sale');
                this.handleMarkAsPaid(saleId);
            });
        });

        const totalPages = Math.ceil(totalSales / this.salesPerPage);
        const container = document.getElementById('salesPagination');

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        // Listeners paginación
        container.querySelectorAll('.btn-page[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentSalesPage = parseInt(e.target.dataset.page);
                this.renderSales();
                container.scrollIntoView({ behavior: 'smooth' });
            });
        });

        const prevBtn = document.getElementById('prevSalesPage');
        const nextBtn = document.getElementById('nextSalesPage');

        if (prevBtn) prevBtn.addEventListener('click', () => {
            this.currentSalesPage--;
            this.renderSales();
        });

        if (nextBtn) nextBtn.addEventListener('click', () => {
            this.currentSalesPage++;
            this.renderSales();
        });
    }

    async quickSell(id) {
        const item = dataManager.dataCache.inventory.find(i => i.id === id);
        if (!item) return;

        // Reset and Clear Modal
        this.saleQuantityInput.value = 1;
        this.saleCustomerInput.value = "";
        this.saleStatusInput.value = "pagado";
        document.getElementById('saleError').style.display = 'none';
        this.saleItemInfo.innerHTML = `
            <div style="font-weight: bold; font-size: 16px;">${item.tipo}</div>
            <div style="font-size: 13px; color: #bbc0ff; margin-top: 5px;">Talla: ${item.talla} | Color: ${item.color}</div>
            <div style="font-size: 13px; color: #20e2d7; margin-top: 3px;">Stock disponible: ${item.cantidad}</div>
        `;

        this.saleModal.style.display = 'flex';
        this.saleQuantityInput.focus();

        // One-time listener for the confirm button
        const confirmBtn = this.btnConfirmSale;
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        this.btnConfirmSale = newConfirmBtn;

        this.btnConfirmSale.addEventListener('click', async () => {
            const qty = parseInt(this.saleQuantityInput.value);
            const cliente = this.saleCustomerInput.value.trim();
            const estado = this.saleStatusInput.value;
            const errorDiv = document.getElementById('saleError');

            if (isNaN(qty) || qty <= 0) {
                errorDiv.textContent = "Cantidad no válida";
                errorDiv.style.display = 'block';
                return;
            }

            if (qty > item.cantidad) {
                errorDiv.textContent = "No hay suficiente stock";
                errorDiv.style.display = 'block';
                return;
            }

            const result = await dataManager.registerSale(id, qty, cliente, estado);
            if (result.success) {
                this.showNotification(`Venta registrada: ${qty} x ${item.tipo}`);
                this.closeSaleModal();
            } else {
                errorDiv.textContent = "Error: " + result.message;
                errorDiv.style.display = 'block';
            }
        });
    }

    closeSaleModal() {
        this.saleModal.style.display = 'none';
    }

    async handleMarkAsPaid(saleId) {
        const sale = dataManager.dataCache.sales.find(s => s.id === saleId);
        if (!sale) return;

        this.showConfirm(
            "Confirmar Pago",
            `¿Deseas marcar la venta de <b>${sale.producto}</b> a favor de <b>${sale.cliente}</b> como PAGADA?`,
            async () => {
                const result = await dataManager.updateSaleStatus(saleId, 'pagado');
                if (result.success) {
                    this.showNotification('Estado actualizado a PAGADO');
                } else {
                    alert('Error al actualizar estado');
                }
            }
        );
    }

    async handleDeleteSale(id) {
        const sale = dataManager.dataCache.sales.find(s => s.id === id);
        if (!sale) return;

        this.showConfirm(
            "Anular Venta",
            `¿Estás seguro de anular la venta de <b>${sale.cantidad} x ${sale.producto}</b>?<br><br>El stock será devuelto al inventario.`,
            async () => {
                const result = await dataManager.deleteSale(id, true);
                if (result.success) {
                    this.showNotification('Venta anulada y stock restaurado');
                } else {
                    alert('Error al anular venta: ' + result.message);
                }
            }
        );
    }

    // --- MODAL DE CONFIRMACIÓN PERSONALIZADO ---

    showConfirm(title, message, onOk) {
        this.confirmTitle.textContent = title;
        this.confirmMessage.innerHTML = message;
        this.confirmModal.style.display = 'flex';

        // Reemplazar el botón para limpiar listeners viejos
        const oldOkBtn = this.btnConfirmOk;
        const newOkBtn = oldOkBtn.cloneNode(true);
        oldOkBtn.parentNode.replaceChild(newOkBtn, oldOkBtn);
        this.btnConfirmOk = newOkBtn;

        this.btnConfirmOk.addEventListener('click', () => {
            onOk();
            this.closeConfirm();
        });
    }

    closeConfirm() {
        this.confirmModal.style.display = 'none';
    }

    // --- INVENTARIO ---

    renderInventory(items) {
        if (!items || items.length === 0) {
            this.inventoryGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📦</div>
                    <p>No hay prendas en el inventario</p>
                    <p style="font-size: 14px; margin-top: 10px;">Haz clic en "+ Nueva Prenda" para comenzar</p>
                </div>
            `;
            return;
        }

        this.inventoryGrid.innerHTML = items.map(item => this.createItemCard(item)).join('');

        // Actualizar estadísticas cada vez que el inventario cambie
        this.updateStats();

        // Attach event listeners to cards
        items.forEach(item => {
            const editBtn = document.querySelector(`[data-edit-id="${item.id}"]`);
            const deleteBtn = document.querySelector(`[data-delete-id="${item.id}"]`);
            const sellBtn = document.querySelector(`[data-sell-id="${item.id}"]`);

            if (editBtn) editBtn.addEventListener('click', () => this.editItem(item.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteItem(item.id));
            if (sellBtn) sellBtn.addEventListener('click', () => this.quickSell(item.id));
        });
    }

    createItemCard(item) {
        return `
            <div class="card">
                <div class="card-banner banner-${item.categoria}"></div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="card-title">${item.tipo}</div>
                    </div>
                    
                    <div class="card-info">
                        <div class="info-row">
                            <span class="info-label">Talla:</span>
                            <span class="info-value">${item.talla}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Color:</span>
                            <span class="info-value">${item.color}</span>
                        </div>
                    </div>

                    <div class="card-stock">
                        <div class="stock-label">Stock Disponible</div>
                        <div class="stock-value">${item.cantidad}</div>
                        <div class="stock-price">$${item.precio.toFixed(2)}</div>
                    </div>

                    <div class="card-actions">
                        <button class="btn btn-sell-quick" data-sell-id="${item.id}" title="Registrar Venta">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                            Vender
                        </button>
                        <button class="btn btn-edit" data-edit-id="${item.id}" title="Editar Prenda">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn btn-delete" data-delete-id="${item.id}" title="Eliminar Prenda">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    filterInventory() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const category = this.filterCategory.value;

        let filtered = dataManager.dataCache.inventory;

        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.tipo.toLowerCase().includes(searchTerm) ||
                item.color.toLowerCase().includes(searchTerm) ||
                item.talla.toLowerCase().includes(searchTerm)
            );
        }

        if (category) {
            filtered = filtered.filter(item => item.categoria === category);
        }

        this.renderInventory(filtered);
    }

    // --- MODAL DE ITEM ---

    showItemModal(item = null) {
        this.currentEditingId = item ? item.id : null;
        const title = document.getElementById('itemModalTitle');

        if (item) {
            title.textContent = 'Editar Prenda';
            document.getElementById('itemTipo').value = item.tipo;
            document.getElementById('itemTalla').value = item.talla;
            document.getElementById('itemColor').value = item.color;
            document.getElementById('itemCantidad').value = item.cantidad;
            document.getElementById('itemPrecio').value = item.precio;
            document.getElementById('itemCategoria').value = item.categoria;

            // Select color
            const colorBtn = document.querySelector(`[data-color="${item.categoria}"]`);
            if (colorBtn) this.selectColor(colorBtn);
        } else {
            title.textContent = 'Nueva Prenda';
            document.getElementById('itemTipo').value = '';
            document.getElementById('itemTalla').value = 'M';
            document.getElementById('itemColor').value = '';
            document.getElementById('itemCantidad').value = '';
            document.getElementById('itemPrecio').value = '';
            document.getElementById('itemCategoria').value = 'remeras';

            // Select first color
            const firstColor = document.querySelector('.color-option');
            if (firstColor) this.selectColor(firstColor);
        }

        this.itemModal.style.display = 'flex';
    }

    closeItemModal() {
        this.itemModal.style.display = 'none';
        this.currentEditingId = null;
    }

    selectColor(element) {
        document.querySelectorAll('.color-option').forEach(btn => btn.classList.remove('selected'));
        element.classList.add('selected');
        document.getElementById('itemCategoria').value = element.dataset.color;
    }

    async saveItem() {
        const itemData = {
            tipo: document.getElementById('itemTipo').value.trim(),
            talla: document.getElementById('itemTalla').value,
            color: document.getElementById('itemColor').value.trim(),
            cantidad: document.getElementById('itemCantidad').value,
            precio: document.getElementById('itemPrecio').value,
            categoria: document.getElementById('itemCategoria').value
        };

        if (!itemData.tipo || !itemData.color) {
            alert('Por favor completa los campos obligatorios');
            return;
        }

        if (this.currentEditingId) {
            await dataManager.updateItem(this.currentEditingId, itemData);
            this.showNotification('Prenda actualizada');
        } else {
            await dataManager.addItem(itemData);
            this.showNotification('Prenda agregada');
        }

        this.closeItemModal();
        this.updateStats();
    }

    async editItem(id) {
        const item = dataManager.dataCache.inventory.find(i => i.id === id);
        if (item) {
            this.showItemModal(item);
        }
    }

    async deleteItem(id) {
        const item = dataManager.dataCache.inventory.find(i => i.id === id);
        if (!item) return;

        this.showConfirm(
            "Eliminar Prenda",
            `¿Estás seguro de eliminar <b>"${item.tipo}"</b> del inventario? Esta acción no se puede deshacer.`,
            async () => {
                await dataManager.deleteItem(id);
                this.showNotification('Prenda eliminada');
                this.updateStats();
            }
        );
    }

    // --- NOTAS ---

    renderNotes(notes) {
        if (!notes || notes.length === 0) {
            this.notesList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 36px; margin-bottom: 15px;">📝</div>
                    <p>No hay notas compartidas</p>
                </div>
            `;
            return;
        }

        this.notesList.innerHTML = notes.map(note => this.createNoteItem(note)).join('');

        // Attach delete listeners
        notes.forEach(note => {
            const deleteBtn = document.querySelector(`[data-delete-note="${note.id}"]`);
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteNote(note.id));
            }
        });
    }

    createNoteItem(note) {
        const date = new Date(note.fecha);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="note-item">
                <div class="note-header">
                    <span class="note-author">👤 ${note.autor}</span>
                    <span class="note-date">${formattedDate}</span>
                </div>
                <div class="note-text">${note.texto}</div>
                <button class="btn-delete-note" data-delete-note="${note.id}">×</button>
            </div>
        `;
    }

    async addNote() {
        const texto = this.noteInput.value.trim();
        if (!texto) return;

        await dataManager.addNote(texto);
        this.noteInput.value = '';
        this.showNotification('Nota agregada');
    }

    async deleteNote(id) {
        if (confirm('¿Eliminar esta nota?')) {
            await dataManager.deleteNote(id);
            this.showNotification('Nota eliminada');
        }
    }

    // --- NAVEGACIÓN ---

    switchTab(tab) {
        this.activeTab = tab;
        const tabs = ['inventory', 'sales', 'notes'];

        tabs.forEach(t => {
            const btn = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
            const view = document.getElementById(`view${t.charAt(0).toUpperCase() + t.slice(1)}`);

            if (t === tab) {
                btn.classList.add('active');
                view.style.display = 'block';
            } else {
                btn.classList.remove('active');
                view.style.display = 'none';
            }
        });

        // Actualizar botón de exportación
        if (tab === 'sales') {
            this.btnExportExcel.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Descargar Reporte Ventas`;
            this.btnExportExcel.style.backgroundColor = '#5847eb';
            this.btnExportExcel.style.color = 'white';
        } else {
            this.btnExportExcel.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Descargar Excel (.xlsx)`;
            this.btnExportExcel.style.backgroundColor = '#43e97b';
            this.btnExportExcel.style.color = '#1c204b';
        }
    }

    // --- EXPORTACIÓN ---

    async exportExcel() {
        let success = false;
        if (this.activeTab === 'sales') {
            success = await dataManager.exportSalesToExcel();
        } else {
            success = await dataManager.exportToExcel();
        }

        if (success) {
            this.showNotification('Archivo exportado correctamente');
        }
    }

    async copyToClipboard() {
        const success = await dataManager.copyToClipboard();
        if (success) {
            this.showNotification('Datos copiados al portapapeles');
        }
    }

    // --- ESTADÍSTICAS ---

    updateStats() {
        const itemsCount = dataManager.getTotalItems();
        const stockSum = dataManager.getTotalStock();

        console.log('📈 UI Actualizando Estadísticas:', { itemsCount, stockSum });

        if (this.totalItems) this.totalItems.textContent = itemsCount;
        if (this.totalStock) this.totalStock.textContent = stockSum;
    }

    // --- TEMA ---

    toggleTheme() {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');

        const btn = document.getElementById('themeToggle');
        btn.innerHTML = isLight ?
            `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>` :
            `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="18.36" x2="5.64" y2="19.78"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/></svg>`;
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const isLight = savedTheme === 'light';
        const btn = document.getElementById('themeToggle');

        if (isLight) {
            document.body.classList.add('light-mode');
            if (btn) btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
        } else {
            if (btn) btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="18.36" x2="5.64" y2="19.78"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/></svg>`;
        }
    }

    // --- NOTIFICACIONES ---

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }
}

const uiController = new UIController();
export default uiController;
