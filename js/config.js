// ============================================================
// Все адреса и настройки проекта собраны в одном месте, чтобы
// после деплоя Apps Script и Make было достаточно поправить
// значения именно здесь.
// ============================================================

export const CONFIG = {

  CATALOG_API_URL: 'https://script.google.com/macros/s/AKfycbw4vFMKhuU-Vr11d01iTCGfD2ahw-67pgIkPN5nPOdLdI4THmE5CfEeNFfkJOIWEck/exec',

  ORDER_WEBHOOK_URL: 'https://hook.eu1.make.com/x2kfh9w78arc0rbex1vh3pwsyqfw6whv',

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
  DEFAULT_CURRENCY_SYMBOL: 'rsd',

  // Ключи localStorage.
  STORAGE_KEYS: {
    CART: 'shop_cart_v1',
    LANG: 'shop_lang_v1',
    CATALOG_CACHE: 'shop_catalog_cache_v1',
  },
};
