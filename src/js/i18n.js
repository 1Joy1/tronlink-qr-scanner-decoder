// Система интернационализации (i18n) для TRON LINK QR Scanner
const translations = {
  ru: {
    // Основные элементы интерфейса
    title: "Сканер QR-кодов TRON LINK",
    scanButton: "Сканировать",
    stopButton: "Остановить",
    decodeButton: "Декодировать транзакцию",
    
    // QR Scanner
    qrScanner: {
      noLibrary: "⚠️ Не подключена библиотека jsQR!",
      scanningImpossible: "Сканирование невозможно, введите данные вручную:",
      scanningStopped: "⚠️ Сканирование остановлено!",
      qrRecognized: "✅ QR-код распознан!",
      content: "Содержимое:",
      cameraError: "Ошибка"
    },
    
    // Результаты декодирования
    decode: {
      result: "📋 Результат декодирования:",
      type: "Тип",
      typeNotDefined: "Не определён!",
      
      // Поля транзакции
      sender: "Отправитель:",
      recipient: "Получатель:",
      amount: "Сумма:",
      contractAddress: "Адрес контракта:",
      allowTo: "Кому разрешаем:",
      allowFrom: "От кого разрешаем:",
      
      // Временные метки
      created: "Создан:",
      expires: "Истекает:",
      
      // Дополнительная информация
      showHexData: "📄 Показать hex данные",
      showFullData: "📄 Показать полные данные",
      hideButton: "Скрыть",
      showHexButton: "⬇HEX⬇",
      
      // Токены и контракты
      unknownToken: "&lt;неизвестный токен&gt;",
      unknownContract: "Неизвестный контракт",
      unlimited: "&lt;без ограничений&gt;"
    },
    
    // Описания функций смарт-контрактов
    contractFunctions: {
      "transfer(address,uint256)": "Перевод токенов",
      "approve(address,uint256)": "Разрешение адресу распоряжаться токенами",
      "transferFrom(address,address,uint256)": "Позволяет третьей стороне перевести токены от одного адреса к другому, если первый адрес заранее сделал approve.",
      "mint(address,uint256)": "Создать (выпустить) новые токены.",
      "burn(uint256)": "Уничтожить часть токенов, уменьшив общее предложение.",
      "increaseAllowance(address,uint256)": "Увеличить разрешение (allowance) для стороннего адреса (спендера)",
      "transferOwnership(address)": "Передать владение контрактом другому адресу. После вызова этой функции старый владелец теряет привилегии (например, возможность вызывать mint)."
    },
    
    // Ошибки
    errors: {
      notJson: "❌ Строка не является JSON",
      noHexList: "❌ Ошибка: hexList пуст или отсутствует",
      invalidFormat1: "❌ Строка не содержит 0a1541 и не начинается с 0a",
      invalidFormat2: "❌ Строка не начинается с 0a**5a**22",
      decodingError: "❌ Ошибка"
    }
  },
  
  en: {
    // Main interface elements
    title: "TRON LINK QR Scanner",
    scanButton: "Scan",
    stopButton: "Stop",
    decodeButton: "Decode Transaction",
    
    // QR Scanner
    qrScanner: {
      noLibrary: "⚠️ jsQR library not loaded!",
      scanningImpossible: "Scanning is impossible, enter data manually:",
      scanningStopped: "⚠️ Scanning stopped!",
      qrRecognized: "✅ QR code recognized!",
      content: "Content:",
      cameraError: "Error"
    },
    
    // Decoding results
    decode: {
      result: "📋 Decoding Result:",
      type: "Type",
      typeNotDefined: "Not defined!",
      
      // Transaction fields
      sender: "From:",
      recipient: "To:",
      amount: "Amount:",
      contractAddress: "Contract Address:",
      allowTo: "Allow To:",
      allowFrom: "Allow From:",
      
      // Timestamps
      created: "Created:",
      expires: "Expires:",
      
      // Additional information
      showHexData: "📄 Show hex data",
      showFullData: "📄 Show full data",
      hideButton: "⬆Hide⬆",
      showHexButton: "⬇HEX⬇",
      
      // Tokens and contracts
      unknownToken: "&lt;unknown token&gt;",
      unknownContract: "Unknown contract",
      unlimited: "&lt;unlimited&gt;"
    },
    
    // Smart contract function descriptions
    contractFunctions: {
      "transfer(address,uint256)": "Transfer tokens",
      "approve(address,uint256)": "Approve address to spend tokens",
      "transferFrom(address,address,uint256)": "Allows a third party to transfer tokens from one address to another, provided the first address has previously approved it.",
      "mint(address,uint256)": "Create (mint) new tokens.",
      "burn(uint256)": "Burn tokens, reducing the total supply.",
      "increaseAllowance(address,uint256)": "Increase allowance for a third-party address (spender)",
      "transferOwnership(address)": "Transfer contract ownership to another address. After calling this function, the old owner loses privileges (e.g., the ability to call mint)."
    },
    
    // Errors
    errors: {
      notJson: "❌ String is not JSON",
      noHexList: "❌ Error: hexList is empty or missing",
      invalidFormat1: "❌ String doesn't contain 0a1541 and doesn't start with 0a",
      invalidFormat2: "❌ String doesn't start with 0a**5a**22",
      decodingError: "❌ Error"
    }
  }
};

/**
 * Функция перевода
 * @param {string} key - Ключ перевода в формате 'section.subsection.key'
 * @returns {string} - Переведенная строка или ключ, если перевод не найден
 */
function t(key) {
  const keys = key.split('.');
  let value = translations[getCurrentLanguage()];
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  return value !== undefined ? value : key;
}

/**
 * Обновление всех текстов на странице при смене языка
 */
function updatePageLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = t(key);

    element.textContent = translation;
  });
}

/**
 * Получить текущий язык
 * @returns {string} - Код текущего языка
 */
function getCurrentLanguage() {
  return document.documentElement.lang;
}

// Инициализация языка при загрузке страницы
// Текущий язык 'en' | 'ru' берем из document.documentElement.lang
document.addEventListener('DOMContentLoaded', (event) => {
  const langSelect = document.getElementById('lang-select');  
    if (langSelect) {
      // 1. Устанавливаем значение селекта равным атрибуту lang тега <html>
      langSelect.value = document.documentElement.lang;

      // 2. Вручную генерируем событие 'change'
      const event = new Event('change', { bubbles: true });
      langSelect.dispatchEvent(event);
    }
});

document.body.addEventListener('change', (event) => {
  if (event.target.id === 'lang-select') {
    document.documentElement.lang = event.target.value;
    // Обновляем интерфейс
    updatePageLanguage();
  }
});

