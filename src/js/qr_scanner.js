// QR-сканер для TRON LINK
(function () {
  if (!window.jsQR || typeof window.jsQR !== 'function') {
    // Удаляем camera-container и кнопки управления
    document.getElementById('camera-container')?.remove();
    const buttonContainer = document.getElementById('startButton')?.closest('.button-container');
    if (buttonContainer) buttonContainer.remove();

    const resultFromQR = document.getElementById('resultFromQR');
    if (!resultFromQR) return;

    resultFromQR.innerHTML = `
      <h3>⚠️ Не подключена библиотека jsQR!</h3>
      <p><strong>Сканирование невозможно, введите данные вручную:</strong></p>
      <textarea id="input"></textarea>
      <div style="margin-top:10px;">
        <button id="decodeBtn" class="btn-decode">Декодировать транзакцию</button>
      </div>
      <div id="result_decode"></div>
    `;

    return;
  }

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const canvasContext = canvas.getContext('2d');
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const resultFromQrDiv = document.getElementById('resultFromQR');
  const cameraContainer = document.getElementById('camera-container');

  let stream = null;
  let scanning = false;
  let lastScannedResult = null;

  // Обработчики событий
  startButton?.addEventListener('click', startCamera);
  stopButton?.addEventListener('click', stopCamera);

  // Запуск камеры
  async function startCamera() {
    resultFromQrDiv.innerHTML = '';

    try {
      // Показываем camera-container
      cameraContainer.classList.remove('camera-hidden');
      canvas.style.display = 'none';

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      video.srcObject = stream;
      startButton.disabled = true;
      stopButton.disabled = false;
      scanning = true;
      lastScannedResult = null;

      // Запускаем сканирование
      scanQRCode();
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      resultFromQrDiv.innerHTML = `<p style="color: red;">Ошибка: ${error.message}</p>`;
    }
  }

  // Остановка камеры
  function stopCamera(event) {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    scanning = false;
    startButton.disabled = false;
    stopButton.disabled = true;

    // Скрываем camera-container
    cameraContainer.classList.add('camera-hidden');

    if (event?.type === 'click' && event.target.id === 'stopButton') {
      resultFromQrDiv.innerHTML = `
        <h3>⚠️ Сканирование остановлено!</h3>
        <p><strong>Содержимое:</strong></p>
        <textarea id="input"></textarea>
        <div style="margin-top:10px;">
          <button id="decodeBtn" class="btn-decode">Декодировать транзакцию</button>
        </div>
        <div id="result_decode"></div>
      `;
    }
  }

  // Функция сканирования QR-кода
  function scanQRCode() {
    if (!scanning) return;

    // Устанавливаем размер canvas равным размеру видео
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Рисуем текущий кадр на canvas
      canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Получаем данные изображения
      const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);

      // Распознаем QR-код
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      // QR-код найден
      if (code) {
        // Можно добавить визуальное выделение QR-кода
        drawQRCodeLocation(code.location);
        canvas.style.display = 'block';

        lastScannedResult = code.data;

        resultFromQrDiv.innerHTML = `
          <h3>✅ QR-код распознан!</h3>
          <p><strong>Содержимое:</strong></p>
          <textarea id="input">${lastScannedResult}</textarea>
          <div style="margin-top:10px;">
            <button id="decodeBtn" class="btn-decode">Декодировать транзакцию</button>
          </div>
          <div id="result_decode"></div>
        `;

        stopCamera();
      }
    }

    // Продолжаем сканирование
    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  }

  // Визуальное выделение QR-кода
  function drawQRCodeLocation(location) {
    canvasContext.strokeStyle = '#00ff00';
    canvasContext.lineWidth = 12;
    canvasContext.strokeRect(
      location.topLeftCorner.x,
      location.topLeftCorner.y,
      location.bottomRightCorner.x - location.topLeftCorner.x,
      location.bottomRightCorner.y - location.topLeftCorner.y
    );
  }
})();

