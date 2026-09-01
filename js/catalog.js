import { getLocalizedField, t } from './i18n.js';

// Специальный псевдо-раздел "Рекомендуем" - не является настоящей
// категорией из таблицы, а фильтрует товары по колонке is_featured.
export const FEATURED_CATEGORY_ID = '__featured__';

/**
 * Строит дерево категорий из плоского списка (через parent_id).
 * Поддерживает произвольную глубину вложенности.
 * Возвращает массив узлов верхнего уровня, отсортированных по sort_order,
 * у каждого узла есть поле .children (тоже отсортированное).
 */
export function buildCategoryTree(categories) {
  const bySortOrder = (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);

  const nodes = {};
  categories.forEach(cat => {
    nodes[cat.category_id] = { ...cat, children: [] };
  });

  const roots = [];
  categories.forEach(cat => {
    const node = nodes[cat.category_id];
    const parentId = cat.parent_id;
    if (parentId && nodes[parentId]) {
      nodes[parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRecursive = list => {
    list.sort(bySortOrder);
    list.forEach(n => sortRecursive(n.children));
  };
  sortRecursive(roots);

  return roots;
}

/** Собирает id самой категории и всех её потомков (рекурсивно). */
export function getSubtreeIds(node) {
  let ids = [node.category_id];
  node.children.forEach(child => {
    ids = ids.concat(getSubtreeIds(child));
  });
  return ids;
}

function findNodeById(tree, id) {
  for (const node of tree) {
    if (node.category_id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Фильтрует товары по выбранной категории (включая её подкатегории)
 * и по строке поиска (по локализованному названию).
 */
export function filterProducts(products, { categoryTree, selectedCategoryId, searchQuery }) {
  let result = products;

  if (selectedCategoryId === FEATURED_CATEGORY_ID) {
    result = result.filter(p => String(p.is_featured).trim().toUpperCase() === 'TRUE');
  } else if (selectedCategoryId) {
    const node = findNodeById(categoryTree, selectedCategoryId);
    const allowedIds = node ? getSubtreeIds(node) : [selectedCategoryId];
    result = result.filter(p => allowedIds.includes(p.category_id));
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter(p => getLocalizedField(p, 'name').toLowerCase().includes(q));
  }

  return result.slice().sort(
    (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
  );
}

/** Рендерит ряд чипов категорий одного уровня. leadingChips - доп.
 *  чипы перед "Все" (например { id, label } для "Рекомендуем"). */
export function renderChips(container, nodes, selectedId, onSelect, { isSub = false, leadingChips = [] } = {}) {
  container.innerHTML = '';

  leadingChips.forEach(({ id, label }) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (isSub ? ' chip--sub' : '') + (selectedId === id ? ' is-active' : '');
    chip.textContent = label;
    chip.addEventListener('click', () => onSelect(id));
    container.appendChild(chip);
  });

  const allChip = document.createElement('button');
  allChip.type = 'button';
  allChip.className = 'chip' + (isSub ? ' chip--sub' : '') + (selectedId === null ? ' is-active' : '');
  allChip.textContent = t('category_all');
  allChip.addEventListener('click', () => onSelect(null));
  container.appendChild(allChip);

  nodes.forEach(node => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (isSub ? ' chip--sub' : '') + (selectedId === node.category_id ? ' is-active' : '');
    chip.textContent = getLocalizedField(node, 'name');
    chip.addEventListener('click', () => onSelect(node.category_id));
    container.appendChild(chip);
  });
}

/** Создаёт DOM-карточку товара. qty - текущее количество в корзине. */
export function createProductCard(product, qty, currencySymbol) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.sku = product.sku;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'product-card__image-wrap';
  const img = document.createElement('img');
  img.className = 'product-card__image';
  img.loading = 'lazy';
  img.src = firstImage(product.image_url) || 'assets/placeholder.svg';
  img.alt = getLocalizedField(product, 'name');
  img.onerror = () => { img.src = 'assets/placeholder.svg'; };
  imageWrap.appendChild(img);

  const body = document.createElement('div');
  body.className = 'product-card__body';

  const name = document.createElement('div');
  name.className = 'product-card__name';
  name.textContent = getLocalizedField(product, 'name');

  const price = document.createElement('div');
  price.className = 'product-card__price';
  price.innerHTML = `${formatPrice(product.price)} ${currencySymbol} <span class="product-card__unit">/ ${product.unit || ''}</span>`;

  const controls = document.createElement('div');
  controls.className = 'product-card__controls';
  renderCardControls(controls, qty);

  body.append(name, price, controls);
  card.append(imageWrap, body);

  return card;
}

/** Перерисовывает только блок +/- внутри уже существующей карточки. */
export function renderCardControls(container, qty) {
  container.innerHTML = '';

  if (qty > 0) {
    const stepper = document.createElement('div');
    stepper.className = 'qty-stepper';
    stepper.innerHTML = `
      <button type="button" data-action="decrement" aria-label="-">−</button>
      <span class="qty-stepper__value">${qty}</span>
      <button type="button" data-action="increment" aria-label="+">+</button>
    `;
    container.appendChild(stepper);
  } else {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'add-btn';
    btn.dataset.action = 'increment';
    btn.textContent = t('add_to_cart');
    container.appendChild(btn);
  }
}

function firstImage(imageUrlField) {
  if (!imageUrlField) return '';
  return String(imageUrlField).split(',')[0].trim();
}

export function formatPrice(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('ru-RU');
}
