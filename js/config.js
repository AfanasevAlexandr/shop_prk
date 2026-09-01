export const CONFIG = {

  CATALOG_API_URL: 'https://script.google.com/macros/s/AKfycbw4vFMKhuU-Vr11d01iTCGfD2ahw-67pgIkPN5nPOdLdI4THmE5CfEeNFfkJOIWEck/exec',

  ORDER_WEBHOOK_URL: 'https://hook.eu1.make.com/x2kfh9w78arc0rbex1vh3pwsyqfw6whv',

  CATALOG_CACHE_TTL_MS: 10 * 60 * 1000,

  SUPPORTED_LANGS: ['ru', 'sr'],
  
  BASE_DATA_LANG: 'ru',

  DEFAULT_LANG: 'sr',

  DEFAULT_CURRENCY_SYMBOL: 'rsd',

  STORAGE_KEYS: {
    CART: 'shop_cart_v1',
    LANG: 'shop_lang_v1',
    CATALOG_CACHE: 'shop_catalog_cache_v1',
  },
};
