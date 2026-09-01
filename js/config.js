// ============================================================
// Все адреса и настройки проекта собраны в одном месте, чтобы
// после деплоя Apps Script и Make было достаточно поправить
// значения именно здесь.
// ============================================================

export const CONFIG = {
  // URL Web App из Apps Script (файл Code.gs), отдающий JSON каталога.
  // Пример: 'https://script.google.com/macros/s/AKfycb.../exec'
  CATALOG_API_URL: 'https://script.google.com/macros/s/AKfycbzod7Yub4l9eC-oUJcTY8slVlBqEu5NLB-h4BmnBDk0Yl26PXaUXPJw1R0EI95fgohb/exec',

  // URL вебхука Make, который будет принимать оформленные заказы.
  // Пока пустой — сценарий Make настроим на следующем шаге.
  // Пока это поле пустое, отправка заказа работает в тестовом режиме
  // (см. js/api.js -> submitOrder).
  ORDER_WEBHOOK_URL: 'https://hook.eu1.make.com/yrkb5n14aabh1njb96gltqgybxu3wq0o',

  // Сколько миллисекунд хранить каталог в кэше браузера (localStorage),
  // чтобы не дёргать Apps Script при каждом открытии приложения.
  CATALOG_CACHE_TTL_MS: 10 * 60 * 1000, // 10 минут

  // Поддерживаемые языки интерфейса и язык по умолчанию.
  SUPPORTED_LANGS: ['ru', 'sr'],
  
    // Язык, на котором в Google Таблице ведутся "безсуффиксные" колонки —
  // name, description и т.д. (то есть колонки БЕЗ суффикса _sr, _en и т.п.).
  // Это язык самих ДАННЫХ, а не интерфейса — трогать эту настройку нужно,
  // только если вы физически переименуете эти колонки в таблице на другой
  // язык. От DEFAULT_LANG ниже она полностью независима.
  BASE_DATA_LANG: 'ru',

  // Язык интерфейса по умолчанию — используется, если не удалось
  // определить предпочтение пользователя (нет сохранённого выбора,
  // Telegram/браузер не сообщили поддерживаемый язык). Можно свободно
  // менять на любой из SUPPORTED_LANGS, не оглядываясь на BASE_DATA_LANG.
  DEFAULT_LANG: 'sr',


  // Используется, если в листе Settings не задан currency_symbol.
  DEFAULT_CURRENCY_SYMBOL: 'RSD',

  // Ключи localStorage.
  STORAGE_KEYS: {
    CART: 'shop_cart_v1',
    LANG: 'shop_lang_v1',
    CATALOG_CACHE: 'shop_catalog_cache_v1',
  },
};
