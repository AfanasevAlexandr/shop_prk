import { CONFIG } from './config.js';
import { initI18n, setLanguage, getLanguage, t, getLocalizedField } from './i18n.js';
import { fetchCatalog, submitOrder } from './api.js';
import * as cart from './cart.js';
import {
  buildCategoryTree,
  renderChips,
  FEATURED_CATEGORY_ID,
  filterProducts,
  createProductCard,
  renderCardControls,
  formatPrice,
} from './catalog.js';

// ---- Глобальное состояние приложения ----
const state = {
  categories: [],
  products: [],
  settings: {},
  categoryTree: [],
  selectedTopId: FEATURED_CATEGORY_ID,
  selectedSubId: null,
  searchQuery: '',
  currencySymbol: CONFIG.DEFAULT_CURRENCY_SYMBOL,
};

// ---- DOM-элементы ----
const el = {
  shopName: document.getElementById('shop-name'),
  welcomeText: document.getElementById('welcome-text'),
  langSwitch: document.getElementById('lang-switch'),
  searchInput: document.getElementById('search-input'),
  categoriesTop: document.getElementById('categories-top'),
  categoriesSub: document.getElementById('categories-sub'),
  loadingState: document.getElementById('loading-state'),
  errorState: document.getElementById('error-state'),
  emptyState: document.getElementById('empty-state'),
  retryBtn: document.getElementById('retry-btn'),
  productGrid: document.getElementById('product-grid'),

  cartBar: document.getElementById('cart-bar'),
  cartBarCount: document.getElementById('cart-bar-count'),
  cartBarTotal: document.getElementById('cart-bar-total'),

  cartOverlay: document.getElementById('cart-overlay'),
  cartClose: document.getElementById('cart-close'),
  cartItems: document.getElementById('cart-items'),
  cartEmptyState: document.getElementById('cart-empty-state'),
  cartFooter: document.getElementById('cart-footer'),
  cartTotalAmount: document.getElementById('cart-total-amount'),
  goToCheckout: document.getElementById('go-to-checkout'),

  checkoutOverlay: document.getElementById('checkout-overlay'),
  checkoutClose: document.getElementById('checkout-close'),
  checkoutBack: document.getElementById('checkout-back'),
  checkoutForm: document.getElementById('checkout-form'),
  checkoutSummary: document.getElementById('checkout-summary'),
  checkoutTotalAmount: document.getElementById('checkout-total-amount'),
  fieldName: document.getElementById('field-name'),
  fieldPhone: document.getElementById('field-phone'),
  fieldComment: document.getElementById('field-comment'),
  submitOrderBtn: document.getElementById('submit-order-btn'),

  successOverlay: document.getElementById('success-overlay'),
  successContact: document.getElementById('success-contact'),
  successClose: document.getElementById('success-close'),

  productOverlay: document.getElementById('product-overlay'),
  productClose: document.getElementById('product-close'),
  productDetail: document.getElementById('product-detail'),
};

const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

// ============================================================
// ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP
// ============================================================
function initTelegram() {
  if (!tg) return;

  tg.ready();
  tg.expand();

  applyThemeParams();
  tg.onEvent('themeChanged', applyThemeParams);

  if (tg.MainButton) {
    tg.MainButton.hide();
  }
}

function applyThemeParams() {
  if (!tg || !tg.themeParams) return;
  const p = tg.themeParams;
  const root = document.documentElement.style;

  if (p.bg_color) root.setProperty('--tg-bg-color', p.bg_color);
  if (p.secondary_bg_color) root.setProperty('--tg-secondary-bg-color', p.secondary_bg_color);
  if (p.text_color) root.setProperty('--tg-text-color', p.text_color);
  if (p.hint_color) root.setProperty('--tg-hint-color', p.hint_color);
  if (p.link_color) root.setProperty('--tg-link-color', p.link_color);
  if (p.button_color) root.setProperty('--tg-button-color', p.button_color);
  if (p.button_text_color) root.setProperty('--tg-button-text-color', p.button_text_color);
}

// ============================================================
// ЗАГРУЗКА КАТАЛОГА
// ============================================================
async function loadCatalog() {
  setViewState('loading');
  try {
    const data = await fetchCatalog();
    state.categories = data.categories || [];
    state.products = data.products || [];
    state.settings = data.settings || {};
    state.categoryTree = buildCategoryTree(state.categories);

    applySettingsToUI();
    setViewState('ready');
    renderCategories();
    renderProducts();
  } catch (err) {
    console.error(err);
    setViewState('error');
  }
}

function applySettingsToUI() {
  const lang = getLanguage();
  const shopName = state.settings.shop_name ? state.settings.shop_name[lang] : null;
  if (shopName) el.shopName.textContent = shopName;

  const welcomeText = state.settings.welcome_text ? state.settings.welcome_text[lang] : null;
  el.welcomeText.textContent = welcomeText || '';
  el.welcomeText.hidden = !welcomeText;

  const currency = state.settings.currency_symbol ? state.settings.currency_symbol[lang] : null;
  state.currencySymbol = currency || CONFIG.DEFAULT_CURRENCY_SYMBOL;
}

function setViewState(view) {
  el.loadingState.hidden = view !== 'loading';
  el.errorState.hidden = view !== 'error';
  el.productGrid.hidden = view !== 'ready';
}

// ============================================================
// РЕНДЕР КАТЕГОРИЙ
// ============================================================
function renderCategories() {
  renderChips(el.categoriesTop, state.categoryTree, state.selectedTopId, onSelectTopCategory, {
    leadingChips: [{ id: FEATURED_CATEGORY_ID, label: t('category_featured') }],
  });

  const topNode = state.categoryTree.find(n => n.category_id === state.selectedTopId);
  if (topNode && topNode.children.length > 0) {
    el.categoriesSub.hidden = false;
    renderChips(el.categoriesSub, topNode.children, state.selectedSubId, onSelectSubCategory, { isSub: true });
  } else {
    el.categoriesSub.hidden = true;
  }
}

function onSelectTopCategory(categoryId) {
  state.selectedTopId = categoryId;
  state.selectedSubId = null;
  renderCategories();
  renderProducts();
}

function onSelectSubCategory(categoryId) {
  state.selectedSubId = categoryId;
  renderCategories();
  renderProducts();
}

// ============================================================
// РЕНДЕР ТОВАРОВ
// ============================================================
function renderProducts() {
  const selectedCategoryId = state.selectedSubId || state.selectedTopId;
  const list = filterProducts(state.products, {
    categoryTree: state.categoryTree,
    selectedCategoryId,
    searchQuery: state.searchQuery,
  });

  el.productGrid.innerHTML = '';
  el.emptyState.hidden = list.length !== 0;
  el.productGrid.hidden = list.length === 0;

  list.forEach(product => {
    const card = createProductCard(product, cart.getQty(product.sku), state.currencySymbol);
    el.productGrid.appendChild(card);
  });
}

/** Обновляет только +/- controls конкретной карточки, без полного перерендера сетки. */
function refreshCardControls(sku) {
  const card = el.productGrid.querySelector(`.product-card[data-sku="${cssEscape(sku)}"]`);
  if (!card) return;
  const container = card.querySelector('.product-card__controls');
  renderCardControls(container, cart.getQty(sku));
}

function cssEscape(value) {
  return String(value).replace(/["\\]/g, '\\$&');
}

// Делегирование кликов по кнопкам +/- на сетке товаров
el.productGrid.addEventListener('click', e => {
  const actionBtn = e.target.closest('[data-action]');
  const card = e.target.closest('.product-card');
  if (!card) return;

  const sku = card.dataset.sku;

  if (actionBtn) {
    e.stopPropagation();
    if (actionBtn.dataset.action === 'increment') cart.increment(sku);
    if (actionBtn.dataset.action === 'decrement') cart.decrement(sku);
    refreshCardControls(sku);
    return;
  }

  // Клик по самой карточке (не по кнопке) - открыть детальный просмотр
  openProductDetail(sku);
});

// ============================================================
// ДЕТАЛЬНАЯ КАРТОЧКА ТОВАРА
// ============================================================
let currentDetailSku = null;

function openProductDetail(sku) {
  const product = state.products.find(p => p.sku === sku);
  if (!product) return;

  currentDetailSku = sku;
  el.productDetail.innerHTML = '';

  const img = document.createElement('img');
  img.className = 'product-detail__image';
  img.src = (String(product.image_url || '').split(',')[0] || '').trim() || 'assets/placeholder.svg';
  img.onerror = () => { img.src = 'assets/placeholder.svg'; };
  img.alt = getLocalizedField(product, 'name');

  const name = document.createElement('h2');
  name.className = 'product-detail__name';
  name.textContent = getLocalizedField(product, 'name');

  const price = document.createElement('p');
  price.className = 'product-detail__price';
  price.textContent = `${formatPrice(product.price)} ${state.currencySymbol} / ${product.unit || ''}`;

  const description = document.createElement('p');
  description.className = 'product-detail__description';
  description.textContent = getLocalizedField(product, 'description');

  const controls = document.createElement('div');
  controls.className = 'product-card__controls';
  renderCardControls(controls, cart.getQty(sku));

  el.productDetail.append(img, name, price, description, controls);
  openOverlay(el.productOverlay);
}

el.productDetail.addEventListener('click', e => {
  const actionBtn = e.target.closest('[data-action]');
  if (!actionBtn || !currentDetailSku) return;

  const sku = currentDetailSku;
  if (actionBtn.dataset.action === 'increment') cart.increment(sku);
  if (actionBtn.dataset.action === 'decrement') cart.decrement(sku);

  renderCardControls(el.productDetail.querySelector('.product-card__controls'), cart.getQty(sku));
  refreshCardControls(sku);
});

el.productClose.addEventListener('click', () => closeOverlay(el.productOverlay));

// ============================================================
// КОРЗИНА: ПАНЕЛЬ И ШТОРКА
// ============================================================
function updateCartBar() {
  const count = cart.getTotalItemsCount();
  const total = cart.getTotalPrice(state.products);

  el.cartBar.hidden = count === 0;
  el.cartBarCount.textContent = String(count);
  el.cartBarTotal.textContent = `${formatPrice(total)} ${state.currencySymbol}`;
}

function renderCartSheet() {
  const entries = cart.getEntries();
  el.cartItems.innerHTML = '';
  el.cartEmptyState.hidden = entries.length !== 0;
  el.cartFooter.hidden = entries.length === 0;

  entries.forEach(({ sku, qty }) => {
    const product = state.products.find(p => p.sku === sku);
    if (!product) return;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img class="cart-item__image" src="${(String(product.image_url || '').split(',')[0] || '').trim() || 'assets/placeholder.svg'}" alt="" />
      <div class="cart-item__body">
        <div class="cart-item__name">${escapeHtml(getLocalizedField(product, 'name'))}</div>
        <div class="cart-item__row">
          <span class="cart-item__price">${formatPrice(product.price)} ${state.currencySymbol}</span>
          <div class="qty-stepper">
            <button type="button" data-action="decrement" aria-label="-">−</button>
            <span class="qty-stepper__value">${qty}</span>
            <button type="button" data-action="increment" aria-label="+">+</button>
          </div>
        </div>
        <button type="button" class="cart-item__remove" data-action="remove">${t('remove')}</button>
      </div>
    `;
    row.dataset.sku = sku;
    el.cartItems.appendChild(row);
  });

  el.cartTotalAmount.textContent = `${formatPrice(cart.getTotalPrice(state.products))} ${state.currencySymbol}`;
}

el.cartItems.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const row = e.target.closest('.cart-item');
  const sku = row.dataset.sku;

  if (btn.dataset.action === 'increment') cart.increment(sku);
  if (btn.dataset.action === 'decrement') cart.decrement(sku);
  if (btn.dataset.action === 'remove') cart.removeItem(sku);

  renderCartSheet();
  refreshCardControls(sku);
});

el.cartBar.addEventListener('click', () => {
  renderCartSheet();
  openOverlay(el.cartOverlay);
});
el.cartClose.addEventListener('click', () => closeOverlay(el.cartOverlay));

// ============================================================
// ОФОРМЛЕНИЕ ЗАКАЗА
// ============================================================
el.goToCheckout.addEventListener('click', () => {
  closeOverlay(el.cartOverlay);
  renderCheckoutSummary();
  openOverlay(el.checkoutOverlay);
});

el.checkoutBack.addEventListener('click', () => {
  closeOverlay(el.checkoutOverlay);
  renderCartSheet();
  openOverlay(el.cartOverlay);
});
el.checkoutClose.addEventListener('click', () => closeOverlay(el.checkoutOverlay));

function renderCheckoutSummary() {
  const entries = cart.getEntries();
  el.checkoutSummary.innerHTML = '';

  entries.forEach(({ sku, qty }) => {
    const product = state.products.find(p => p.sku === sku);
    if (!product) return;
    const row = document.createElement('div');
    row.className = 'checkout-summary__row';
    row.innerHTML = `<span>${escapeHtml(getLocalizedField(product, 'name'))} × ${qty}</span><span>${formatPrice(cart.roundMoney(product.price * qty))} ${state.currencySymbol}</span>`;
    el.checkoutSummary.appendChild(row);
  });

  el.checkoutTotalAmount.textContent = `${formatPrice(cart.getTotalPrice(state.products))} ${state.currencySymbol}`;
}

el.checkoutForm.addEventListener('submit', async e => {
  e.preventDefault();

  if (!el.fieldName.value.trim() || !el.fieldPhone.value.trim()) {
    return; // required-атрибуты на инпутах уже подсветят пустые поля
  }

  el.submitOrderBtn.disabled = true;

  const entries = cart.getEntries();
  const items = entries
    .map(({ sku, qty }) => {
      const product = state.products.find(p => p.sku === sku);
      if (!product) return null;
      return {
        sku: product.sku,
        name: product.name,
        qty,
        price: product.price,
        sum: cart.roundMoney(product.price * qty),
      };
    })
    .filter(Boolean);

  const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;

  const order = {
    items,
    total: cart.getTotalPrice(state.products),
    currency: state.currencySymbol,
    customer: {
      name: el.fieldName.value.trim(),
      phone: el.fieldPhone.value.trim(),
      comment: el.fieldComment.value.trim(),
    },
    telegram_user: tgUser
      ? {
          id: tgUser.id,
          username: tgUser.username || '',
          first_name: tgUser.first_name || '',
          last_name: tgUser.last_name || '',
          language_code: tgUser.language_code || '',
        }
      : null,
    // initData (сырая, с подписью) - для проверки подлинности на стороне
    // Make/бэкенда, если решите это реализовать. Пока просто передаётся дальше.
    telegram_init_data: tg ? tg.initData : '',
    created_at: new Date().toISOString(),
  };

  try {
    await submitOrder(order);
    cart.clearCart();
    closeOverlay(el.checkoutOverlay);
    renderSuccessContact();
    openOverlay(el.successOverlay);
    el.checkoutForm.reset();
  } catch (err) {
    console.error(err);
    alert(t('order_error'));
  } finally {
    el.submitOrderBtn.disabled = false;
  }
});

function renderSuccessContact() {
  const lang = getLanguage();
  const contact = state.settings.manager_contact ? state.settings.manager_contact[lang] : null;
  el.successContact.textContent = contact || '';
  el.successContact.hidden = !contact;
}

el.successClose.addEventListener('click', () => closeOverlay(el.successOverlay));

// ============================================================
// ПОИСК
// ============================================================
let searchDebounceTimer = null;
el.searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    state.searchQuery = el.searchInput.value;
    renderProducts();
  }, 200);
});

// ============================================================
// ПЕРЕКЛЮЧЕНИЕ ЯЗЫКА
// ============================================================
el.langSwitch.addEventListener('click', async () => {
  const next = getLanguage() === 'ru' ? 'sr' : 'ru';
  await setLanguage(next);
  el.langSwitch.textContent = next.toUpperCase();
  applySettingsToUI();
  renderCategories();
  renderProducts();
  updateCartBar();
});

// ============================================================
// ПРОЧЕЕ
// ============================================================
el.retryBtn.addEventListener('click', loadCatalog);

function openOverlay(overlay) {
  overlay.hidden = false;
}
function closeOverlay(overlay) {
  overlay.hidden = true;
}

[el.cartOverlay, el.checkoutOverlay, el.successOverlay, el.productOverlay].forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay(overlay);
  });
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

cart.onCartChange(updateCartBar);

// ============================================================
// СТАРТ ПРИЛОЖЕНИЯ
// ============================================================
async function bootstrap() {
  initTelegram();
  const lang = await initI18n();
  el.langSwitch.textContent = lang.toUpperCase();
  await loadCatalog();
  updateCartBar();
}

bootstrap();
