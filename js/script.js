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

function openOrderModal() { showOverlay('orderModal'); prepareOrderData(); }
function closeOrderModal() { hideOverlay('orderModal'); }
function openCartModal() { showOverlay('cartModal'); renderCart(); }
function closeCartModal() { hideOverlay('cartModal'); }
function closeProductModal() { hideOverlay('productModal'); activeProductId = null; }

// Функции корзины
function addToCart(id) {
    const prod = productsData[id];
    if (!prod) return;
    
    // ИСПРАВЛЕНО: Безопасное чтение первого цвета из массива через индекс [0]
    const defaultColor = (prod.colors && prod.colors[0]) ? prod.colors[0].name : "Черный";
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
    const card = document.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    
    const btn = card.querySelector('.btn');
    const counter = card.querySelector('.counter');
    const qtySpan = card.querySelector(`#qty-${id}`);
    
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
    
    // ИСПРАВЛЕНО: Защита от null, если элементов bar и total нет на странице
    const bar = document.getElementById('bar');
    const totalSpan = document.getElementById('total');
    if (bar) bar.style.display = hasItems ? 'block' : 'none';
    if (totalSpan) totalSpan.innerText = total.toLocaleString() + ' ₽';
    
    const modalTotal = document.getElementById('cartModalTotal');
    if (modalTotal) modalTotal.innerText = total.toLocaleString() + ' ₽';
}

// Сортировка
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
    const cards = document.querySelectorAll(`[data-id="${id}"]`);
    
    if (index === -1) {
        favorites.push(id.toString());
        cards.forEach(c => c.querySelector('.fav-btn')?.classList.add('active'));
        if (activeProductId === id) document.getElementById('modalFavBtn')?.classList.add('active');
    } else {
        favorites.splice(index, 1);
        cards.forEach(c => c.querySelector('.fav-btn')?.classList.remove('active'));
        if (activeProductId === id) document.getElementById('modalFavBtn')?.classList.remove('active');
    }
}

// Детальная модалка товара
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
    if (favBtn) {
        if (favorites.includes(id.toString())) favBtn.classList.add('active');
        else favBtn.classList.remove('active');
    }

    const colorSection = document.getElementById('colorSection');
    if (colorSection) colorSection.style.display = prod.colors.length <= 1 ? 'none' : 'block';

    const colorContainer = document.getElementById('colorPickerContainer');
    if (colorContainer) {
        colorContainer.innerHTML = '';
        prod.colors.forEach((color, index) => {
            const badge = document.createElement('button');
            badge.className = 'color-badge' + (index === 0 ? ' active' : '');
            badge.innerHTML = '<img src="' + color.img + '">';
            badge.onclick = () => selectColor(index);
            colorContainer.appendChild(badge);
        });
    }

    // ИСПРАВЛЕНО: Корректное чтение первого цвета из массива через [0]
    const initialColorName = (prod.colors && prod.colors[0]) ? prod.colors[0].name : "Черный";
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

function selectColor(index) {
    activeColorIndex = index;
    const prod = productsData[activeProductId];
    if (!prod || !prod.colors[index]) return;
    const color = prod.colors[index];
    
    document.getElementById('selectedColorText').innerText = color.name;
    document.getElementById('specColor').innerText = color.name;
    
    document.querySelectorAll('.color-badge').forEach((b, i) => {
        if(i === index) b.classList.add('active');
        else b.classList.remove('active');
    });
    
    activeSlideIndex = 0;
    buildGallery();
}

function selectSize(size, element) {
    activeSize = size;
    document.getElementById('selectedSizeText').innerText = size;
    document.getElementById('specSize').innerText = size;
    
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    if(element) element.classList.add('active');
    updateModalActionButton();
}

function toggleDescription() {
    const block = document.getElementById('descMoreBlock');
    const btn = document.getElementById('readMoreBtn');
    if(block.style.display === 'none') {
        block.style.display = 'block';
        btn.innerText = 'Свернуть ❮';
    } else {
        block.style.display = 'none';
        btn.innerText = 'Читать дальше ❯';
    }
}
// Галерея слайдов в модалке товара
function buildGallery() {
    const prod = productsData[activeProductId];
    if (!prod || !prod.colors || !prod.colors[activeColorIndex]) return;
    const gallery = prod.colors[activeColorIndex].gallery;
    const container = document.getElementById('modalSlides');
    if (!container) return;
    container.innerHTML = '';
    
    gallery.forEach((src, idx) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'modal-img' + (idx === activeSlideIndex ? ' active' : '');
        container.appendChild(img);
    });
}

function moveSlide(d) {
    const prod = productsData[activeProductId];
    if (!prod || !prod.colors || !prod.colors[activeColorIndex]) return;
    const gallery = prod.colors[activeColorIndex].gallery;
    activeSlideIndex = (activeSlideIndex + d + gallery.length) % gallery.length;
    buildGallery();
}

// Управление состоянием кнопки добавления в модальном окне
function updateModalActionButton() {
    const btn = document.getElementById('modalActionBtn');
    if (!btn) return;
    const prod = productsData[activeProductId];
    if (!prod || !prod.colors || !prod.colors[activeColorIndex]) return;
    const colorName = prod.colors[activeColorIndex].name || "Черный";
    const itemKey = `${activeProductId}_${colorName}_${activeSize}`;
    
    if (cart[itemKey]) {
        btn.innerText = `В корзине (${cart[itemKey].qty} шт.) — Добавить еще`;
    } else {
        btn.innerText = 'Добавить в корзину';
    }
}

function handleModalAction() {
    const prod = productsData[activeProductId];
    if (!prod || !prod.colors || !prod.colors[activeColorIndex]) return;
    const colorName = prod.colors[activeColorIndex].name || "Черный";
    const itemKey = `${activeProductId}_${colorName}_${activeSize}`;
    
    if (!cart[itemKey]) {
        cart[itemKey] = {
            id: activeProductId,
            name: prod.name,
            price: prod.price,
            color: colorName,
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

// Отображение списка товаров в корзине
function renderCart() {
    const container = document.getElementById('cartListContainer');
    if (!container) return;
    container.innerHTML = '';
    
    let hasItems = false;
    for (let key in cart) {
        hasItems = true;
        const item = cart[key];
        const row = document.createElement('div');
        row.className = 'fav-item-row';
        row.innerHTML = `
            <div>
                <div style="font-weight:600;">${item.name}</div>
                <div style="font-size:12px; color:#8e8e93;">Размер: ${item.size} | Цвет: ${item.color}</div>
                <div style="font-weight:700; margin-top:4px;">${(item.price * item.qty).toLocaleString()} ₽</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="changeQtyByKey('${key}', -1)" style="background:#2c2c2e; border:none; color:#fff; width:30px; height:30px; border-radius:6px; cursor:pointer;">-</button>
                <span>${item.qty}</span>
                <button onclick="changeQtyByKey('${key}', 1)" style="background:#2c2c2e; border:none; color:#fff; width:30px; height:30px; border-radius:6px; cursor:pointer;">+</button>
            </div>
        `;
        container.appendChild(row);
    }
    
    if (!hasItems) {
        container.innerHTML = '<div style="color:#8e8e93; text-align:center; padding:20px 0;">Ваша корзина пуста</div>';
    }
}

function changeQtyByKey(key, d) {
    if (!cart[key]) return;
    cart[key].qty += d;
    const prodId = cart[key].id;
    if (cart[key].qty <= 0) {
        delete cart[key];
    }
    syncCardUI(prodId);
    updateCart();
    renderCart();
}

// Сборка структуры заказа (Текст, который придет на почту)
function prepareOrderData() {
    const inputDetails = document.getElementById('cCartDetails');
    if (!inputDetails) return;
    
    let textDetails = "СПИСОК ТОВАРОВ В ЗАКАЗЕ:\n";
    let totalSum = 0;
    let counter = 1;
    
    for (let key in cart) {
        const item = cart[key];
        const itemTotal = item.price * item.qty;
        totalSum += itemTotal;
        
        textDetails += `${counter}. ${item.name}\n`;
        textDetails += `   - Цвет: ${item.color}\n`;
        textDetails += `   - Размер: ${item.size}\n`;
        textDetails += `   - Кол-во: ${item.qty} шт.\n`;
        textDetails += `   - Цена за шт: ${item.price.toLocaleString()} ₽\n`;
        textDetails += `   - Стоимость позиции: ${itemTotal.toLocaleString()} ₽\n\n`;
        counter++;
    }
    
    textDetails += `ИТОГОВАЯ СУММА ЗАКАЗА: ${totalSum.toLocaleString()} ₽`;
    inputDetails.value = textDetails;
}

// Отправка формы на Formspree без перезагрузки и очистка корзины
document.addEventListener('DOMContentLoaded', () => {
    // Безопасный первичный запуск
    updateCart();

    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function(event) {
            event.preventDefault();
            prepareOrderData();
            
            const formData = new FormData(orderForm);
            
            fetch(orderForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            }).then(response => {
                if (response.ok) {
                    alert('✨ Спасибо за заказ! Мы свяжемся с вами в Telegram в ближайшее время.');
                    cart = {};
                    orderForm.reset();
                    for (let id in productsData) { syncCardUI(id); }
                    updateCart();
                    closeOrderModal();
                } else {
                    alert('Произошла ошибка при отправке. Пожалуйста, проверьте форму.');
                }
            }).catch(error => {
                alert('Ошибка сети. Проверьте соединение.');
            });
        });
    }
});

