import { CONFIG } from './config.js';

/**
 * Загружает каталог (категории, товары, настройки) из Apps Script.
 * Использует кэш в localStorage, чтобы не дёргать API при каждом
 * открытии приложения — актуальность каталога обновляется не мгновенно,
 * а с задержкой до CATALOG_CACHE_TTL_MS (см. config.js), что осознанный
 * компромисс между скоростью загрузки и свежестью данных.
 *
 * @param {boolean} forceRefresh - игнорировать кэш и загрузить заново
 */
export async function fetchCatalog(forceRefresh = false) {
  const cacheKey = CONFIG.STORAGE_KEYS.CATALOG_CACHE;

  if (!forceRefresh) {
    const cached = readCache(cacheKey);
    if (cached) return cached;
  }

  if (!CONFIG.CATALOG_API_URL || CONFIG.CATALOG_API_URL.startsWith('ВСТАВЬТЕ')) {
    throw new Error(
      'CATALOG_API_URL не настроен в js/config.js — вставьте туда URL вашего Apps Script Web App.'
    );
  }

  const res = await fetch(CONFIG.CATALOG_API_URL, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Ошибка загрузки каталога: HTTP ${res.status}`);
  }

  const data = await res.json();
  writeCache(cacheKey, data);
  return data;
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.savedAt) return null;

    const age = Date.now() - parsed.savedAt;
    if (age > CONFIG.CATALOG_CACHE_TTL_MS) return null;

    return parsed.data;
  } catch (err) {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch (err) {
    // localStorage может быть недоступен/переполнен — не критично, просто без кэша
  }
}

/**
 * Отправляет сформированный заказ на вебхук Make.
 *
 * Пока ORDER_WEBHOOK_URL не задан в config.js (сценарий Make ещё не
 * настроен), функция работает в ТЕСТОВОМ РЕЖИМЕ: не отправляет запрос
 * по-настоящему, а только логирует заказ в консоль и имитирует
 * успешный ответ. Это позволяет полностью протестировать интерфейс
 * (корзину, форму, экран успеха) до того, как будет готов сценарий Make.
 *
 * После настройки Make — просто вписать URL в config.js, менять
 * код здесь не требуется.
 */
export async function submitOrder(order) {
  if (!CONFIG.ORDER_WEBHOOK_URL) {
    console.warn('[submitOrder] ORDER_WEBHOOK_URL не задан — тестовый режим, заказ не отправлен по сети:', order);
    await new Promise(resolve => setTimeout(resolve, 600)); // имитация сетевой задержки
    return { ok: true, test_mode: true };
  }

  const res = await fetch(CONFIG.ORDER_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });

  if (!res.ok) {
    throw new Error(`Ошибка отправки заказа: HTTP ${res.status}`);
  }

  return { ok: true, test_mode: false };
}
