import { CONFIG } from './config.js';

let currentLang = CONFIG.DEFAULT_LANG;
let dict = {};

/**
 * Определяет язык пользователя по приоритету:
 * 1. Ранее сохранённый вручную выбор (localStorage)
 * 2. Язык интерфейса Telegram (Telegram.WebApp.initDataUnsafe.user.language_code)
 * 3. Язык браузера (navigator.language) — на случай открытия вне Telegram
 * 4. Язык по умолчанию из конфига
 */
function detectLanguage() {
  const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.LANG);
  if (saved && CONFIG.SUPPORTED_LANGS.includes(saved)) {
    return saved;
  }

  const tg = window.Telegram && window.Telegram.WebApp;
  const tgLang = tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code;
  if (tgLang) {
    const short = tgLang.slice(0, 2).toLowerCase();
    if (CONFIG.SUPPORTED_LANGS.includes(short)) return short;
  }

  const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
  if (CONFIG.SUPPORTED_LANGS.includes(browserLang)) return browserLang;

  return CONFIG.DEFAULT_LANG;
}

async function loadDictionary(lang) {
  const res = await fetch(`./i18n/${lang}.json`);
  if (!res.ok) throw new Error(`Не удалось загрузить i18n/${lang}.json`);
  return res.json();
}

/**
 * Подставляет строки во все элементы с data-i18n / data-i18n-placeholder.
 */
function applyToDom() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.setAttribute('placeholder', dict[key]);
  });

  document.documentElement.lang = currentLang;
}

export async function initI18n() {
  currentLang = detectLanguage();
  dict = await loadDictionary(currentLang);
  applyToDom();
  return currentLang;
}

export async function setLanguage(lang) {
  if (!CONFIG.SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem(CONFIG.STORAGE_KEYS.LANG, lang);
  dict = await loadDictionary(lang);
  applyToDom();
}

export function getLanguage() {
  return currentLang;
}

/** Перевод строки интерфейса по ключу, с фолбэком на сам ключ. */
export function t(key) {
  return dict[key] || key;
}

/**
 * Достаёт локализованное поле товара/категории с фолбэком на основной язык.
 * Например getLocalizedField(product, 'name') вернёт name_en для en,
 * либо name, если перевод не заполнен в таблице.
 */
export function getLocalizedField(item, field) {
  if (currentLang !== CONFIG.BASE_DATA_LANG) {
    const localizedValue = item[`${field}_${currentLang}`];
    if (localizedValue) return localizedValue;
  }
  return item[field] || '';
}
