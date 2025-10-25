// script.js

// --- KONFIGURASI BACK-END API ---
const API_BASE_URL = '/api'; 
const CURRENCY_FORMAT = new Intl.NumberFormat('id-ID');
// --- END KONFIGURASI ---

// Variabel Global
let shopsData = []; 
let menuData = []; 
let cart = [];
let filteredMenu = []; 
let currentShopId = null;
let currentShopName = null;
let currentOrderCode = null;
let currentTotalAmount = 0; 
let currentPaymentMethod = 'QRIS'; // Default

// Dapatkan Elemen DOM
const mainContent = document.getElementById('main-content');
const menuList = document.getElementById('menu-list');
const filtersSection = document.getElementById('filters');
const headerBrand = document.getElementById('header-brand');
const cartCountElements = [document.getElementById('cart-count'), document.getElementById('floating-cart-count')];
const checkoutModal = document.getElementById('checkout-modal');
const confirmationModal = document.getElementById('confirmation-modal');
const adminLoginModal = document.getElementById('admin-login-modal');
const checkoutForm = document.getElementById('checkout-form');
const searchBar = document.getElementById('search-bar');
const qrisSection = document.querySelector('.qris-section');
const codSection = document.querySelector('.cod-section');


/**
 * 0. ROUTER SEDERHANA (Menggunakan Hash)
 */
function handleRouting() {
    const path = window.location.hash.slice(1);
    
    if (path.startsWith('/menu/')) {
        const shopId = path.split('/')[2];
        loadShopMenu(shopId);
    } else {
        loadShopList();
    }
}
window.addEventListener('hashchange', handleRouting);
document.addEventListener('DOMContentLoaded', handleRouting);


/**
 * UI: Render Header (Berubah sesuai Halaman)
 */
function renderHeader() {
    headerBrand.innerHTML = `
        <img src="logo-kantin-digital.png" alt="Logo Kantin Digital" class="logo" onclick="window.location.hash = '';"> 
        <div>
            <h1>Kantin Digital</h1>
            <p class="school-name">SMKN 44 JAKARTA</p>
        </div>
    `;
    const isMenuPage = window.location.hash.startsWith('#/menu/');
    document.getElementById('view-cart-button').style.display = isMenuPage ? 'flex' : 'none';
    document.getElementById('floating-cart-btn').style.display = isMenuPage ? 'flex' : 'none';
}


// --- FUNGSI HALAMAN UTAMA: LIST TOKO ---
async function loadShopList() {
    // Reset state saat pindah ke List Toko
    cart = [];
    updateCartDisplay();
    currentShopId = null;
    
    renderHeader(); 
    filtersSection.style.display = 'none';
    mainContent.innerHTML = '<h2><i class="fas fa-store"></i> Pilih Toko Kantin</h2>';
    menuList.className = 'list-toko-layout';
    menuList.innerHTML = '<p id="loading-message" class="loading-state text-center" style="grid-column: 1 / -1;">Memuat daftar toko...</p>';

    try {
        // API Call: GET /api/shops
        const response = await fetch(`${API_BASE_URL}/shops`);
        shopsData = await response.json();
    } catch (error) {
        menuList.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; color: var(--danger-color);">❌ Gagal memuat daftar toko. Cek koneksi API.</p>';
        return;
    }
    
    menuList.innerHTML = '';
    if (shopsData.length === 0) {
        menuList.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">Saat ini tidak ada toko yang buka.</p>';
        return;
    }
    
    shopsData.forEach(shop => {
        menuList.innerHTML += `
            <div class="shop-card" data-id="${shop.id}" onclick="window.location.hash = '/menu/${shop.id}'">
                <i class="fas fa-store shop-icon"></i>
                <h2>${shop.name}</h2>
                <p class="shop-status"><i class="fas fa-circle"></i> BUKA</p>
                <p class="text-muted">${shop.tagline || 'Menyediakan makanan dan minuman terbaik.'}</p>
            </div>
        `;
    });
}


// --- FUNGSI HALAMAN MENU TOKO ---
async function loadShopMenu(shopId) {
    // Cek apakah sudah ada di toko lain, jika iya reset cart
    if (currentShopId && currentShopId !== shopId) {
        if(confirm("Keranjang Anda akan dikosongkan karena beralih ke toko lain. Lanjutkan?")) {
            cart = [];
        } else {
            window.location.hash = `/menu/${currentShopId}`;
            return;
        }
    }
    
    currentShopId = shopId;
    const shop = shopsData.find(s => s.id === shopId);
    currentShopName = shop ? shop.name : `Toko ID: ${shopId}`;
    
    renderHeader(); 

    mainContent.innerHTML = `
        <div class="back-btn-container">
            <button class="secondary-btn" onclick="window.location.hash = '';">
                <i class="fas fa-arrow-left"></i> Kembali ke Daftar Toko
            </button>
        </div>
        <h2>Menu ${currentShopName}</h2>
    `;
    filtersSection.style.display = 'block';
    menuList.className = 'grid-layout';
    menuList.innerHTML = '<p class="loading-state text-center" style="grid-column: 1 / -1;">Memuat menu...</p>';

    try {
        // API Call: GET /api/menu/:shop_id
        const response = await fetch(`${API_BASE_URL}/menu/${shopId}`);
        menuData = await response.json();
        
        searchBar.value = '';
        handleFilterAndSearch(); 
        updateCartDisplay();

    } catch (error) {
        menuList.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; color: var(--danger-color);">❌ Gagal memuat menu toko ini.</p>';
        return;
    }
}


// --- FUNGSI MANAJEMEN MENU/KERANJANG ---

function handleFilterAndSearch() {
    const searchTerm = searchBar.value.toLowerCase();
    
    filteredMenu = menuData.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.category.toLowerCase().includes(searchTerm)
    );
    renderMenu();
}
searchBar.addEventListener('input', handleFilterAndSearch);


function renderMenu() {
    menuList.innerHTML = '';
    if (filteredMenu.length === 0) {
        menuList.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">Menu tidak ditemukan.</p>';
        return;
    }
    
    filteredMenu.forEach(item => {
        const cartItem = cart.find(c => c.id === item.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const outOfStock = item.stock <= 0;

        menuList.innerHTML += `
            <div class="menu-card" data-id="${item.id}">
                <img src="${item.image_url || 'https://via.placeholder.com/400x180.png?text=No+Image'}" alt="${item.name}" class="product-image">
                <div class="card-content">
                    <h3>${item.name}</h3>
                    <p class="price">Rp ${CURRENCY_FORMAT.format(item.price)}</p>
                    <p class="text-muted" style="font-size:0.9em;">Stok: ${item.stock > 0 ? item.stock : 'HABIS'}</p>

                    <div class="cart-controls" style="${quantity > 0 ? 'display:flex;' : 'display:none;'} justify-content: space-between; align-items: center; margin-top: 10px;">
                        <button class="secondary-btn small-btn" data-action="decrease" data-id="${item.id}"><i class="fas fa-minus"></i></button>
                        <span class="cart-quantity" style="font-weight: 700;">${quantity}</span>
                        <button class="primary-btn small-btn" data-action="increase" data-id="${item.id}" ${outOfStock ? 'disabled' : ''}><i class="fas fa-plus"></i></button>
                    </div>

                    <button class="add-to-cart" data-action="add" data-id="${item.id}" style="${quantity === 0 ? 'display:block;' : 'display:none;'}" ${outOfStock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> ${outOfStock ? 'HABIS' : 'Pesan'}
                    </button>
                </div>
            </div>
        `;
    });
}
menuList.addEventListener('click', handleCartAction);


function handleCartAction(event) {
    const button = event.target.closest('button');
    if (!button || !button.dataset.action) return;

    const action = button.dataset.action;
    const itemId = button.dataset.id;
    const item = menuData.find(i => i.id === itemId);

    if (!item) return;

    let cartItem = cart.find(c => c.id === itemId);

    if (action === 'add' || action === 'increase') {
        if (!cartItem) {
            cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1, stock: item.stock });
        } else if (cartItem.quantity < item.stock) {
            cartItem.quantity++;
        }
    } else if (action === 'decrease') {
        if (cartItem && cartItem.quantity > 1) {
            cartItem.quantity--;
        } else if (cartItem && cartItem.quantity === 1) {
            cart = cart.filter(c => c.id !== itemId);
        }
    }
    
    renderMenu();
    updateCartDisplay();
}

function updateCartDisplay() {
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    currentTotalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCountElements.forEach(el => el.textContent = totalItems);
    document.getElementById('floating-cart-btn').style.display = totalItems > 0 && window.location.hash.startsWith('#/menu/') ? 'flex' : 'none';
    document.getElementById('floating-cart-count').textContent = totalItems;
    document.getElementById('modal-total-amount').textContent = `Rp ${CURRENCY_FORMAT.format(currentTotalAmount)}`;
    document.getElementById('shop-name-cart').textContent = currentShopName || 'Toko';

    const modalList = document.getElementById('modal-cart-list');
    modalList.innerHTML = '';
    
    if (cart.length === 0) {
        modalList.innerHTML = '<li>Keranjang Anda kosong.</li>';
    } else {
        cart.forEach(item => {
            modalList.innerHTML += `
                <li>
                    <span>${item.name} (${item.quantity}x)</span>
                    <span>Rp ${CURRENCY_FORMAT.format(item.price * item.quantity)}</span>
                </li>
            `;
        });
    }
}


// --- FUNGSI MODAL DAN CHECKOUT ---

document.getElementById('view-cart-button').addEventListener('click', () => {
    if (cart.length === 0) return alert("Keranjang masih kosong!");
    checkoutModal.style.display = 'block';
});
document.getElementById('floating-cart-btn').addEventListener('click', () => {
    if (cart.length === 0) return alert("Keranjang masih kosong!");
    checkoutModal.style.display = 'block';
});
document.querySelector('.close-btn').addEventListener('click', () => checkoutModal.style.display = 'none');


// Simpan metode pembayaran yang dipilih saat radio berubah
document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentPaymentMethod = e.target.value;
    });
});


checkoutForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (cart.length === 0 || !currentShopId) return alert("Keranjang kosong atau toko belum dipilih!");

    const name = document.getElementById('customer-name').value;
    const customerClass = document.getElementById('customer-class').value;
    const notes = document.getElementById('order-notes').value;
    
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

    const orderPayload = {
        name,
        customerClass,
        notes,
        shop_id: currentShopId, 
        payment_method: paymentMethod, 
        total_amount: currentTotalAmount, 
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    };
    
    document.getElementById('checkout-submit-btn').innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Mengirim...';
    document.getElementById('checkout-submit-btn').disabled = true;

    try {
        // API Call: POST /api/order
        const response = await fetch(`${API_BASE_URL}/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        
        const data = await response.json();

        if (!response.ok) {
            alert(`Gagal membuat pesanan: ${data.message || response.statusText}`);
            return;
        }

        currentOrderCode = data.order_code; 
        
        showConfirmation(currentOrderCode, data.status, currentShopId, paymentMethod);
        
        cart = [];
        checkoutForm.reset();
        updateCartDisplay();
        
    } catch (error) {
        console.error("Error saat mengirim pesanan:", error);
        alert('Terjadi kesalahan koneksi server. Silakan coba lagi.');
    } finally {
        document.getElementById('checkout-submit-btn').innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Pesanan';
        document.getElementById('checkout-submit-btn').disabled = false;
    }
});


/**
 * Tampilkan Modal Konfirmasi, Muat QRIS/COD
 */
async function showConfirmation(code, initialStatus, shopId, paymentMethod) {
    const shop = shopsData.find(s => s.id === shopId);
    
    document.getElementById('display-order-code').textContent = code;
    
    const isQris = paymentMethod === 'QRIS';
    qrisSection.style.display = isQris ? 'block' : 'none';
    codSection.style.display = isQris ? 'none' : 'block';

    if (isQris) {
        document.getElementById('shop-name-qris').textContent = shop ? shop.name : 'Toko';
        // Asumsi: qris_url sudah ada di objek shop (diambil dari /api/shops)
        document.getElementById('qris-image').src = shop.qris_url || 'https://via.placeholder.com/250.png?text=QRIS+TIDAK+TERSEDIA';
        document.getElementById('qris-image').alt = `Kode QRIS ${shop.name}`;
    } else { // COD
        document.getElementById('shop-name-cod').textContent = shop ? shop.name : 'Toko';
        document.getElementById('cod-total-amount').textContent = `Rp ${CURRENCY_FORMAT.format(currentTotalAmount)}`;
    }

    checkoutModal.style.display = 'none';
    updateTimeline(initialStatus);
    confirmationModal.style.display = 'block';
}

document.querySelector('.close-btn-conf').addEventListener('click', () => confirmationModal.style.display='none');


/**
 * Logika Status Timeline
 */
const STATUS_STEPS = {
    'Menunggu': 0,
    'Diproses': 1,
    'Kurir Dipersiapkan': 2,
    'Dalam Pengiriman': 3,
    'Selesai': 4
};
const STEP_TITLES = [
    'Menunggu', 
    'Diproses', 
    'Kurir/Siap Ambil', 
    'Pengiriman', 
    'Selesai'
];

function updateTimeline(currentStatus) {
    const timelineSteps = document.getElementById('timeline-steps');
    timelineSteps.innerHTML = '';
    const activeIndex = STATUS_STEPS[currentStatus] || 0;

    STEP_TITLES.forEach((title, index) => {
        const stepDiv = document.createElement('div');
        // Check jika status adalah Canceled/Dibatalkan, harus ada logika di Back-End
        const isCanceled = currentStatus === 'Dibatalkan';

        if (isCanceled) {
            stepDiv.className = `step`;
            stepDiv.innerHTML = `<div class="step-dot" style="background-color: var(--danger-color);"></div><div class="step-title" style="color:var(--danger-color);">Dibatalkan</div>`;
        } else {
            stepDiv.className = `step ${index <= activeIndex ? 'active' : ''}`;
            stepDiv.innerHTML = `
                <div class="step-dot"></div>
                <div class="step-title">${title}</div>
            `;
        }
        timelineSteps.appendChild(stepDiv);
    });
}

const checkStatusBtn = document.getElementById('check-status-btn');
checkStatusBtn.addEventListener('click', async () => {
    if (!currentOrderCode) return;

    checkStatusBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Cek Status';
    checkStatusBtn.disabled = true;

    try {
        // API Call: GET /api/order/status/:kode
        const response = await fetch(`${API_BASE_URL}/order/status/${currentOrderCode}`);
        const data = await response.json();

        if (response.ok) {
            updateTimeline(data.status);
        } else {
            alert(`Gagal cek status: ${data.message || 'Error'}`);
        }
    } catch (error) {
        alert('Gagal terhubung ke server status.');
    } finally {
        checkStatusBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Cek Status Terbaru';
        checkStatusBtn.disabled = false;
    }
});


// --- LOGIKA ADMIN TOKO ---
function showAdminLoginModal() {
    adminLoginModal.style.display = 'block';
}
document.getElementById('admin-login-btn').addEventListener('click', showAdminLoginModal);
document.querySelector('.close-btn-login').addEventListener('click', () => adminLoginModal.style.display = 'none');
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        // API Call: POST /api/auth/login
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
            alert("Login Berhasil! Mengarahkan ke Dashboard Admin...");
            // Asumsi: admin.html ada di root atau di folder /admin
            window.location.href = `/admin.html?shop_id=${data.shop_id}`; 
        } else {
            alert("Login Gagal: " + data.message);
        }
    } catch (error) {
        alert("Kesalahan koneksi saat login.");
    }
});