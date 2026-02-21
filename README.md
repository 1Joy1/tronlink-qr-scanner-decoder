# TRONLINK QR Scanner / Decoder

[English](#description) | [Русский](#описание)

---

## Description

This is a small offline tool that allows you to see what data is encoded in a **TronLink** wallet QR code when using a *hot* and *cold* wallet setup.
The tool partially addresses the “blind signing” problem of QR-code-based transactions by allowing the transaction contents to be analyzed **before signing**.
The solution is *partial* by design, because transactions created by TronLink have a lifetime of only **60 seconds**. Within this time, the following steps must be completed:

1. scan the QR code using this tool;
2. analyze the transaction contents;
3. scan the QR code again with the cold wallet for signing;
4. sign the transaction;
5. scan the signed transaction with the hot wallet and broadcast it to the network.

In practice, it is impossible to fit into this time frame. Nevertheless, even in this form, the tool is better than having no way at all to see what is actually encoded in the QR code.
In the future, if users actively reach out to the wallet developers, a setting to increase the transaction lifetime (`expiration`) may be added. This would provide more time for analysis and make the process safer.

What we can do at the moment:
- scanning **TronLink** QR codes using a computer or smartphone camera;
- decoding transactions (including `TransferContract`, `TriggerSmartContract`, `ColdWalletOwnerVerifyContract`);
- in the case of `TriggerSmartContract`, determining the invoked method (`transfer`, `approve`, `transferFrom`, etc.);
- displaying human-readable transaction information (addresses, tokens, amounts, etc.);
- **TRX** and **USDT** tokens have been verified; for other tokens, inaccuracies in determining token decimals may occur.

> #### ⚠️ **Important**
> The project **not a production-ready solution**.  
> Only the functionality required by the author has been implemented.  
> Anyone can use this project as a base and extend it to suit their own needs.
---

## 🛠 Project Status

The project is currently under development.

### Project Structure
```text
tronlink-qr-scanner-decoder/
  src/
    index.html          # working HTML (split into modules)
    css/
      index.css
    js/
      i18n.js              # internationalization system
      jsQR.js              # a pure javascript QR code reading library. https://github.com/cozmo/jsQR/blob/master/dist/jsQR.js
      tron_tokens_data.js  # contracts & tokens info (add if desired)
      qr_scanner.js        # QR scanner control
      tron_decoder.js      # decoder
  dist/
    scandecodeTRON.html   # built single-file version
  build/
    build-inline.js     # build script (inline CSS/JS into HTML)
  package.json
  README.md
```

### Development Mode

1. Edit source files in `src/`:
   - HTML — `src/index.html`
   - CSS — `src/css/index.css`
   - JavaScript — files in `src/js/`

2. For local testing, simply open `src/index.html` in a browser.

3. To change the default language, set the lang attribute in the html tag within `src/index.html` to either 'en' or 'ru'.

4. You can add SVG logos for additional tokens to the TOKENS_LIST_LOGO constant in the `src/js/tron_tokens_data.js` file.

### Building Single File

Node.js is required for building.
```bash
cd tronlink-qr-scanner-decoder
npm install      # if dependencies need to be installed in the future (not required now)
npm run build
```

After that, the file will be created:
```text
dist/scandecodeTRON.html
```

It will have embedded:
- CSS from `src/css/index.css`
- JS from all `src/js/*.js`

This file can be used as an offline tool (single HTML without external dependencies).


***
***
***

## Описание

Это небольшой оффлайн-инструмент, который позволяет посмотреть, какие данные зашифрованы в QR-коде кошелька **TronLink** при использовании связки *горячего* и *холодного* кошелька.
Инструмент частично решает проблему «слепой подписи» транзакций через QR-код, позволяя проанализировать содержимое транзакции **до её подписания**.
Решение является именно *частичным*, так как транзакции, создаваемые TronLink, имеют срок жизни всего **60 секунд**. За это время необходимо:

1. отсканировать QR-код этим инструментом;
2. проанализировать содержимое транзакции;
3. повторно отсканировать QR-код холодным кошельком для подписи;
4. подписать транзакцию;
5. отсканировать подписанную транзакцию горячим кошельком и отправить её в сеть.

На практике уложиться в этот тайминг невозможно. Тем не менее, даже в таком виде инструмент лучше, чем полное отсутствие возможности увидеть, что именно закодировано в QR-коде.
Возможно, в будущем, если пользователи будут активнее обращаться к разработчикам кошелька, появится настройка для увеличения времени жизни (`expiration`) транзакции. Это дало бы больше времени на анализ и сделало процесс безопаснее.

Что мы умеем на данный момент:
- сканирование QR-кодов **TronLink** с помощью камеры компьютера или телефона;
- декодирование транзакций (включая `TransferContract`, `TriggerSmartContract`, `ColdWalletOwnerVerifyContract`);
- в случае `TriggerSmartContract` определение вызываемого метода (`transfer`, `approve`, `transferFrom` и др.);
- отображение человекочитаемой информации о транзакции (адреса, токены, суммы и т. д.);
- проверены токены **TRX** и **USDT**; для других токенов возможны неточности при определении разрядности номинала.

> #### ⚠️ **Важно**
> Проект **не является законченным production-решением**.  
> Реализован только тот функционал, который был необходим автору.  
> Любой желающий может использовать этот проект как основу и доработать его под свои задачи.
---

## 🛠 Статус проекта

Проект находится в стадии разработки.

### Структура проекта
```text
tronlink-qr-scanner-decoder/
  src/
    index.html          # рабочий HTML (разбитый на модули)
    css/
      index.css
    js/
      i18n.js              # система интернационализации
      jsQR.js              # библиотека чтения QR-кода на чистом JavaScript. https://github.com/cozmo/jsQR/blob/master/dist/jsQR.js
      tron_tokens_data.js  # информация о контрактах и токенах (дополните если требуется)
      qr_scanner.js        # управление QR-сканером
      tron_decoder.js      # декодер
  dist/
    scandecodeTRON.html   # собранный однофайловый вариант
  build/
    build-inline.js     # скрипт сборки (inline CSS/JS в HTML)
  package.json
  README.md
```

### Режим разработки

1. Редактируете исходники в `src/`:
   - HTML — `src/index.html`
   - CSS — `src/css/index.css`
   - JavaScript — файлы в `src/js/`

2. Для локального теста можно просто открыть `src/index.html` в браузере.

3. Для того чтобы изменить язык по умолчанию, установите в `src/index.html` в теге html атрибут lang в значение 'en' или 'ru'.

4. В файл `src/js/tron_tokens_data.js` в константу TOKENS_LIST_LOGO можно добавить SVG логотипы дополнительных токенов.

### Сборка в один файл

Для сборки нужен Node.js.
```bash
cd tronlink-qr-scanner-decoder
npm install      # если понадобится поставить зависимости в будущем (сейчас не обязательно)
npm run build
```

После этого появится файл:
```text
dist/scandecodeTRON.html
```

В нём уже встроены:
- CSS из `src/css/index.css`
- JS из всех `src/js/*.js`

Этот файл можно использовать как оффлайн-инструмент (один HTML без внешних зависимостей).