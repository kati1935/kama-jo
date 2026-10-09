// Локальная база данных товаров интернет-магазина
const productsData = {
    "1": {
        name: "корсет Tie",
        price: 9000,
        desc: "Корсет ручной работы с идеальной утяжкой, моделирующий фигуру.",
        moreDesc: "<ul><li><b>Стиль:</b> Romantic indie / Coquette-core</li><li><b>Качество:</b> Каждое изделие отшивается вручную индивидуально премиальными нитями.</li></ul>",
        colors: [
            { name: "Черный", img: "img/corsetTie.jpg", gallery: ["img/corsetTie.jpg"] }
        ]
    },
    "2": {
        name: "Блуза KAMA'JO SILK SHINE",
        price: 4100,
        desc: "Блуза с корсетной посадкой 'KAMA'JO SILK SHINE'.",
        moreDesc: "<b>Материал:</b> Премиальный атласный шелк (гладкий, мягкий, с благородным переливом).<br><br><ul><li><b>Стиль:</b> Coquette-core / Grunge glam / Romantic indie</li><li><b>Качество:</b> Каждое изделие отшивается вручную. Идеальные швы и премиальная обработка изнутри.</li></ul><br>Модель можно изменить по вашему желанию (добавить, убрать, изменить цвет или отшить по меркам) — для этого напишите в сообщения.",
        colors: [
            { name: "Лавандовый", img: "img/bluse1.jpg", gallery: ["img/bluse1.jpg", "img/bluse1_2.jpg"] },
            { name: "Голубой", img: "img/bluse_blue.jpg", gallery: ["img/bluse_blue.jpg"] },
            { name: "Черный", img: "img/bluse_black.jpg", gallery: ["img/bluse_black.jpg"] }
        ]
    }
};

let cart = {};
let favorites = [];
let activeProductId = null;
let activeColorIndex = 0;
let activeSlideIndex = 0;
let activeSize = "XS";

// Утилиты окон
function showOverlay(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('hidden');
}

function hideOverlay(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('hidden');
}

// Функции корзины в сетке
function addToCart(id) {
    const prod = productsData[id];
    if (!prod) return;
    const defaultColor = prod.colors[activeColorIndex] ? prod.colors[activeColorIndex].name : "Черный";
    const itemKey = `${id}_${defaultColor}_${activeSize}`;

    if (!cart[itemKey]) {
        cart[itemKey] = {
            id: id,
            name: prod.name,
            price: prod.price,
            color: defaultColor,
            size: activeSize,
            qty: 1
        };
    } else {
        cart[itemKey].qty += 1;
    }

    syncCardUI(id);
    updateCart();
    if (activeProductId === id) updateModalActionButton();
}

function changeQty(id, d) {
    let targetKey = null;
    for (let key in cart) {
        if (cart[key].id === id) {
            targetKey = key;
            break;
        }
    }
    
    if (!targetKey) return;
    
    cart[targetKey].qty += d;
    if (cart[targetKey].qty <= 0) {
        delete cart[targetKey];
    }
    
    syncCardUI(id);
    updateCart();
    if (activeProductId === id) updateModalActionButton();
}

function syncCardUI(id) {
    const card = document.querySelector('[data-id="' + id + '"]');
    if (!card) return;
    const btn = card.querySelector('.btn');
    const counter = card.querySelector('.counter');
    const qtySpan = card.querySelector('#qty-' + id);
    
    let totalQty = 0;
    for (let key in cart) {
        if (cart[key].id === id) totalQty += cart[key].qty;
    }
    
    if (totalQty === 0) {
        if (btn) btn.style.display = 'block';
        if (counter) counter.style.display = 'none';
    } else {
        if (btn) btn.style.display = 'none';
        if (counter) counter.style.display = 'flex';
        if (qtySpan) qtySpan.innerText = totalQty;
    }
}

function updateCart() {
    let total = 0, hasItems = false;
    for (let key in cart) {
        total += cart[key].price * cart[key].qty;
        hasItems = true;
    }
    const bar = document.getElementById('bar');
    const totalSpan = document.getElementById('total');
    if (bar) bar.style.display = hasItems ? 'block' : 'none';
    if (totalSpan) totalSpan.innerText = total.toLocaleString() + ' ₽';
}

// Сортировка и меню
function toggleSortMenu() {
    const dropdown = document.getElementById('sortDropdown');
    if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function sortProducts(type, element) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll('.card'));
    
    document.querySelectorAll('.sort-option').forEach(opt => opt.classList.remove('active'));
    if (element) element.classList.add('active');

    cards.sort((a, b) => {
        if (type === 'default' || type === 'new') return parseInt(a.getAttribute('data-id')) - parseInt(b.getAttribute('data-id'));
        let priceA = parseInt(a.getAttribute('data-price')) || 0;
        let priceB = parseInt(b.getAttribute('data-price')) || 0;
        return type === 'low-high' ? priceA - priceB : priceB - priceA;
    });

    cards.forEach(card => grid.appendChild(card));
    const dropdown = document.getElementById('sortDropdown');
    if (dropdown) dropdown.style.display = 'none';
}

// Избранное
function toggleFavorite(id) {
    const index = favorites.indexOf(id.toString());
    const cards = document.querySelectorAll('[data-id="' + id + '"]');
    
    if (index === -1) {
        favorites.push(id.toString());
        cards.forEach(c => { const b = c.querySelector('.fav-btn'); if(b) b.classList.add('active'); });
        if (activeProductId === id) document.getElementById('modalFavBtn').classList.add('active');
    } else {
        favorites.splice(index, 1);
        cards.forEach(c => { const b = c.querySelector('.fav-btn'); if(b) b.classList.remove('active'); });
        if (activeProductId === id) document.getElementById('modalFavBtn').classList.remove('active');
    }
    updateFavBadge();
}

function updateFavBadge() {
    const badge = document.getElementById('favBadge');
    if (badge) badge.innerText = favorites.length > 0 ? '(' + favorites.length + ')' : '';
}

// Открытие детальной модалки товара
function openProductModal(id) {
    const prod = productsData[id];
    if (!prod) return;

    activeProductId = id;
    activeColorIndex = 0;
    activeSlideIndex = 0;
    activeSize = "XS";

    document.getElementById('modalProductTitle').innerText = prod.name;
    document.getElementById('modalProductPrice').innerText = prod.price.toLocaleString() + ' ₽';
    document.getElementById('modalProductDesc').innerText = prod.desc;
    document.getElementById('descMoreBlock').innerHTML = prod.moreDesc;
    
    document.getElementById('descMoreBlock').style.display = 'none';
    document.getElementById('readMoreBtn').innerText = 'Читать дальше ❯';

    const favBtn = document.getElementById('modalFavBtn');
    if (favorites.includes(id.toString())) favBtn.classList.add('active');
    else favBtn.classList.remove('active');

    const colorSection = document.getElementById('colorSection');
    colorSection.style.display = prod.colors.length <= 1 ? 'none' : 'block';

    const colorContainer = document.getElementById('colorPickerContainer');
    colorContainer.innerHTML = '';
    prod.colors.forEach((color, index) => {
        const badge = document.createElement('button');
        badge.className = 'color-badge' + (index === 0 ? ' active' : '');
        badge.innerHTML = '<img src="' + color.img + '">';
        badge.onclick = () => selectColor(index);
        colorContainer.appendChild(badge);
    });

    const initialColorName = prod.colors[0] ? prod.colors[0].name : "Черный";
    document.getElementById('selectedColorText').innerText = initialColorName;
    document.getElementById('specColor').innerText = initialColorName;

    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    const defaultSizeBtn = document.querySelector('.size-btn');
    if (defaultSizeBtn) defaultSizeBtn.classList.add('active');
    document.getElementById('selectedSizeText').innerText = 'XS';
    document.getElementById('specSize').innerText = 'XS';

    buildGallery();
    updateModalActionButton();
    showOverlay('productModal');
}

function closeProductModal() {
    hideOverlay('productModal');
    activeProductId = null;
}

// Галерея внутри карточки
function buildGallery() {
    const prod = productsData[activeProductId];
    if (!prod) return;
    const gallery = prod.colors[activeColorIndex].gallery;
    const slidesContainer = document.getElementById('modalSlides');
    if (!slidesContainer) return;
    slidesContainer.innerHTML = '';

    gallery.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'modal-img' + (index === activeSlideIndex ? ' active' : '');
        slidesContainer.appendChild(img);
    });
}

function moveSlide(direction) {
    const prod = productsData[activeProductId];
    if (!prod) return;
    const gallery = prod.colors[activeColorIndex].gallery;
    
    activeSlideIndex += direction;
    if (activeSlideIndex >= gallery.length) activeSlideIndex = 0;
    if (activeSlideIndex < 0) activeSlideIndex = gallery.length - 1;

    const imgs = document.querySelectorAll('#modalSlides .modal-img');
    imgs.forEach((img, idx) => {
        if (idx === activeSlideIndex) img.classList.add('active');
        else img.classList.remove('active');
    });
}

function selectColor(index) {
    activeColorIndex = index;
    activeSlideIndex = 0;
    
    const badges = document.querySelectorAll('#colorPickerContainer .color-badge');
    badges.forEach((badge, idx) => {
        if (idx === index) badge.classList.add('active');
        else badge.classList.remove('active');
    });

    const prod = productsData[activeProductId];
    document.getElementById('selectedColorText').innerText = prod.colors[index].name;
    document.getElementById('specColor').innerText = prod.colors[index].name;
    
    buildGallery();
    updateModalActionButton(); 
}

function selectSize(size, element) {
    activeSize = size;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    if (element) element.classList.add('active');
    
    document.getElementById('selectedSizeText').innerText = size;
    document.getElementById('specSize').innerText = size;
    
    updateModalActionButton(); 
}

function toggleDescription() {
    const block = document.getElementById('descMoreBlock');
    const btn = document.getElementById('readMoreBtn');
    if (block.style.display === 'none') {
        block.style.display = 'block';
        btn.innerText = 'Скрыть описание ❮';
    } else {
        block.style.display = 'none';
        btn.innerText = 'Читать дальше ❯';
    }
}

function updateModalActionButton() {
    const btn = document.getElementById('modalActionBtn');
    if (!btn) return;
    
    const prod = productsData[activeProductId];
    if (!prod) return;
    const selectedColor = prod.colors[activeColorIndex] ? prod.colors[activeColorIndex].name : "Черный";
    const itemKey = `${activeProductId}_${selectedColor}_${activeSize}`;

    if (cart[itemKey]) {
        btn.innerText = `В корзине (${cart[itemKey].qty} шт.) — Добавить ещё`;
    } else {
        btn.innerText = 'Добавить в корзину';
    }
}

function handleModalAction() {
    if (!activeProductId) return;
    const prod = productsData[activeProductId];
    const selectedColor = prod.colors[activeColorIndex].name;
    const itemKey = `${activeProductId}_${selectedColor}_${activeSize}`;

    if (!cart[itemKey]) {
        cart[itemKey] = {
            id: activeProductId,
            name: prod.name,
            price: prod.price,
            color: selectedColor,
            size: activeSize,
            qty: 1
        };
    } else {
        cart[itemKey].qty += 1;
    }

    syncCardUI(activeProductId);
    updateCart();
    updateModalActionButton();
}

function changeModalQty(itemKey, d) {
    if (!cart[itemKey]) return;
    cart[itemKey].qty += d;
    if (cart[itemKey].qty <= 0) {
        const originalId = cart[itemKey].id;
        delete cart[itemKey];
        syncCardUI(originalId);
    } else {
        syncCardUI(cart[itemKey].id);
    }
    updateCart();
    openCartModal(); 
}

function openCartModal() {
    const container = document.getElementById('cartListContainer');
    const totalModalSpan = document.getElementById('cartModalTotal');
    if (!container) return;
    container.innerHTML = '';
    
    let total = 0;
    let hasItems = false;

    for (let key in cart) {
        hasItems = true;
        const item = cart[key];
        total += item.price * item.qty;
        
        const row = document.createElement('div');
        row.className = 'fav-item-row';
        row.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2px; text-align:left;">
                <div style="font-weight:600;font-size:14px;color:#fff;">${item.name}</div>
                <div style="font-size:12px;color:var(--hint);">Цвет: ${item.color} | Размер: ${item.size}</div>
                <div style="font-size:13px;color:#3182ce;font-weight:600;">${item.price.toLocaleString()} ₽</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button onclick="changeModalQty('${key}', -1)" style="padding:4px 10px; background:#2c2c2e; border:none; color:#fff; border-radius:6px; cursor:pointer;">-</button>
                <span style="color:#fff;">${item.qty}</span>
                <button onclick="changeModalQty('${key}', 1)" style="padding:4px 10px; background:#2c2c2e; border:none; color:#fff; border-radius:6px; cursor:pointer;">+</button>
            </div>
        `;
        container.appendChild(row);
    }

    if (!hasItems) {
        container.innerHTML = '<div style="color:var(--hint);text-align:center;padding:20px;">Корзина пуста</div>';
    }
    if (totalModalSpan) totalModalSpan.innerText = total.toLocaleString() + ' ₽';
    showOverlay('cartModal');
}

function closeCartModal() { hideOverlay('cartModal'); }
function openOrderModal() { showOverlay('orderModal'); }
function closeOrderModal() { hideOverlay('orderModal'); }

function openFavoritesModal() {
    const container = document.getElementById('favoritesListContainer');
    if (!container) return;
    container.innerHTML = '';

    if (favorites.length === 0) {
        container.innerHTML = '<div style="color:var(--hint);text-align:center;padding:20px;">Список пуст</div>';
    } else {
        favorites.forEach(id => {
            const prod = productsData[id];
            if (prod) {
                const initialImg = prod.colors ? prod.colors.img : "img/corsetTie.jpg";
                const row = document.createElement('div');
                row.className = 'fav-item-row';
                row.innerHTML = `
                    <div onclick="closeFavoritesModal(); openProductModal('${id}')" style="cursor:pointer; display:flex; align-items:center; gap:10px;">
                        <img src="${initialImg}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
                        <div style="text-align:left;">
                            <div style="font-weight:600;font-size:14px;color:#fff;">${prod.name}</div>
                            <div style="font-size:13px;color:var(--hint);">${prod.price.toLocaleString()} ₽</div>
                        </div>
                    </div>
                    <button onclick="toggleFavorite('${id}'); openFavoritesModal();" style="background:none;border:none;color:#ff3b30;font-size:18px;cursor:pointer;">✕</button>
                `;
                container.appendChild(row);
            }
        });
    }
    showOverlay('favoritesModal');
}
function closeFavoritesModal() { hideOverlay('favoritesModal'); }

// Функция отправки заказа через стабильный CORS-прокси шлюз AllOrigins
function sendOrder(event) {
    event.preventDefault();
    const name = document.getElementById('cName').value;
    const phone = document.getElementById('cPhone').value;
    const tgUsername = document.getElementById('cTelegram').value.replace('@', ''); 
    const clientEmail = document.getElementById('cEmail').value;
    const address = document.getElementById('cAdr').value;

    let productsText = "";
    let total = 0;
    for (let key in cart) {
        const item = cart[key];
        productsText += `\n• ${item.name} (Цвет: ${item.color}, Размер: ${item.size}) — ${item.qty} шт.`;
        total += item.price * item.qty;
    }

    const TELEGRAM_BOT_TOKEN = '8680387241:AAE4HzCntMS-7t1wRRM17ZYlMwpdF3p-HJg';
    const TELEGRAM_CHAT_ID = '1415007205';
    const MY_EMAIL = 'kama.brand.shop@mail.ru'; 

    const text = `🛍️ НОВЫЙ ЗАКАЗ\n\n👤 Имя: ${name}\n📞 Telephone: ${phone}\n✈️ Профиль ТГ: t.me/${tgUsername}\n📧 E-mail клиента: ${clientEmail}\n📍 Адрес: ${address}\n\n📦 Товары:${productsText}\n\n💰 Итого: ${total.toLocaleString()} ₽`;

    // Формируем прямую ссылку запроса к API Telegram
    const tgApiUrl = `https://telegram.org{TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(text)}`;
    
    // Прогоняем её через открытый шлюз AllOrigins, который обходит CORS-блокировки
    fetch(`https://allorigins.win{encodeURIComponent(tgApiUrl)}`)
    .then(response => {
        // Вызываем дублирование письма на почту
        const subject = `Новый заказ от ${name}`;
        const mailBody = `Привет! Оформлен новый заказ.\n\nДанные покупателя:\nИмя: ${name}\nТелефон: ${phone}\nTelegram: @${tgUsername}\nE-mail: ${clientEmail}\nАдрес: ${address}\n\nСостав заказа:${productsText}\n\nИтого: ${total.toLocaleString()} ₽`;
        window.location.href = `mailto:${MY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;

        alert(`Спасибо, ${name}! Заказ успешно оформлен и отправлен менеджеру в Telegram.`);
        
        cart = {};
        for (let id in productsData) {
            if (typeof syncCardUI === 'function') syncCardUI(id);
        }
        if (typeof updateCart === 'function') updateCart();
        if (typeof closeOrderModal === 'function') closeOrderModal();
    })
    .catch(error => {
        console.error('Ошибка шлюза:', error);
        window.location.href = `mailto:${MY_EMAIL}?subject=Заказ&body=${encodeURIComponent(text)}`;
    });
}
