import dataManager from './data-manager.js';

class UIController {
    constructor() {
        this.currentEditingId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.loadTheme();
        this.checkSession();
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
        this.totalItemsMonth = document.getElementById('totalItemsMonth');
        this.totalStockMonth = document.getElementById('totalStockMonth');
        this.currentUserDisplay = document.getElementById('currentUserDisplay');
        this.userName = document.getElementById('userName');
        this.userInitialLetter = document.getElementById('userInitialLetter');
        this.btnExportExcel = document.getElementById('btnExportExcel');
        this.totalSalesAmount = document.getElementById('totalSalesAmount');

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
        this.sizeStockInputs = document.querySelectorAll('.size-stock-input');

        // New Elements
        this.inventoryMonthFilter = document.getElementById('inventoryMonthFilter');
        this.setInitialMonth();
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
        if (this.inventoryMonthFilter) {
            this.inventoryMonthFilter.addEventListener('change', () => this.filterInventory());
        }
        const clearBtn = document.getElementById('clearMonthFilter');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.inventoryMonthFilter.value = '';
                this.filterInventory();
            });
        }
        // Color selection
        document.addEventListener('click', (e) => {
            const chip = e.target.closest('.category-chip');
            if (chip) this.selectCategoryChip(chip);
        });

        // Notes and focus
        this.salesFilterDate.addEventListener('change', () => {
            this.currentSalesPage = 1;
            this.renderSales();
        });
        this.salesSearchInput.addEventListener('input', () => {
            this.currentSalesPage = 1;
            this.renderSales();
        });
        this.balanceMonthFilter.addEventListener('change', () => this.renderBalance());
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

        // Stepper logic para tallas
        document.querySelectorAll('.btn-step').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const size = btn.dataset.size;
                const input = document.querySelector(`.size-stock-input[data-size="${size}"]`);
                if (!input) return;

                let val = parseInt(input.value) || 0;
                if (btn.classList.contains('plus')) {
                    val++;
                } else if (btn.classList.contains('minus')) {
                    val = Math.max(0, val - 1);
                }
                input.value = val;
            });
        });

        this.btnConfirmCancel.addEventListener('click', () => this.closeConfirm());

        // Event Delegation para el Inventario (más robusto)
        this.inventoryGrid.addEventListener('click', (e) => {
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

        // Data Sync
        dataManager.onDataSync((data) => {
            this.renderInventory(data.inventory);
            this.renderSales(data.sales);
            this.renderNotes(data.notes);
            this.renderBalance();
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
        const inventory = await dataManager.getInventory();
        const sales = await dataManager.getSales();
        const notes = await dataManager.getNotes();

        this.renderInventory();
        this.renderSales();
        this.renderNotes();
        this.updateMonthlyStats(dataManager.dataCache.inventory);
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
        // Asegurar que el ID sea string y buscar el item
        const itemId = String(id);
        const item = dataManager.dataCache.inventory.find(i => String(i.id) === itemId);
        if (!item) {
            console.error("Item no encontrado para venta:", itemId);
            return;
        }

        // Reset and Clear Modal
        this.saleQuantityInput.value = 1;
        this.saleCustomerInput.value = "";
        this.saleStatusInput.value = "pagado";
        document.getElementById('saleError').style.display = 'none';

        // Poblara tallas disponibles
        const saleTallaSelect = document.getElementById('saleTalla');
        if (item.stockPorTalla && Object.keys(item.stockPorTalla).length > 0) {
            saleTallaSelect.innerHTML = Object.keys(item.stockPorTalla)
                .filter(t => (parseInt(item.stockPorTalla[t]) || 0) > 0)
                .map(t => `<option value="${t}">${t}${dataManager.dataCache.tallaMapping[t] !== t ? ' (' + dataManager.dataCache.tallaMapping[t] + ')' : ''} - Stock: ${item.stockPorTalla[t]}</option>`)
                .join('');
        } else {
            // Fallback para items viejos o sin desglose
            saleTallaSelect.innerHTML = `<option value="${item.talla}">${item.talla}</option>`;
        }

        this.saleItemInfo.innerHTML = `
            <div style="font-weight: bold; font-size: 16px;">${item.tipo}</div>
            <div style="font-size: 13px; color: #bbc0ff; margin-top: 5px;">Color: ${item.color}</div>
            <div style="font-size: 13px; color: #20e2d7; margin-top: 3px;">Stock total: ${item.cantidad}</div>
        `;

        this.closeAllModals();
        this.saleModal.style.display = 'flex';
        this.saleModal.style.zIndex = '1010';
        this.saleQuantityInput.focus();

        // Limpiar y re-vincular botón de confirmación
        const confirmBtn = document.getElementById('btnConfirmSale');
        if (!confirmBtn) return;

        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        this.btnConfirmSale = newConfirmBtn;

        this.btnConfirmSale.addEventListener('click', async () => {
            const qty = parseInt(this.saleQuantityInput.value);
            const cliente = this.saleCustomerInput.value.trim();
            const estado = this.saleStatusInput.value;
            const talla = saleTallaSelect.value;
            const errorDiv = document.getElementById('saleError');

            if (isNaN(qty) || qty <= 0) {
                errorDiv.textContent = "Cantidad no válida";
                errorDiv.style.display = 'block';
                return;
            }

            // Verificar stock de la talla seleccionada
            const stockTalla = item.stockPorTalla ? (parseInt(item.stockPorTalla[talla]) || 0) : item.cantidad;
            if (qty > stockTalla) {
                errorDiv.textContent = "No hay suficiente stock en esta talla";
                errorDiv.style.display = 'block';
                return;
            }

            const result = await dataManager.registerSale(id, qty, cliente, estado, talla);
            if (result.success) {
                this.showNotification(`Venta registrada: ${qty} x ${item.tipo} (${talla})`);
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

    renderInventory(inventory = null) {
        const data = inventory || dataManager.dataCache.inventory;

        if (!data || data.length === 0) {
            this.inventoryGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📦</div>
                    <p>No hay prendas en el inventario</p>
                    <p style="font-size: 14px; margin-top: 10px;">Haz clic en "+ Nueva Prenda" para comenzar</p>
                </div>
            `;
            this.updateMonthlyStats([]);
            return;
        }

        this.inventoryGrid.innerHTML = data.map(item => this.createItemCard(item)).join('');
        this.updateMonthlyStats(data);
    }

    createItemCard(item) {
        const displayCategory = this.getDisplayCategory(item);
        const categoryLabel = displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1);

        return `
            <div class="card">
                <div class="card-banner banner-${displayCategory}">
                    <div class="category-pill">${categoryLabel}</div>
                </div>
                <div class="card-content">
                    <div class="card-title">${item.tipo}</div>
                    <div class="card-subtitle">${item.color}</div>
                    
                    <div class="card-details" style="margin-top: 10px;">
                        <span class="detail-label" style="display: block; margin-bottom: 5px; font-size: 12px; opacity: 0.7;">Tallas en stock:</span>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${item.stockPorTalla ? Object.keys(item.stockPorTalla)
                .filter(t => (parseInt(item.stockPorTalla[t]) || 0) > 0)
                .map(t => `<span class="size-pill" style="font-size: 11px; background: rgba(67, 233, 123, 0.1); color: #43e97b; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(67, 233, 123, 0.2);" title="Talla ${t}">${t}: <b>${item.stockPorTalla[t]}</b></span>`)
                .join('') : `<span class="size-pill" style="font-size: 11px; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px;">${item.talla}</span>`
            }
                        </div>
                    </div>

                    <div class="card-stock" style="margin-top: 15px;">
                        <div class="stock-label">Stock Total</div>
                        <div class="stock-value">${item.cantidad}</div>
                        <div class="stock-price" style="font-size: 20px;">$${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                    </div>
                    
                    ${item.fechaCreacion ? `
                    <div class="creation-date" title="Fecha de ingreso: ${new Date(item.fechaCreacion).toLocaleString()}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${new Date(item.fechaCreacion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>` : ''}

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
        const monthFilter = this.inventoryMonthFilter ? this.inventoryMonthFilter.value : '';

        let filtered = dataManager.dataCache.inventory;

        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.tipo.toLowerCase().includes(searchTerm) ||
                item.color.toLowerCase().includes(searchTerm) ||
                (item.talla && item.talla.toLowerCase().includes(searchTerm))
            );
        }

        if (category) {
            filtered = filtered.filter(item => this.getDisplayCategory(item) === category);
        }

        if (monthFilter) {
            filtered = filtered.filter(item => {
                // If item has no date, treat it as historical (only show if NO month filter is active or handle as old)
                if (!item.fechaCreacion) return false;
                return item.fechaCreacion.startsWith(monthFilter);
            });
        }

        // Calculate and update monthly stats based on current view
        this.updateMonthlyStats(filtered);
        this.renderInventory(filtered);
    }

    updateMonthlyStats(filteredItems) {
        const itemsCount = filteredItems.length;
        const stockSum = filteredItems.reduce((acc, item) => acc + (parseInt(item.cantidad) || 0), 0);

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
            document.getElementById('itemColor').value = item.color;
            document.getElementById('itemPrecio').value = item.precio;
            document.getElementById('itemCategoria').value = item.categoria;

            // Poblara stock por talla
            this.sizeStockInputs.forEach(input => {
                const size = input.dataset.size;
                input.value = item.stockPorTalla ? (item.stockPorTalla[size] || 0) : (item.talla === size ? item.cantidad : 0);
            });

            // Select category chip
            const chip = document.querySelector(`.category-chip[data-color="${item.categoria}"]`);
            if (chip) this.selectCategoryChip(chip);
        } else {
            title.textContent = 'Nueva Prenda';
            document.getElementById('itemTipo').value = '';
            document.getElementById('itemColor').value = '';
            document.getElementById('itemPrecio').value = '';
            document.getElementById('itemCategoria').value = 'remeras';

            // Reset stock inputs
            this.sizeStockInputs.forEach(input => input.value = '');

            // Select first chip (Remeras)
            const firstChip = document.querySelector('.category-chip');
            if (firstChip) this.selectCategoryChip(firstChip);
        }

        this.closeAllModals();
        this.itemModal.style.display = 'flex';
        this.itemModal.style.zIndex = '1010'; // Asegurar que esté al frente
        this.itemModal.querySelector('.input-hours')?.focus();
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
        // Collect stock por talla
        const stockPorTalla = {};
        this.sizeStockInputs.forEach(input => {
            const val = parseInt(input.value) || 0;
            if (val > 0) stockPorTalla[input.dataset.size] = val;
        });

        // Procesar el precio: eliminar puntos (separadores de miles) y reemplazar coma por punto (decimal)
        const precioInput = document.getElementById('itemPrecio').value.trim();
        const precioLimpio = precioInput.replace(/\./g, '').replace(',', '.');
        const precioNumerico = parseFloat(precioLimpio) || 0;

        const itemData = {
            tipo: document.getElementById('itemTipo').value.trim(),
            color: document.getElementById('itemColor').value.trim(),
            precio: precioNumerico,
            categoria: document.getElementById('itemCategoria').value,
            stockPorTalla: stockPorTalla
        };

        if (!itemData.tipo || !itemData.color) {
            alert('Por favor completa los campos obligatorios');
            return;
        }

        if (precioNumerico <= 0) {
            alert('Por favor ingresa un precio válido');
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
        this.filterInventory(); // Refresh view
    }

    async editItem(id) {
        const item = dataManager.dataCache.inventory.find(i => i.id === id);
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
        this.balanceGanancia.style.color = stats.gananciaNeta >= 0 ? '#43e97b' : '#ff3366';

        const ventasExposicion = monthFilter ? stats.ventasMensuales : stats.totalVentas;
        this.balanceTotalRecaudado.textContent = `$${ventasExposicion.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

        const restante = Math.max(0, stats.capitalInvertido - ventasExposicion);
        this.balanceRestante.textContent = `$${restante.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

        // Recovery Progress
        const percentage = Math.min(100, stats.porcentajeRecuperado).toFixed(1);
        this.recoveryPercentage.textContent = `${percentage}%`;
        this.recoveryBar.style.width = `${percentage}%`;

        if (stats.porcentajeRecuperado >= 100) {
            this.recoveryBar.style.background = 'linear-gradient(to right, #43e97b, #38f9d7)';
        } else {
            this.recoveryBar.style.background = 'linear-gradient(to right, #ff5e62, #ff9966)';
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
        const stats = dataManager.getFinancialStats();

        console.log('📈 UI Actualizando Estadísticas:', { itemsCount, stockSum });

        if (this.totalItems) this.totalItems.textContent = itemsCount;
        if (this.totalStock) this.totalStock.textContent = stockSum;
        if (this.totalSalesAmount) {
            this.totalSalesAmount.textContent = `$${stats.totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
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
