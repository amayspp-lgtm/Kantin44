// script.js

// --- KONFIGURASI FRONT-END ---
const API_BASE_URL = '/api'; 
const CURRENCY_FORMAT = new Intl.NumberFormat('id-ID');
const ADMIN_LOGIN_URL = 'admin-login.html'; 
// --- END KONFIGURASI ---

// --- DUMMY DATA TOKO (HARDCODED) ---
const shopsData = [
    {
        id: 'KANTIN1',
        name: 'Toko Bu Siti (Makanan Berat)',
        tagline: 'Spesialis Nasi Uduk dan Soto Ayam hangat. Kami juga sedia jajanan pasar!',
        shop_icon: 'fa-utensils', 
        shop_image_url: 'toko-img/bu_siti.jpg', 
        qris_url: 'https://via.placeholder.com/250x250.png?text=QRIS+BU+SITI', 
        is_open: true
    },
    {
        id: 'KANTIN2',
        name: 'Toko Pak Budi (Jajanan)',
        tagline: 'Aneka Gorengan, Roti Bakar, dan snack hits yang selalu fresh dan renyah.',
        shop_icon: 'fa-cookie-bite',
        shop_image_url: '', 
        qris_url: 'https://via.placeholder.com/250x250.png?text=QRIS+PAK+BUDI',
        is_open: true
    },
    {
        id: 'KANTIN3',
        name: 'Minuman Segar',
        tagline: 'Es Teh, Es Jeruk, dan jus buah dingin. Hilangkan dahaga Anda saat jam istirahat!',
        shop_icon: 'fa-mug-hot',
        shop_image_url: 'toko-img/minuman.jpg',
        qris_url: 'https://via.placeholder.com/250x250.png?text=QRIS+MINUMAN',
        is_open: true
    }
];

// --- DUMMY DATA PRODUK PER TOKO (HARDCODED) ---
const menuDataPerShop = {
    'KANTIN1': [
        { id: 'M001', name: 'Nasi Uduk Komplit', price: 15000, category: 'Nasi', stock: 15, image_url: 'produk-img/nasi_uduk.jpg', product_icon: 'fa-bowl-rice' },
        { id: 'M002', name: 'Soto Ayam Kuah Bening', price: 18000, category: 'Kuah', stock: 8, image_url: 'produk-img/soto_ayam.jpg', product_icon: 'fa-bowl-food' },
        { id: 'M003', name: 'Nasi Goreng Kampung', price: 16000, category: 'Nasi', stock: 0, image_url: '', product_icon: 'fa-pizza-slice' },
    ],
    'KANTIN2': [
        { id: 'J001', name: 'Roti Bakar Cokelat Keju', price: 12000, category: 'Roti', stock: 20, image_url: 'produk-img/roti_bakar.jpg', product_icon: 'fa-sandwich' },
        { id: 'J002', name: 'Tempe Mendoan (3 pcs)', price: 5000, category: 'Gorengan', stock: 50, image_url: 'produk-img/mendoan.jpg', product_icon: 'fa-pepper-hot' },
        { id: 'J003', name: 'Sosis Bakar Jumbo', price: 10000, category: 'Sosis', stock: 15, image_url: 'produk-img/sosis.jpg', product_icon: 'fa-hotdog' },
    ],
    'KANTIN3': [
        { id: 'D001', name: 'Es Teh Manis Jumbo', price: 5000, category: 'Teh', stock: 100, image_url: 'produk-img/es_teh.jpg', product_icon: 'fa-glass-water' },
        { id: 'D002', name: 'Jus Alpukat', price: 14000, category: 'Jus', stock: 12, image_url: 'produk-img/jus_alpukat.jpg', product_icon: 'fa-blender' },
        { id: 'D003', name: 'Air Mineral Dingin', price: 3000, category: 'Botol', stock: 80, image_url: '', product_icon: 'fa-bottle-water' },
    ],
};
// --- END DUMMY DATA ---

// Variabel Global
let menuData = []; 
let cart = [];
let filteredMenu = []; 
let currentShopId = null;
let currentShopName = null;
let currentOrderCode = null;
let currentTotalAmount = 0; 
let currentPaymentMethod = 'QRIS'; 

// Dapatkan Elemen DOM
const mainContent = document.getElementById('main-content');
const menuList = document.getElementById('menu-list');
const filtersSection = document.getElementById('filters');
const headerBrand = document.getElementById('header-brand');
const cartCountElements = [document.getElementById('cart-count'), document.getElementById('floating-cart-count')];
const checkoutModal = document.getElementById('checkout-modal');
const confirmationModal = document.getElementById('confirmation-modal');
const checkoutForm = document.getElementById('checkout-form');
const searchBar = document.getElementById('search-bar');
const qrisSection = document.querySelector('.qris-section');
const codSection = document.querySelector('.cod-section');
const adminLoginBtn = document.getElementById('admin-login-btn');


/**
 * 0. ROUTER SEDERHANA (Menggunakan Hash)
 */
function handleRouting() {
    const path = window.location.hash.slice(1);
    
    // Panggil renderHeader di awal untuk memastikan logo termuat
    renderHeader();

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
        <img src="logo.png" alt="Logo Kantin Digital" class="logo" onclick="window.location.hash = '';"> 
        <div>
            <h1>Kantin Digital</h1>
            <p class="school-name">SMKN 44 JAKARTA</p>
        </div>
    `;
    const isMenuPage = window.location.hash.startsWith('#/menu/');
    document.getElementById('view-cart-button').style.display = isMenuPage ? 'flex' : 'none';
    document.getElementById('floating-cart-btn').style.display = isMenuPage ? 'flex' : 'none';

    // Aksi admin login dipindah ke URL terpisah
    const adminBtn = document.getElementById('admin-login-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            window.location.href = ADMIN_LOGIN_URL; 
        });
    }
}


// --- FUNGSI HALAMAN UTAMA: LIST TOKO ---
function loadShopList() {
    // Reset state saat pindah ke List Toko
    cart = [];
    updateCartDisplay();
    currentShopId = null;
    
    renderHeader(); 
    filtersSection.style.display = 'none';
    mainContent.innerHTML = '<h2><i class="fas fa-store-alt"></i> Pilih Toko Kantin</h2>';
    menuList.className = 'list-toko-layout';
    
    const shops = shopsData; 

    menuList.innerHTML = '';
    if (shops.length === 0) {
        menuList.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">Saat ini tidak ada toko yang buka.</p>';
        return;
    }
    
    shops.forEach(shop => {
        const iconClass = shop.shop_icon || 'fa-store';
        
        menuList.innerHTML += `
            <div class="shop-card" data-id="${shop.id}" onclick="window.location.hash = '/menu/${shop.id}'">
                
                <div class="shop-card-header">
                    <h2>${shop.name}</h2>
                    <span class="shop-icon-wrapper"><i class="fas ${iconClass}"></i></span>
                </div>
                
                <div class="shop-card-body">
                    <p class="shop-status"><i class="fas fa-circle" style="font-size: 0.7em; color: var(--success-color);"></i> BUKA</p>
                    <p class="tagline">${shop.tagline || 'Menyediakan makanan dan minuman terbaik.'}</p>
                </div>
            </div>
        `;
    });
}


// --- FUNGSI HALAMAN MENU TOKO ---
async function loadShopMenu(shopId) {
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
    
    menuData = menuDataPerShop[shopId] || [];
    
    searchBar.value = '';
    handleFilterAndSearch(); 
    updateCartDisplay();
}


// --- FUNGSI MANAJEMEN MENU/KERANJANGAN ---

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
        
        // Logika Fallback Icon Produk
        const hasProductImage = item.image_url && item.image_url.trim() !== '';
        const iconClass = item.product_icon || (item.category.toLowerCase().includes('minuman') ? 'fa-cup-straw' : 'fa-pizza-slice'); 

        menuList.innerHTML += `
            <div class="menu-card" data-id="${item.id}">
                
                <div class="product-visual">
                    ${hasProductImage 
                        ? `<img src="${item.image_url}" alt="${item.name}" class="product-image" onerror="this.outerHTML='<div class=\\'image-placeholder\\'><i class=\\'fas ${iconClass}\\'></i></div>';">`
                        : `<div class="image-placeholder"><i class="fas ${iconClass}"></i></div>`
                    }
                </div>

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
// Hapus listener menuList.addEventListener('click', handleCartAction);


function handleCartAction(event) {
    const targetButton = event.target.closest('button');
    if (!targetButton || !targetButton.dataset.action) return;

    const action = targetButton.dataset.action;
    const itemId = targetButton.dataset.id;
    const item = menuData.find(i => i.id === itemId);

    if (!item) return;

    let cartItem = cart.find(c => c.id === itemId);

    if (action === 'add') {
        // PERBAIKAN BUG KELIPATAN: Quantity awal harus 1
        if (!cartItem) {
            cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1, stock: item.stock });
        }
    } else if (action === 'increase') {
        // PERBAIKAN: Menambah kuantitas 1
        if (cartItem && cartItem.quantity < item.stock) {
            cartItem.quantity++;
        }
    } else if (action === 'decrease') {
        // PERBAIKAN: Mengurangi kuantitas 1
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
        // SIMULASI API CALL: POST /api/order
        const simulatedResponse = {
            ok: true,
            json: () => Promise.resolve({
                order_code: 'KTS-' + Math.floor(Math.random() * 900 + 100),
                status: paymentMethod === 'QRIS' ? 'Menunggu Pembayaran' : 'Menunggu Konfirmasi'
            })
        };
        const response = simulatedResponse; 
        
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
        document.getElementById('qris-image').src = shop.qris_url || 'https://via.placeholder.com/250x250.png?text=QRIS+TIDAK+TERSEDIA';
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
    'Menunggu Konfirmasi': 0,
    'Menunggu Pembayaran': 0,
    'Diproses': 1,
    'Kurir Dipersiapkan': 2,
    'Dalam Pengiriman': 3,
    'Selesai': 4,
    'Dibatalkan': 5 
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
    const isCanceled = currentStatus === 'Dibatalkan';

    if (isCanceled) {
        timelineSteps.innerHTML = `<div class="step" style="text-align:center;"><div class="step-dot" style="background-color: var(--danger-color);"></div><div class="step-title" style="color:var(--danger-color);">PESANAN DIBATALKAN</div></div>`;
        return;
    }

    STEP_TITLES.forEach((title, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = `step ${index <= activeIndex ? 'active' : ''}`;
        stepDiv.innerHTML = `
            <div class="step-dot"></div>
            <div class="step-title">${title}</div>
        `;
        timelineSteps.appendChild(stepDiv);
    });
}

const checkStatusBtn = document.getElementById('check-status-btn');
checkStatusBtn.addEventListener('click', async () => {
    if (!currentOrderCode) return;

    checkStatusBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Cek Status';
    checkStatusBtn.disabled = true;

    try {
        // SIMULASI API CALL: GET /api/order/status/:kode
        const simulatedStatus = ['Menunggu Pembayaran', 'Diproses', 'Dalam Pengiriman', 'Selesai'];
        const currentSimulatedIndex = Math.floor(Math.random() * simulatedStatus.length);

        const response = {
            ok: true,
            json: () => Promise.resolve({
                order_code: currentOrderCode,
                status: simulatedStatus[currentSimulatedIndex]
            })
        };

        const data = await response.json();

        if (response.ok) {
            updateTimeline(data.status);
            alert(`Status terbaru: ${data.status}`);
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


// Menghubungkan listener ke DOM elemen (Event Delegation Final)
document.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button && (button.classList.contains('add-to-cart') || button.closest('.cart-controls'))) {
        handleCartAction({ target: button });
    }
});