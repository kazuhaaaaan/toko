/**
 * NUSANTARASTORE - CORE SCRIPT
 * Mengelola: Tema, Auth, Database Produk, dan Keranjang
 */

// --- KONFIGURASI SUPABASE ---
 

// --- UTILITAS TEMA (DARK MODE) ---
const updateThemeUI = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const themeIcon = document.getElementById('theme-icon');
    
    if (themeIcon) {
        themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ns_theme', isDark ? 'dark' : 'light');
    updateThemeUI();
};

// --- MANAJEMEN NAVIGASI & VIEW ---
window.navigate = (view) => {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById(`view-${view}`);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }
};

// --- LOGIKA PRODUK (HOME) ---
const fetchProductsHome = async () => {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const { data, error } = await supabaseClient.from('products').select('*').order('created_at', { ascending: false });
    const countLabel = document.getElementById('product-count');
    
    if (error) {
        grid.innerHTML = `<p class="col-span-full text-center py-10 text-red-500">Gagal memuat produk: ${error.message}</p>`;
        return;
    }

    if (countLabel) countLabel.textContent = `${data.length} Produk tersedia`;

    grid.innerHTML = data.map(p => `
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border dark:border-gray-700 group hover:shadow-xl transition-all duration-300">
            <div class="relative overflow-hidden rounded-xl mb-4 h-48">
                <img src="${p.image_url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onclick='addToCart(${JSON.stringify(p)})' class="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                        <i data-lucide="shopping-cart" class="h-5 w-5"></i>
                    </button>
                </div>
            </div>
            <h3 class="font-bold text-gray-800 dark:text-white truncate">${p.name}</h3>
            <p class="text-xs text-gray-500 mb-2">${p.category}</p>
            <p class="text-blue-600 font-black">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.price)}</p>
        </div>
    `).join('');
    lucide.createIcons();
};

// --- LOGIKA KERANJANG (CART) ---
window.addToCart = (product) => {
    let cart = JSON.parse(localStorage.getItem('ns_cart')) || [];
    cart.push(product);
    localStorage.setItem('ns_cart', JSON.stringify(cart));
    updateCartBadge();
    alert(`${product.name} berhasil ditambah ke keranjang!`);
};

const updateCartBadge = () => {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const cart = JSON.parse(localStorage.getItem('ns_cart')) || [];
    if (cart.length > 0) {
        badge.textContent = cart.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
};

// --- LOGIKA PEMBAYARAN (KERANJANG.HTML) ---
window.openPaymentModal = () => {
    const modal = document.getElementById('payment-modal');
    const total = document.getElementById('grand-total')?.textContent;
    if (modal) {
        document.getElementById('modal-total').textContent = total;
        modal.classList.remove('hidden');
    }
};

window.closePaymentModal = () => {
    document.getElementById('payment-modal')?.classList.add('hidden');
};

window.confirmToWA = () => {
    const cart = JSON.parse(localStorage.getItem('ns_cart')) || [];
    if (cart.length === 0) return;

    let message = "Halo NusantaraStore, saya ingin memesan:%0A%0A";
    let total = 0;
    cart.forEach((item, i) => {
        message += `${i+1}. ${item.name} - Rp ${item.price.toLocaleString()}%0A`;
        total += item.price;
    });
    message += `%0A*Total Bayar: Rp ${total.toLocaleString()}*%0A%0AMohon instruksi selanjutnya.`;
    
    window.open(`https://wa.me/628123456789?text=${message}`, '_blank');
};

// --- LOGIKA AUTH & ADMIN ACCESS ---
const handleAuth = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('submit-btn');
    
    btn.disabled = true;
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        localStorage.setItem('ns_user', JSON.stringify(data.user));
        window.location.href = 'index.html';
    } catch (err) {
        const msgBox = document.getElementById('msg-box');
        if (msgBox) {
            msgBox.textContent = err.message;
            msgBox.className = "mb-6 p-4 rounded-lg text-sm font-medium bg-red-100 text-red-700";
            msgBox.classList.remove('hidden');
        }
    } finally {
        btn.disabled = false;
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    updateThemeUI();
    updateCartBadge();

    // Jalankan fetch jika di halaman home
    if (document.getElementById('products-grid')) {
        fetchProductsHome();
    }

    // Pasang Event Listener Auth
    const loginForm = document.getElementById('auth-form') || document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAuth);
    }

    // Update Header Auth UI
    const authContainer = document.getElementById('auth-section');
    const user = JSON.parse(localStorage.getItem('ns_user'));
    if (authContainer) {
        if (user) {
            authContainer.innerHTML = `
                <div class="flex items-center gap-3">
                    <a href="user.html" class="flex items-center gap-2 hover:opacity-80 transition">
                        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            ${user.email[0].toUpperCase()}
                        </div>
                    </a>
                    <button onclick="handleLogout()" class="text-xs text-red-500 font-bold">Keluar</button>
                </div>`;
        } else {
            authContainer.innerHTML = `<a href="login.html" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Masuk</a>`;
        }
    }

    // Khusus Halaman Profil (user.html)
    if (window.location.pathname.includes('user.html') && user) {
        document.getElementById('display-name').textContent = user.user_metadata?.full_name || user.email.split('@')[0];
        document.getElementById('display-email').textContent = user.email;
        document.getElementById('user-avatar').textContent = user.email[0];
        const date = new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        document.getElementById('display-joined').textContent = date;
    }
});

window.handleLogout = () => {
    if (confirm('Apakah Anda ingin keluar?')) {
        localStorage.removeItem('ns_user');
        window.location.href = 'index.html';
    }
};