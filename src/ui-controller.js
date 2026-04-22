import dataManager from './data-manager.js';

class UIController {
    constructor() {
        this.currentEditingId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.loadTheme();
        this.checkSession();
        window.uiController = this; // Asegurar acceso global para eventos
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
        this.viewBalance = document.getElementById('viewBalance');

        // Tabs
        this.tabInventory = document.getElementById('tabInventory');
        this.tabSales = document.getElementById('tabSales');
        this.tabNotes = document.getElementById('tabNotes');
        this.tabBalance = document.getElementById('tabBalance');

        // Grids/Lists
        this.inventoryGrid = document.getElementById('inventoryGrid');
        this.inventoryTableBody = document.getElementById('inventoryTableBody');
        this.salesTableBody = document.getElementById('salesTableBody');
        this.notesList = document.getElementById('notesList');

        // Inputs
        this.searchInput = document.getElementById('searchInput');
        this.filterCategory = document.getElementById('filterCategory');
        this.salesMonthFilter = document.getElementById('salesMonthFilter'); // Nuevo
        this.salesFilterCategory = document.getElementById('salesFilterCategory'); // Nuevo
        this.salesSearchInput = document.getElementById('salesSearchInput');
        this.noteInput = document.getElementById('noteInput');

        // Stats
        this.totalItems = document.getElementById('totalItems');
        this.totalStock = document.getElementById('totalStock');
        this.totalItemsMonth = document.getElementById('totalItemsMonth');
        this.totalStockMonth = document.getElementById('totalStockMonth');
        this.currentUserDisplay = document.getElementById('currentUserDisplay');
        this.userName = document.getElementById('userName');
        this.userInitialLetter = document.getElementById('userInitialLetter');
        this.btnExportExcel = document.getElementById('btnExportExcel');
        this.totalSalesAmount = document.getElementById('totalSalesAmount');
        this.totalSalesMonthAmount = document.getElementById('totalSalesMonthAmount');

        // Balance View Elements
        this.balanceMonthFilter = document.getElementById('balanceMonthFilter');
        this.balanceCapital = document.getElementById('balanceCapital');
        this.balanceVentasMensuales = document.getElementById('balanceVentasMensuales');
        this.balanceGanancia = document.getElementById('balanceGanancia');
        this.recoveryPercentage = document.getElementById('recoveryPercentage');
        this.recoveryBar = document.getElementById('recoveryBar');
        this.balanceTotalRecaudado = document.getElementById('balanceTotalRecaudado');
        this.balanceRestante = document.getElementById('balanceRestante');
        this.btnEditCapital = document.getElementById('btnEditCapital');

        // Capital Modal Elements
        this.capitalModal = document.getElementById('capitalModal');
        this.capitalInput = document.getElementById('capitalInput');
        this.btnSaveCapital = document.getElementById('btnSaveCapital');
        this.btnCancelCapital = document.getElementById('btnCancelCapital');
        this.closeCapitalModalBtn = document.getElementById('closeCapitalModal');

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

        // Month Filters
        this.inventoryMonthFilter = document.getElementById('inventoryMonthFilter');
        this.setInitialMonth();

        // Color filter
        this.filterColor = document.getElementById('filterColor');

        // Color Variants (new multi-color system)
        this.colorVariants = []; // [{ color, image, stockPorTalla }]
        this.colorVariantsContainer = document.getElementById('colorVariantsContainer');
        this.btnAddColorVariant = document.getElementById('btnAddColorVariant');
        this.variantFileInput = document.getElementById('variantFileInput');
        this._uploadingVariantIdx = null;

        // View Toggles
        this.btnGridView = document.getElementById('btnGridView');
        this.btnListView = document.getElementById('btnListView');
        this.inventoryTableContainer = document.getElementById('inventoryTableContainer');
        this.inventoryViewMode = localStorage.getItem('inventoryViewMode') || 'grid';
        this.currentInventoryPage = 1;
        this.inventoryPerPage = 12;
        this.inventoryPagination = document.getElementById('inventoryPagination');
    }

    setInitialMonth() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const currentMonth = `${year}-${month}`;

        if (this.inventoryMonthFilter) {
            this.inventoryMonthFilter.value = currentMonth;
        }
        if (this.balanceMonthFilter) {
            this.balanceMonthFilter.value = currentMonth;
        }
        if (this.salesMonthFilter) {
            this.salesMonthFilter.value = currentMonth;
        }
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
        this.tabBalance.addEventListener('click', () => this.switchTab('balance'));

        // Inventory Actions
        document.getElementById('btnAddItem').addEventListener('click', () => this.showItemModal());
        document.getElementById('btnExportExcel').addEventListener('click', () => this.exportExcel());
        document.getElementById('btnCopy').addEventListener('click', () => this.copyToClipboard());

        // Search & Filter
        this.searchInput.addEventListener('input', () => this.filterInventory());
        this.filterCategory.addEventListener('change', () => this.filterInventory());
        if (this.filterColor) {
            this.filterColor.addEventListener('change', () => this.filterInventory());
        }
        if (this.inventoryMonthFilter) {
            this.inventoryMonthFilter.addEventListener('change', () => {
                // Sync with other filters
                const val = this.inventoryMonthFilter.value;
                if (this.balanceMonthFilter) this.balanceMonthFilter.value = val;
                if (this.salesMonthFilter) this.salesMonthFilter.value = val;
                this.filterInventory();
                this.renderSales(); // Actualizar ventas también
            });
        }
        if (this.balanceMonthFilter) {
            this.balanceMonthFilter.addEventListener('change', () => {
                // Sync with other filters
                const val = this.balanceMonthFilter.value;
                if (this.inventoryMonthFilter) this.inventoryMonthFilter.value = val;
                if (this.salesMonthFilter) this.salesMonthFilter.value = val;
                this.renderBalance();
                this.updateStats();
                this.renderInventory(); // Refresh inventory view
                this.renderSales(); // Refresh sales view
            });
        }
        if (this.salesMonthFilter) {
            this.salesMonthFilter.addEventListener('change', () => {
                const val = this.salesMonthFilter.value;
                if (this.inventoryMonthFilter) this.inventoryMonthFilter.value = val;
                if (this.balanceMonthFilter) this.balanceMonthFilter.value = val;
                this.renderSales();
                this.filterInventory(); // Refresh others
                this.renderBalance();
            });
        }
        const clearBtn = document.getElementById('clearMonthFilter');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.inventoryMonthFilter.value = '';
                if (this.balanceMonthFilter) this.balanceMonthFilter.value = '';
                if (this.salesMonthFilter) this.salesMonthFilter.value = '';
                this.filterInventory();
                this.renderSales();
            });
        }
        const clearSalesMonthBtn = document.getElementById('clearSalesMonthFilter');
        if (clearSalesMonthBtn) {
            clearSalesMonthBtn.addEventListener('click', () => {
                this.salesMonthFilter.value = '';
                if (this.inventoryMonthFilter) this.inventoryMonthFilter.value = '';
                if (this.balanceMonthFilter) this.balanceMonthFilter.value = '';
                this.renderSales();
                this.filterInventory();
            });
        }
        // Color selection
        document.addEventListener('click', (e) => {
            const chip = e.target.closest('.category-chip');
            if (chip) this.selectCategoryChip(chip);
        });

        // Notes and focus
        if (this.salesFilterCategory) {
            this.salesFilterCategory.addEventListener('change', () => {
                this.currentSalesPage = 1;
                this.renderSales();
            });
        }
        this.salesSearchInput.addEventListener('input', () => {
            this.currentSalesPage = 1;
            this.renderSales();
        });
        this.btnEditCapital.addEventListener('click', () => this.handleEditCapital());

        // Item Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.closeItemModal());
        document.getElementById('btnCancelItem').addEventListener('click', () => this.closeItemModal());
        document.getElementById('btnSaveItem').addEventListener('click', () => this.saveItem());

        // Color Selector

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
            if (e.target === this.capitalModal) this.closeCapitalModal();
        });

        // Close buttons
        document.getElementById('closeSaleModal').addEventListener('click', () => this.closeSaleModal());
        if (this.closeCapitalModalBtn) this.closeCapitalModalBtn.addEventListener('click', () => this.closeCapitalModal());
        if (this.btnCancelCapital) this.btnCancelCapital.addEventListener('click', () => this.closeCapitalModal());
        if (this.btnSaveCapital) this.btnSaveCapital.addEventListener('click', () => this.saveCapital());

        // Stepper logic para tallas (delegado: funciona para variantes dinámicas)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-step');
            if (!btn || !this.itemModal || this.itemModal.style.display === 'none') return;
            e.preventDefault();
            const size = btn.dataset.size;
            const variantIdx = btn.dataset.variant;
            const selector = variantIdx !== undefined
                ? `.size-stock-input[data-size="${size}"][data-variant="${variantIdx}"]`
                : `.size-stock-input[data-size="${size}"]`;
            const input = document.querySelector(selector);
            if (!input) return;
            let val = parseInt(input.value) || 0;
            if (btn.classList.contains('plus')) val++;
            else if (btn.classList.contains('minus')) val = Math.max(0, val - 1);
            input.value = val;
        });

        // Agregar variante de color
        if (this.btnAddColorVariant) {
            this.btnAddColorVariant.addEventListener('click', () => this.addColorVariant());
        }

        // Imagen por variante
        if (this.variantFileInput) {
            this.variantFileInput.addEventListener('change', (e) => this.handleVariantImageUpload(e));
        }

        this.btnConfirmCancel.addEventListener('click', () => this.closeConfirm());

        // Event Delegation para el Inventario (más robusto)
        const inventoryElements = [this.inventoryGrid, this.inventoryTableBody];
        inventoryElements.forEach(el => {
            el?.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-edit-id], button[data-delete-id], button[data-sell-id]');
            if (!btn) return;

            e.preventDefault();
            e.stopPropagation();

            const editId = btn.getAttribute('data-edit-id');
            const deleteId = btn.getAttribute('data-delete-id');
            const sellId = btn.getAttribute('data-sell-id');

            if (editId) {
                this.editItem(editId);
            } else if (deleteId) {
                this.deleteItem(deleteId);
            } else if (sellId) {
                this.quickSell(sellId);
            }
            });
        });

        // (Image upload is now handled per color variant via variantFileInput)

        // Data Sync
        dataManager.onDataSync((data) => {
            console.log('🔄 Sincronización de datos recibida:', data.inventory.length, 'prendas');
            this.renderInventory(data.inventory);
            this.renderSales(data.sales);
            this.renderNotes(data.notes);
            this.renderBalance();
            this.updateStats();
        });

        // View Toggles
        this.btnGridView?.addEventListener('click', () => this.setInventoryViewMode('grid'));
        this.btnListView?.addEventListener('click', () => this.setInventoryViewMode('list'));

        this.updateStats();
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
            // Guardar sesión
            localStorage.setItem('stock_user', username);
            localStorage.setItem('stock_token', token);

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

    async checkSession() {
        const username = localStorage.getItem('stock_user');
        const token = localStorage.getItem('stock_token');

        if (username && token) {
            const result = await dataManager.login(username, token);
            if (result.success) {
                this.loginModal.style.display = 'none';
                this.mainApp.style.display = 'block';
                this.currentUserDisplay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> <span class="hide-mobile">${username}</span>`;
                this.userName.textContent = username;
                if (this.userInitialLetter) this.userInitialLetter.textContent = username.charAt(0).toUpperCase();
                await this.loadData();
            }
        }
    }

    handleLogout() {
        if (confirm('¿Seguro que deseas cerrar sesión?')) {
            // Limpiar localStorage
            localStorage.removeItem('stock_user');
            localStorage.removeItem('stock_token');

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
        console.log('🔌 Iniciando carga de datos...');
        await dataManager.getInventory();
        await dataManager.getSales();
        await dataManager.getNotes();

        this.renderInventory(); // Ahora aplica filtros internamente
        this.renderSales();
        this.renderNotes();
        this.renderBalance();
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
        const monthFilter = this.salesMonthFilter?.value || '';
        const categoryFilter = this.salesFilterCategory?.value || '';

        let filtered = [...sales];

        // 1. Filtrar por el mes seleccionado (Lote)
        if (monthFilter) {
            filtered = filtered.filter(sale => {
                if (sale.itemFechaCreacion) return sale.itemFechaCreacion.startsWith(monthFilter);
                const item = dataManager.dataCache.inventory.find(i => i.id === sale.itemId);
                if (item && item.fechaCreacion) return item.fechaCreacion.startsWith(monthFilter);
                return sale.fecha.startsWith(monthFilter);
            });
        }

        // 2. Filtrar por CATEGORÍA (Relacionada con el producto)
        if (categoryFilter) {
            filtered = filtered.filter(sale => {
                const item = dataManager.dataCache.inventory.find(i => i.id === sale.itemId);
                if (item) {
                    return this.getDisplayCategory(item) === categoryFilter;
                }
                // Si no encontramos el item, intentamos un matching de texto simple si sale tiene itemTipo
                if (sale.itemTipo) return sale.itemTipo.toLowerCase().includes(categoryFilter);
                return false;
            });
        }

        // 3. Filtrar por buscador
        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.producto.toLowerCase().includes(searchTerm) ||
                (s.cliente && s.cliente.toLowerCase().includes(searchTerm))
            );
        }

        // Paginación
        const totalSales = filtered.length;
        const totalPages = Math.ceil(totalSales / this.salesPerPage);

        // Ajustar página actual si excede el total
        if (this.currentSalesPage > totalPages && totalPages > 0) {
            this.currentSalesPage = totalPages;
        }

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
                <td style="color: #329258ff; font-weight: bold;">$${sale.totalVenta.toFixed(2)}</td>
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

        let paginationHtml = `
            <button class="btn-page" id="prevSalesPage" ${this.currentSalesPage === 1 ? 'disabled' : ''}>Anterior</button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `
                <button class="btn-page ${i === this.currentSalesPage ? 'active' : ''}" data-page="${i}">${i}</button>
            `;
        }

        paginationHtml += `
            <button class="btn-page" id="nextSalesPage" ${this.currentSalesPage === totalPages ? 'disabled' : ''}>Siguiente</button>
        `;

        container.innerHTML = paginationHtml;

        // Listeners paginación
        container.querySelectorAll('.btn-page[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentSalesPage = parseInt(e.target.dataset.page);
                this.renderSales();
                document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
            });
        });

        const prevBtn = document.getElementById('prevSalesPage');
        const nextBtn = document.getElementById('nextSalesPage');

        if (prevBtn && this.currentSalesPage > 1) {
            prevBtn.addEventListener('click', () => {
                this.currentSalesPage--;
                this.renderSales();
                document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
            });
        }

        if (nextBtn && this.currentSalesPage < totalPages) {
            nextBtn.addEventListener('click', () => {
                this.currentSalesPage++;
                this.renderSales();
                document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    async quickSell(id) {
        const itemId = String(id);
        const item = dataManager.dataCache.inventory.find(i => String(i.id) === itemId);
        if (!item) { console.error('Item no encontrado:', itemId); return; }

        this.saleQuantityInput.value = 1;
        this.saleCustomerInput.value = '';
        this.saleStatusInput.value = 'pagado';
        document.getElementById('saleError').style.display = 'none';

        const saleColorSelect = document.getElementById('saleColor');
        const saleTallaSelect = document.getElementById('saleTalla');

        // Normalizar variantes
        const colores = (item.colores && Array.isArray(item.colores))
            ? item.colores.filter(v => v.cantidad > 0)
            : [{ color: item.color || 'Sin color', stockPorTalla: item.stockPorTalla || {}, cantidad: item.cantidad || 0 }];

        // Poblar colores
        saleColorSelect.innerHTML = colores.map(v =>
            `<option value="${v.color}">${v.color} (Stock: ${v.cantidad})</option>`
        ).join('');

        // Actualizar tallas al cambiar color
        const updateTallas = () => {
            const selectedColor = saleColorSelect.value;
            const variante = colores.find(v => v.color === selectedColor);
            if (variante && variante.stockPorTalla) {
                saleTallaSelect.innerHTML = Object.entries(variante.stockPorTalla)
                    .filter(([, qty]) => (parseInt(qty) || 0) > 0)
                    .map(([t, qty]) => `<option value="${t}">${t} - Stock: ${qty}</option>`)
                    .join('');
            } else {
                saleTallaSelect.innerHTML = '<option value="">Sin stock</option>';
            }
        };
        saleColorSelect.onchange = updateTallas;
        updateTallas();

        this.saleItemInfo.innerHTML = `
            <div style="font-weight:bold;font-size:16px;">${item.tipo}</div>
            <div style="font-size:13px;color:#bbc0ff;margin-top:5px;">Colores disponibles: ${colores.map(v => v.color).join(', ')}</div>
            <div style="font-size:13px;color:#20e2d7;margin-top:3px;">Stock total: ${item.cantidad}</div>
        `;

        this.closeAllModals();
        this.saleModal.style.display = 'flex';
        this.saleModal.style.zIndex = '1010';
        this.saleQuantityInput.focus();

        const confirmBtn = document.getElementById('btnConfirmSale');
        if (!confirmBtn) return;
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        this.btnConfirmSale = newConfirmBtn;

        this.btnConfirmSale.addEventListener('click', async () => {
            const qty = parseInt(this.saleQuantityInput.value);
            const cliente = this.saleCustomerInput.value.trim();
            const estado = this.saleStatusInput.value;
            const colorSel = saleColorSelect.value;
            const tallaSel = saleTallaSelect.value;
            const errorDiv = document.getElementById('saleError');

            if (isNaN(qty) || qty <= 0) {
                errorDiv.textContent = 'Cantidad no válida'; errorDiv.style.display = 'block'; return;
            }

            const variante = colores.find(v => v.color === colorSel);
            const stockDisp = variante?.stockPorTalla?.[tallaSel] || variante?.cantidad || 0;
            if (qty > stockDisp) {
                errorDiv.textContent = 'No hay suficiente stock para esa talla/color'; errorDiv.style.display = 'block'; return;
            }

            const result = await dataManager.registerSale(id, qty, cliente, estado, tallaSel, colorSel);
            if (result.success) {
                this.showNotification(`Venta registrada: ${qty} x ${item.tipo} (${colorSel} - ${tallaSel})`);
                this.closeSaleModal();
            } else {
                errorDiv.textContent = 'Error: ' + result.message; errorDiv.style.display = 'block';
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

        this.closeAllModals();
        this.confirmModal.style.display = 'flex';
        this.confirmModal.style.zIndex = '1020'; // Más alto que otros modales por si acaso

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

    closeAllModals() {
        const modals = ['loginModal', 'itemModal', 'saleModal', 'confirmModal', 'capitalModal'];
        modals.forEach(m => {
            if (this[m]) this[m].style.display = 'none';
        });
    }

    // --- INVENTARIO ---

    setInventoryViewMode(mode) {
        this.inventoryViewMode = mode;
        localStorage.setItem('inventoryViewMode', mode);

        // Update Buttons
        this.btnGridView.classList.toggle('active', mode === 'grid');
        this.btnListView.classList.toggle('active', mode === 'list');

        // Update Containers
        this.inventoryGrid.style.display = mode === 'grid' ? 'grid' : 'none';
        this.inventoryTableContainer.style.display = mode === 'list' ? 'block' : 'none';

        this.renderInventory();
    }

    renderInventory(inventoryList = null) {
        const baseData = inventoryList || dataManager.dataCache.inventory;

        const searchTerm = this.searchInput?.value.toLowerCase() || '';
        const category = this.filterCategory?.value || '';
        const monthFilter = this.inventoryMonthFilter?.value || '';
        const colorFilter = this.filterColor?.value || '';

        // Filtramos sobre la base original (sin aplanar)
        let filtered = baseData.filter(item => {
            const matchesSearch = item.tipo.toLowerCase().includes(searchTerm) || 
                                 (item.colores || []).some(v => v.color.toLowerCase().includes(searchTerm));
            const matchesCategory = !category || this.getDisplayCategory(item) === category;
            const matchesMonth = !monthFilter || (item.fechaCreacion || '').startsWith(monthFilter);
            const matchesColor = !colorFilter || (item.colores || []).some(v => v.color === colorFilter);
            
            return matchesSearch && matchesCategory && matchesMonth && matchesColor;
        });

        this.populateColorFilter();

        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / this.inventoryPerPage);
        if (this.currentInventoryPage > totalPages && totalPages > 0) this.currentInventoryPage = totalPages;

        const start = (this.currentInventoryPage - 1) * this.inventoryPerPage;
        const pagedItems = filtered.slice(start, start + this.inventoryPerPage);

        // --- Renderizado según el modo ---
        if (this.inventoryViewMode === 'grid') {
            this.renderInventoryGrid(pagedItems, monthFilter);
        } else {
            this.renderInventoryList(pagedItems, monthFilter);
        }

        this.renderInventoryPagination(totalItems);
        this.updateMonthlyStats(flat);
    }

    renderInventoryPagination(totalItems) {
        if (!this.inventoryPagination) return;
        
        const totalPages = Math.ceil(totalItems / this.inventoryPerPage);
        
        if (totalPages <= 1) {
            this.inventoryPagination.innerHTML = '';
            return;
        }

        let html = '';
        
        // Botón Anterior
        html += `
            <button class="btn-page" id="prevInvPage" ${this.currentInventoryPage === 1 ? 'disabled' : ''}>
                &laquo;
            </button>
        `;

        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentInventoryPage - 1 && i <= this.currentInventoryPage + 1)) {
                html += `
                    <button class="btn-page ${i === this.currentInventoryPage ? 'active' : ''}" 
                            data-inv-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === 2 || i === totalPages - 1) {
                html += `<span style="color: #666; padding: 0 5px;">...</span>`;
            }
        }

        // Botón Siguiente
        html += `
            <button class="btn-page" id="nextInvPage" ${this.currentInventoryPage === totalPages ? 'disabled' : ''}>
                &raquo;
            </button>
        `;

        this.inventoryPagination.innerHTML = html;

        // Listeners
        this.inventoryPagination.querySelectorAll('[data-inv-page]').forEach(btn => {
            btn.addEventListener('click', () => this.changeInventoryPage(parseInt(btn.getAttribute('data-inv-page'))));
        });

        const prev = document.getElementById('prevInvPage');
        const next = document.getElementById('nextInvPage');

        if (prev && this.currentInventoryPage > 1) {
            prev.addEventListener('click', () => this.changeInventoryPage(this.currentInventoryPage - 1));
        }

        if (next && this.currentInventoryPage < totalPages) {
            next.addEventListener('click', () => this.changeInventoryPage(this.currentInventoryPage + 1));
        }
    }

    changeInventoryPage(page) {
        this.currentInventoryPage = page;
        this.renderInventory();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderInventoryGrid(filtered, monthFilter) {
        if (filtered.length === 0) {
            this.inventoryGrid.innerHTML = `
                <div class="empty-state-box" style="grid-column: 1 / -1; width: 100%;">
                    <div style="margin-bottom: 20px; opacity: 0.3;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                            <path d="m3.3 7 8.7 5 8.7-5"/>
                            <path d="M12 22V12"/>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">
                        ${monthFilter ? `No hay prendas registradas en ${monthFilter}` : 'No hay prendas registradas'}
                    </h3>
                    <p class="empty-state-text">Intenta ajustar los filtros de búsqueda</p>
                </div>
            `;
        } else {
            this.inventoryGrid.innerHTML = filtered.map(item => this.createItemCard(item)).join('');
        }
    }

    renderInventoryList(filtered, monthFilter) {
        this.inventoryTableBody.innerHTML = '';
        if (filtered.length === 0) {
            this.inventoryTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 50px; color: #64748b;">No se encontraron prendas</td></tr>`;
        } else {
            this.inventoryTableBody.innerHTML = filtered.map(item => this.createItemRow(item)).join('');
        }
    }

    createItemRow(item) {
        const displayCategory = item._displayCategory || this.getDisplayCategory(item);
        const categoryLabel = displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1);
        const stockColor = this.getStockColor(item.cantidad);

        const imgHtml = item.image
            ? `<img src="${item.image}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;object-position:top;margin-right:12px;border:1px solid rgba(255,255,255,0.1);" loading="lazy">`
            : `<div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.05);margin-right:12px;display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" opacity="0.2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        ${imgHtml}
                        <span style="font-weight: 600;" class="table-text-main">${item.tipo}</span>
                    </div>
                </td>
                <td class="table-text-sub">${item.color}</td>
                <td><span class="size-pill" style="font-size: 11px; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px;">${item.talla}</span></td>
                <td style="font-weight: 700;">$${(item.precio || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td style="text-align: center; font-weight: 800; color: ${stockColor}; font-size: 16px;">${item.cantidad}</td>
                <td><span class="category-pill-overlay banner-${displayCategory}" style="position: static; transform: none; display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px;">${categoryLabel}</span></td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 6px; justify-content: flex-end;">
                        <button class="btn-sell-quick" data-sell-id="${item.id}" title="Vender" style="width: 32px; height: 32px; background: #e63946; color: white; border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                        </button>
                        <button class="btn-edit-small" data-edit-id="${item.id}" title="Editar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn-delete" data-delete-id="${item.id}" title="Eliminar" style="width: 32px; height: 32px; background: rgba(255, 51, 102, 0.05); border: 1px solid rgba(255, 51, 102, 0.1); color: #ff3366; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    filterInventory() {
        this.currentInventoryPage = 1;
        this.renderInventory();
        this.updateStats();
    }

    getColorHex(colorName) {
        if (!colorName) return '#333';
        const name = colorName.toLowerCase().trim();
        const colors = {
            'negro': '#000000',
            'black': '#000000',
            'blanco': '#ffffff',
            'white': '#ffffff',
            'rojo': '#ff4d4d',
            'red': '#ff4d4d',
            'azul': '#4d94ff',
            'blue': '#4d94ff',
            'verde': '#4dff88',
            'green': '#4dff88',
            'amarillo': '#ffff4d',
            'yellow': '#ffff4d',
            'rosa': '#ff4da6',
            'pink': '#ff4da6',
            'naranja': '#ff944d',
            'orange': '#ff944d',
            'gris': '#808080',
            'gray': '#808080',
            'violeta': '#b366ff',
            'purple': '#b366ff',
            'marron': '#8b4513',
            'brown': '#8b4513',
            'beige': '#f5f5dc',
            'celeste': '#87ceeb',
            'fucsia': '#ff00ff',
            'crema': '#fffdd0',
            'bordo': '#800000',
            'lila': '#c8a2c8',
            'esmeralda': '#50c878',
            'turquesa': '#40e0d0',
            'mostaza': '#e1ad01',
            'marfil': '#fffff0'
        };
        return colors[name] || '#444'; // Gris oscuro si no lo encuentra
    }

    createItemCard(item) {
        const displayCategory = this.getDisplayCategory(item);
        const categoryLabel = displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1);
        const precioFormatted = (item.precio || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 });

        const variantes = (item.colores && item.colores.length > 0) 
            ? item.colores 
            : [{ color: item.color || 'Único', image: (item.images && item.images[0]) || null, stockPorTalla: item.stockPorTalla || {}, cantidad: item.cantidad || 0 }];

        const firstVar = variantes[0];
        const cardId = `card-${item.id}`;

        // Círculos de colores con detección inteligente
        const colorCirclesHtml = variantes.length > 1 ? `
            <div class="color-selectors" style="display: flex; gap: 6px; margin-top: 8px;">
                ${variantes.map((v, idx) => {
                    const hex = this.getColorHex(v.color);
                    const isActive = idx === 0;
                    return `
                    <div class="color-circle" 
                         style="width: 14px; height: 14px; border-radius: 50%; border: ${isActive ? '2px solid #e63946' : '1px solid rgba(0,0,0,0.2)'}; background: ${hex}; cursor: pointer; position: relative; transition: all 0.2s; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.1); transform: ${isActive ? 'scale(1.2)' : 'scale(1)'};"
                         title="${v.color}"
                         onclick="window.uiController.switchCardColor('${cardId}', ${JSON.stringify(v).replace(/"/g, '&quot;')}, this)">
                    </div>`;
                }).join('')}
            </div>
        ` : '';

        const imagesHtml = firstVar.image
            ? `<img src="${firstVar.image}" id="${cardId}-img" alt="${item.tipo}" class="img-fit" loading="lazy">`
            : `<div id="${cardId}-img-placeholder" class="no-image-placeholder"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

        return `
            <div class="card" id="${cardId}">
                <div class="card-image-container" style="height: 180px; position: relative; width: 100%; overflow: hidden;">
                    ${imagesHtml}
                    <div class="category-pill-overlay banner-${displayCategory}">${categoryLabel}</div>
                </div>
                <div class="card-content" style="padding: 15px; display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <div class="card-title" style="font-size: 15px; margin: 0; line-height: 1.2; font-weight: 700;">${item.tipo}</div>
                            <div id="${cardId}-color-label" class="card-subtitle" style="font-size: 11px; opacity: 0.6; margin-top: 2px;">${firstVar.color}</div>
                            ${colorCirclesHtml}
                        </div>
                        <div style="text-align: right; margin-left: 10px;">
                            <div class="stock-price" style="font-size: 17px; margin: 0; color: #e63946; font-weight: 800;">$${precioFormatted}</div>
                        </div>
                    </div>
                    
                    <div class="stock-info-row" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.03);">
                         <div id="${cardId}-sizes" style="display: flex; flex-wrap: wrap; gap: 4px; flex: 1;">
                            ${Object.keys(firstVar.stockPorTalla || {})
                                .filter(t => (parseInt(firstVar.stockPorTalla[t]) || 0) > 0)
                                .map(t => `<span class="size-pill" style="font-size: 9px; background: rgba(255,255,255,0.05); padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">${t}</span>`)
                                .join('') || '<span style="font-size: 9px; opacity:0.4;">Sin stock</span>'
                            }
                        </div>
                        <div style="text-align: right; border-left: 1px solid rgba(255,255,255,0.05); padding-left: 10px;">
                            <div style="font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Stock</div>
                            <div id="${cardId}-stock-total" style="font-size: 20px; font-weight: 800; color: ${this.getStockColor(firstVar.cantidad)}; line-height: 1;">${firstVar.cantidad}</div>
                        </div>
                    </div>

                    <div class="card-actions" style="margin-top: 5px; display: flex; gap: 8px;">
                        <button class="btn-sell-quick" data-sell-id="${item.id}" style="flex: 1; padding: 10px 0; border-radius: 8px; font-weight: 700; font-size: 13px; border: none; cursor: pointer;">Vender</button>
                        <div style="display: flex; gap: 4px; flex-shrink: 0;">
                            <button class="btn-edit" data-edit-id="${item.id}" style="width: 36px; height: 36px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; cursor: pointer;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="btn-delete" data-delete-id="${item.id}" style="width: 36px; height: 36px; background: rgba(255, 51, 102, 0.05); border: 1px solid rgba(255, 51, 102, 0.1); border-radius: 8px; color: #ff3366; cursor: pointer;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateMonthlyStats(filteredFlat) {
        const itemsCount = filteredFlat.length;
        const stockSum = filteredFlat.reduce((acc, item) => acc + (parseInt(item.cantidad) || 0), 0);
        if (this.totalItemsMonth) this.totalItemsMonth.textContent = itemsCount;
        if (this.totalStockMonth) this.totalStockMonth.textContent = stockSum;
    }

    getDisplayCategory(item) {
        // Si el item tiene una categoría manual que no es la por defecto, usarla
        if (item.categoria && item.categoria !== 'remeras' && item.categoria !== 'otros') {
            return item.categoria;
        }

        const tipo = (item.tipo || '').toLowerCase();

        // Inferencia inteligente basada en palabras clave
        if (tipo.includes('short')) return 'shorts';
        if (tipo.includes('musculosa')) return 'musculosas';
        if (tipo.includes('pantalon') || tipo.includes('jean')) return 'pantalones';
        if (tipo.includes('palazo')) return 'palazos';
        if (tipo.includes('mono')) return 'monos';
        if (tipo.includes('pollera')) return 'polleras';
        if (tipo.includes('vestido')) return 'vestidos';
        if (tipo.includes('abrigo') || tipo.includes('campera') || tipo.includes('buzo')) return 'abrigos';
        if (tipo.includes('sudadera')) return 'sudaderas';
        if (tipo.includes('conjunto')) return 'conjuntos';
        if (tipo.includes('media')) return 'medias';
        if (tipo.includes('accesorio') || tipo.includes('gorra') || tipo.includes('cartera')) return 'accesorios';
        if (tipo.includes('calzado') || tipo.includes('zapatilla') || tipo.includes('zapato')) return 'calzado';

        return item.categoria || 'remeras';
    }

    // --- GESTIÓN DE VARIANTES (MODAL TABS) ---

    addColorVariant() {
        if (this.colorVariants.length >= 3) {
            this.showNotification('Máximo 3 colores por producto');
            return;
        }
        // Guardamos el stock del color actual antes de crear uno nuevo
        this.saveCurrentTabStock();
        
        this.colorVariants.push({ color: 'Nuevo Color', image: null, stockPorTalla: {} });
        this.activeColorIdx = this.colorVariants.length - 1;
        this.renderColorTabs();
        this.loadActiveTabStock();
    }

    saveCurrentTabStock() {
        if (this.activeColorIdx === null || !this.colorVariants[this.activeColorIdx]) return;
        
        const spt = {};
        const inputs = document.querySelectorAll('.size-stock-input');
        inputs.forEach(input => {
            const val = parseInt(input.value) || 0;
            if (val > 0) spt[input.dataset.size] = val;
        });
        
        this.colorVariants[this.activeColorIdx].stockPorTalla = spt;
        this.colorVariants[this.activeColorIdx].color = document.getElementById('activeColorName').value.trim();
    }

    loadActiveTabStock() {
        const variant = this.colorVariants[this.activeColorIdx];
        if (!variant) return;

        document.getElementById('activeColorName').value = variant.color || '';
        document.getElementById('activeColorStockLabel').textContent = `(${variant.color || 'Sin nombre'})`;
        
        // Cargar imagen preview
        const preview = document.getElementById('activeColorImgPreview');
        if (variant.image) {
            preview.innerHTML = `<img src="${variant.image}" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            preview.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span style="font-size: 9px; color: #94a3b8; margin-top: 4px;">Foto</span>`;
        }

        const inputs = document.querySelectorAll('.size-stock-input');
        inputs.forEach(input => {
            input.value = variant.stockPorTalla[input.dataset.size] || 0;
        });
    }

    switchActiveColorTab(idx) {
        this.saveCurrentTabStock();
        this.activeColorIdx = idx;
        this.renderColorTabs();
        this.loadActiveTabStock();
    }

    renderColorTabs() {
        const container = document.getElementById('colorTabsRow');
        if (!container) return;

        container.innerHTML = this.colorVariants.map((v, idx) => `
            <div onclick="window.uiController.switchActiveColorTab(${idx})" 
                 style="padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; border: 1px solid ${this.activeColorIdx === idx ? '#e63946' : 'rgba(255,255,255,0.1)'}; background: ${this.activeColorIdx === idx ? 'rgba(230,57,70,0.1)' : 'transparent'}; color: ${this.activeColorIdx === idx ? '#e63946' : '#94a3b8'}; transition: all 0.2s;">
                ${v.color || `Color ${idx + 1}`}
            </div>
        `).join('');

        const btnAdd = document.getElementById('btnAddColorVariant');
        if (btnAdd) btnAdd.style.display = this.colorVariants.length >= 3 ? 'none' : 'block';
    }

    triggerActiveVariantUpload() {
        if (this.activeColorIdx === null) return;
        this.variantFileInput.click();
    }

    async handleVariantImageUpload(e) {
        const file = e.target.files[0];
        if (!file || this.activeColorIdx === null) return;

        try {
            this.showNotification('Subiendo foto...');
            const url = await dataManager.uploadImage(file);
            this.colorVariants[this.activeColorIdx].image = url;
            this.loadActiveTabStock();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            this.variantFileInput.value = '';
        }
    }

    // --- INTERACTIVIDAD DE CARDS ---

    switchCardColor(cardId, variant, circleEl) {
        const card = document.getElementById(cardId);
        if (!card) return;

        // Actualizar contenedor de imagen (maneja cambio entre img y placeholder)
        const imgContainer = card.querySelector('.card-image-container');
        const categoryLabel = card.querySelector('.category-pill-overlay')?.textContent || '';
        const displayCategory = Array.from(card.querySelector('.category-pill-overlay')?.classList || []).find(c => c.startsWith('banner-'))?.replace('banner-', '') || 'remeras';

        if (variant.image) {
            imgContainer.innerHTML = `
                <img src="${variant.image}" id="${cardId}-img" alt="Prenda" class="img-fit" loading="lazy">
                <div class="category-pill-overlay banner-${displayCategory}">${categoryLabel}</div>
            `;
        } else {
            imgContainer.innerHTML = `
                <div id="${cardId}-img-placeholder" class="no-image-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div class="category-pill-overlay banner-${displayCategory}">${categoryLabel}</div>
            `;
        }
        
        // Actualizar label de color
        const label = document.getElementById(`${cardId}-color-label`);
        if (label) label.textContent = variant.color;

        // Actualizar total stock
        const stockEl = document.getElementById(`${cardId}-stock-total`);
        if (stockEl) {
            stockEl.textContent = variant.cantidad;
            stockEl.style.color = this.getStockColor(variant.cantidad);
        }

        // Actualizar size pills
        const sizesContainer = document.getElementById(`${cardId}-sizes`);
        if (sizesContainer) {
            sizesContainer.innerHTML = Object.keys(variant.stockPorTalla || {})
                .filter(t => (parseInt(variant.stockPorTalla[t]) || 0) > 0)
                .map(t => `<span class="size-pill" style="font-size: 9px; background: rgba(255,255,255,0.05); padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">${t}</span>`)
                .join('') || '<span style="font-size: 9px; opacity:0.4;">Sin stock</span>';
        }

        // Marcar círculo activo
        card.querySelectorAll('.color-circle').forEach(c => {
            c.style.border = '1px solid rgba(0,0,0,0.2)';
            c.style.transform = 'scale(1)';
        });
        circleEl.style.border = '2px solid #e63946';
        circleEl.style.transform = 'scale(1.2)';
    }

    populateColorFilter() {
        if (!this.filterColor) return;
        const inventory = dataManager.dataCache.inventory || [];
        const colors = new Set();
        inventory.forEach(item => {
            if (item.colores && Array.isArray(item.colores)) {
                item.colores.forEach(v => { if (v.color) colors.add(v.color); });
            } else if (item.color) {
                colors.add(item.color);
            }
        });
        const current = this.filterColor.value;
        this.filterColor.innerHTML = '<option value="">Todos los colores</option>';
        [...colors].sort().forEach(c => {
            this.filterColor.innerHTML += `<option value="${c}" ${current === c ? 'selected' : ''}>${c}</option>`;
        });
    }

    // --- MODAL DE ITEM ---

    selectCategoryChip(element) {
        document.querySelectorAll('.category-chip').forEach(chip => chip.classList.remove('selected'));
        element.classList.add('selected');
        const hiddenInput = document.getElementById('itemCategoria');
        if (hiddenInput) hiddenInput.value = element.dataset.color;
    }

    showItemModal(item = null) {
        this.currentEditingId = item ? item.id : null;
        const title = document.getElementById('itemModalTitle');

        if (item) {
            title.textContent = 'Editar Prenda';
            document.getElementById('itemTipo').value = item.tipo;
            document.getElementById('itemPrecio').value = item.precio;
            document.getElementById('itemCategoria').value = item.categoria;

            if (item.colores && Array.isArray(item.colores)) {
                this.colorVariants = item.colores.map(v => ({ ...v, stockPorTalla: { ...v.stockPorTalla } }));
            } else {
                this.colorVariants = [{ color: item.color || 'Único', image: (item.images && item.images[0]) || null, stockPorTalla: { ...item.stockPorTalla } }];
            }
            this.activeColorIdx = 0;
        } else {
            title.textContent = 'Nueva Prenda';
            document.getElementById('itemTipo').value = '';
            document.getElementById('itemPrecio').value = '';
            document.getElementById('itemCategoria').value = 'remeras';
            this.colorVariants = [{ color: 'Negro', image: null, stockPorTalla: {} }];
            this.activeColorIdx = 0;
        }

        this.renderColorTabs();
        this.loadActiveTabStock();
        this.closeAllModals();
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
        this.saveCurrentTabStock(); // Guardar el stock de la pestaña actual antes de enviar

        const precioInput = document.getElementById('itemPrecio').value.trim();
        const precioLimpio = precioInput.replace(/\./g, '').replace(',', '.');
        const precioNumerico = parseFloat(precioLimpio) || 0;

        const itemData = {
            tipo: document.getElementById('itemTipo').value.trim(),
            precio: precioNumerico,
            categoria: document.getElementById('itemCategoria').value,
            colores: this.colorVariants.filter(v => v.color.trim())
        };

        if (!itemData.tipo) {
            alert('Ingresa el tipo de prenda'); return;
        }
        if (itemData.colores.length === 0) {
            alert('Agrega al menos un color'); return;
        }

        if (this.currentEditingId) {
            await dataManager.updateItem(this.currentEditingId, itemData);
        } else {
            await dataManager.addItem(itemData);
        }

        this.closeItemModal();
        this.filterInventory();
    }

    async editItem(id) {
        const item = dataManager.dataCache.inventory.find(i => String(i.id) === String(id));
        if (item) {
            this.showItemModal(item);
        }
    }

    async deleteItem(id) {
        const itemId = String(id);
        const item = dataManager.dataCache.inventory.find(i => String(i.id) === itemId);
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

    // --- BALANCE ---

    renderBalance() {
        const monthFilter = this.balanceMonthFilter.value; // Formato YYYY-MM
        const stats = dataManager.getFinancialStats(monthFilter);

        this.balanceCapital.textContent = `$${stats.capitalInvertido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
        this.balanceVentasMensuales.textContent = `$${stats.ventasMensuales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

        // Ganancia Neta color logic
        this.balanceGanancia.textContent = `$${stats.gananciaNeta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
        this.balanceGanancia.style.color = stats.gananciaNeta >= 0 ? 'rgb(33 107 58)' : '#ff3366';

        const ventasExposicion = monthFilter ? stats.ventasMensuales : stats.totalVentas;
        this.balanceTotalRecaudado.textContent = `$${ventasExposicion.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
        this.balanceTotalRecaudado.style.color = '#e63946';

        const restante = Math.max(0, stats.capitalInvertido - ventasExposicion);
        this.balanceRestante.textContent = `$${restante.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
        this.balanceRestante.style.color = restante > 0 ? '#ffffff' : 'rgb(33 107 58)';

        // Recovery Progress
        const percentage = Math.min(100, stats.porcentajeRecuperado).toFixed(1);
        this.recoveryPercentage.textContent = `${percentage}%`;
        this.recoveryPercentage.style.color = 'rgb(33 107 58)';
        this.recoveryBar.style.width = `${percentage}%`;

        if (stats.porcentajeRecuperado >= 100) {
            this.recoveryBar.style.background = 'rgb(33 107 58)';
            this.recoveryBar.style.boxShadow = '0 0 10px rgba(33, 107, 58, 0.4)';
        } else {
            this.recoveryBar.style.background = 'rgb(33 107 58)';
        }
    }

    async handleEditCapital() {
        const monthFilter = this.balanceMonthFilter.value || "general";
        const currentCapitalMap = dataManager.dataCache.capitalInvertido || {};
        const current = currentCapitalMap[monthFilter] !== undefined ? currentCapitalMap[monthFilter] : (currentCapitalMap["general"] || 0);

        this.capitalInput.value = current;

        // Mostrar el mes que se está editando
        const capitalTitle = this.capitalModal.querySelector('h2');
        if (capitalTitle) {
            capitalTitle.textContent = monthFilter !== "general" ? `💰 Capital - ${monthFilter}` : '💰 Editar Capital';
        }

        this.closeAllModals();
        this.capitalModal.style.display = 'flex';
        this.capitalInput.focus();
    }

    closeCapitalModal() {
        this.capitalModal.style.display = 'none';
    }

    async saveCapital() {
        const amount = parseFloat(this.capitalInput.value);
        const monthFilter = this.balanceMonthFilter.value || "general";

        if (!isNaN(amount)) {
            await dataManager.updateCapital(amount, monthFilter);
            this.showNotification(`Capital de ${monthFilter} actualizado`);
            this.closeCapitalModal();
            this.renderBalance();
        } else {
            alert('Monto no válido');
        }
    }

    // --- NAVEGACIÓN ---

    switchTab(tab) {
        this.activeTab = tab;
        const tabs = ['inventory', 'sales', 'notes', 'balance'];

        tabs.forEach(t => {
            const btn = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
            const view = document.getElementById(`view${t.charAt(0).toUpperCase() + t.slice(1)}`);

            if (t === tab) {
                btn.classList.add('active');
                view.style.display = 'block';
                if (t === 'balance') this.renderBalance();
                if (t === 'inventory') this.filterInventory();
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
        } else if (tab === 'balance') {
            this.btnExportExcel.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Descargar Reporte Balance`;
            this.btnExportExcel.style.backgroundColor = '#20e2d7';
            this.btnExportExcel.style.color = '#1c204b';
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
        } else if (this.activeTab === 'balance') {
            const monthFilter = this.balanceMonthFilter.value;
            success = await dataManager.exportBalanceToExcel(monthFilter);
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
        // Usar inventoryMonthFilter como fuente de verdad para el mes
        const currentMonth = this.inventoryMonthFilter?.value || '';
        const stats = dataManager.getFinancialStats(currentMonth);

        console.log('📈 UI Actualizando Estadísticas:', { itemsCount, stockSum, currentMonth, stats });

        const salesColor = '#e63946'; // Rojo de marca para movimiento de dinero
        const successColor = 'rgb(33 107 58)'; // Verde para éxito/ganancia

        if (this.totalItems) {
            this.totalItems.textContent = itemsCount;
            this.totalItems.style.color = '#ffffff';
        }
        if (this.totalStock) {
            this.totalStock.textContent = stockSum;
            this.totalStock.style.color = this.getStockColor(stockSum);
        }
        if (this.totalItemsMonth) {
            this.totalItemsMonth.textContent = stats.prendasMensuales || 0;
            this.totalItemsMonth.style.color = '#ffffff';
        }
        if (this.totalStockMonth) {
            this.totalStockMonth.textContent = stats.stockMensual || 0;
            this.totalStockMonth.style.color = this.getStockColor(stats.stockMensual || 0);
        }

        if (this.totalSalesAmount) {
            this.totalSalesAmount.textContent = `$${stats.totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
            this.totalSalesAmount.style.color = salesColor;
        }
        if (this.totalSalesMonthAmount) {
            this.totalSalesMonthAmount.textContent = `$${stats.ventasMensuales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
            this.totalSalesMonthAmount.style.color = salesColor;
        }
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

    getStockColor(count) {
        const qty = parseInt(count) || 0;
        if (qty === 0) return '#ff3366'; // Rojo crítico (Agotado)
        if (qty <= 2) return '#ff9f43';  // Naranja (Stock muy bajo)
        if (qty <= 5) return '#bbf7d0';  // Verde muy claro (Poco stock)
        if (qty <= 15) return '#4ade80'; // Verde brillante (Stock saludable)
        return '#15803d';                // Verde intenso (Stock abundante)
    }

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
