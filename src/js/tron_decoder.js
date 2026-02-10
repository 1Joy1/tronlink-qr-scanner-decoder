// --- Вспомогательные функции ---
// Varint из hex
function readVarintFromHex(hex, pos) {
  let result = 0n, shift = 0n, cur = pos;
  while (true) {
    const byte = BigInt(parseInt(hex.substr(cur, 2), 16));
    cur += 2;
    result |= (byte & 0x7fn) << shift;
    if ((byte & 0x80n) === 0n) break;
    shift += 7n;
  }
  return { value: result, newPos: cur };
}

// Length-delimited поле из hex
function readLengthDelimited(hex, pos) {
  const lenInfo = readVarintFromHex(hex, pos);
  const len = Number(lenInfo.value);
  const start = lenInfo.newPos;
  const dataHex = hex.substr(start, len * 2);
  return { dataHex, newPos: start + len * 2 };
}

// Читает tag (на самом деле tag — varint: (field<<3)|wire_type)
function readTagFromHex(hex, pos) {
  const t = readVarintFromHex(hex, pos);
  const tag = t.value; // BigInt
  const wireType = Number(tag & 0x7n);
  const fieldNum = Number(tag >> 3n);
  return { fieldNum, wireType, newPos: t.newPos };
}
// Переводит ansii в Hex
function asciiToHex(str) {
  let h = "";
  for (let i = 0; i < str.length; i++) h += str.charCodeAt(i).toString(16).padStart(2, "0");
  return h;
}

function addressFromHex(hex) {
  // Удаляем возможный префикс 0x
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length !== 42) throw new Error("Invalid address length");
  if (!hex.startsWith("41")) throw new Error("Invalid TRON address prefix");

  const addressBytes = hexToBytes(hex);

  // SHA256 дважды
  const hash0 = sha256Sync(addressBytes);
  const hash1 = sha256Sync(hash0);

  // Первые 4 байта — checksum
  const checksum = hash1.slice(0, 4);

  // Адрес + контрольная сумма
  const addressWithChecksum = new Uint8Array([...addressBytes, ...checksum]);

  // Кодируем в base58
  return base58Encode(addressWithChecksum);
}

// Перевод hex → байты
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Простой base58 encode (алфавит как в TRON)
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58Encode(buffer) {
  let num = BigInt("0x" + [...buffer].map(b => b.toString(16).padStart(2, "0")).join(""));
  let encoded = "";
  while (num > 0n) {
    const mod = Number(num % 58n);
    encoded = ALPHABET[mod] + encoded;
    num /= 58n;
  }
  for (const b of buffer) {
    if (b === 0) encoded = "1" + encoded;
    else break;
  }
  return encoded;
}

// === Синхронный SHA256 без зависимостей ===
function sha256Sync(bytes) {
  // Простая реализация SHA256 (сокращённая, но корректная)
  const K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ]);

  const msg = new Uint8Array(bytes);
  const bitLen = msg.length * 8;
  const withOne = new Uint8Array([...msg, 0x80]);
  const padLen = (56 - (withOne.length % 64) + 64) % 64;
  const withZeros = new Uint8Array([...withOne, ...new Uint8Array(padLen)]);
  const lenBytes = new Uint8Array(8);
  new DataView(lenBytes.buffer).setUint32(4, bitLen);
  const data = new Uint8Array([...withZeros, ...lenBytes]);

  const H = new Uint32Array([
    0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,
    0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19
  ]);

  const w = new Uint32Array(64);
  for (let i = 0; i < data.length; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = new DataView(data.buffer, i + j*4, 4).getUint32(0);
    for (let j = 16; j < 64; j++) {
      const s0 = (rotr(w[j-15],7) ^ rotr(w[j-15],18) ^ (w[j-15]>>>3)) >>> 0;
      const s1 = (rotr(w[j-2],17) ^ rotr(w[j-2],19) ^ (w[j-2]>>>10)) >>> 0;
      w[j] = (w[j-16] + s0 + w[j-7] + s1) >>> 0;
    }
    let [a,b,c,d,e,f,g,h] = H;
    for (let j = 0; j < 64; j++) {
      const S1 = (rotr(e,6) ^ rotr(e,11) ^ rotr(e,25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + K[j] + w[j]) >>> 0;
      const S0 = (rotr(a,2) ^ rotr(a,13) ^ rotr(a,22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }
    H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;
    H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
  }

  const result = new Uint8Array(32);
  const dv = new DataView(result.buffer);
  for (let i = 0; i < 8; i++) dv.setUint32(i*4, H[i]);
  return result;
}

function rotr(n, b) {
  return (n >>> b) | (n << (32 - b));
}

// утилита: hex → utf8
function hexToUtf8(hex) {
  hex = hex.replace(/\s+/g, '').replace(/^0x/, '');

  if (hex.length % 2 !== 0) {
      throw new Error("Invalid hex string length");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }

  return new TextDecoder('utf-8').decode(bytes);
}

function decodeSmartContractData(dataHex) {
  if (!dataHex || dataHex.length < 8) return null;

  dataHex = dataHex.startsWith("0x") ? dataHex.slice(2) : dataHex;
  const methodID = dataHex.substr(0, 8);
  const out = { methodID };

  // Популярные сигнатуры функций
  const signatures = {
    "a9059cbb": "transfer(address,uint256)",
    "095ea7b3": "approve(address,uint256)",
    "23b872dd": "transferFrom(address,address,uint256)",
    "40c10f19": "mint(address,uint256)",
    "42966c68": "burn(uint256)",
    "39509351": "increaseAllowance(address,uint256)",
    "79cc6790": "transferOwnership(address)"
  };
  const descriptions = {
    "a9059cbb": "Перевод токенов",
    "095ea7b3": "Разрешение адресу распоряжаться токенами",
    "23b872dd": "Позволяет третьей стороне перевести токены от одного адреса к другому, если первый адрес заранее сделал approve.",
    "40c10f19": "Создать (выпустить) новые токены.",
    "42966c68": "Уничтожить часть токенов, уменьшив общее предложение.",
    "39509351": "Увеличить разрешение (allowance) для стороннего адреса (спендера)",
    "79cc6790": "Передать владение контрактом другому адресу. После вызова этой функции старый владелец теряет привилегии (например, возможность вызывать mint)."
  };

  const func = signatures[methodID] || "unknown_function";
  const description = descriptions[methodID] || "unknown_function";
  out.function = func;
  out.description = description;

  // Аргументы идут после первых 8 символов (4 байта)
  const argsHex = dataHex.substr(8);
  const args = argsHex.match(/.{1,64}/g) || [];

  function parseAddress(argHex) {
    // В Ethereum — "0x" + последние 40 символов
    // В Tron — "41" + последние 40 символов
    return "41" + argHex.slice(-40);
  }

  function parseUint(argHex) {
    return BigInt("0x" + argHex).toString(10);
  }

  // Это максимальное возможное значение uint256 — часто используется как "бесконечное одобрение" (infinite allowance).
  // 115792089237316195423570985008687907853269984665640564039457584007913129639935
  // ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff

  // Разбираем аргументы в зависимости от сигнатуры
  switch (func) {
    case "transfer(address,uint256)": {
      // Передаёт токены от текущего владельца (кто вызывает транзакцию) другому адресу.
      // to_address — адрес получателя.
      // uint256 amount — количество токенов (в минимальных единицах, например 1 USDT = 1 000 000 единиц).
      const to_address_hex = "41" + args[0].slice(-40);;
      const amount = BigInt("0x" + args[1]).toString(10);
      out.to_address_hex = to_address_hex;
      out.to_address = addressFromHex(to_address_hex);
      out.amount = amount;
      break;
    }

    case "approve(address,uint256)": {
      // Позволяет владельцу токенов разрешить другому адресу (например, смарт-контракту) тратить их токены.
      // spender — кому разрешено тратить.
      // uint256 amount — лимит на использование токенов (в минимальных единицах, например 1 USDT = 1 000 000 единиц).
      const spender = "41" + args[0].slice(-40);;
      const amount = BigInt("0x" + args[1]).toString(10);
      out.spender_address_hex = spender;
      out.spender_address = addressFromHex(spender);
      out.amount = amount;
      break;
    }

    case "transferFrom(address,address,uint256)": {
      // Позволяет третьей стороне перевести токены от одного адреса к другому, если первый адрес заранее сделал approve.
      // Используется биржами и DeFi-протоколами для выполнения транзакций от имени пользователя.
      // address from — чей баланс списывается.
      // address to — кому отправляются токены.
      // uint256 amount — сколько отправить.
      const from = "41" + args[0].slice(-40);;
      const to = "41" + args[1].slice(-40);;
      const amount = BigInt("0x" + args[2]).toString(10);
      out.from_address_hex = from;
      out.from_address = addressFromHex(from);
      out.to_address_hex = to;
      out.to_address = addressFromHex(to);;
      out.amount = amount;
      break;
    }

    case "mint(address,uint256)": {
      // Назначение: создать (выпустить) новые токены.
      // address to — адрес получателя (кому начисляются новые токены).
      // uint256 amount — количество токенов для выпуска.
      const to = "41" + args[0].slice(-40);;
      const amount = BigInt("0x" + args[1]).toString(10);
      out.to_address_hex = to;
      out.amount = amount;
      break;
    }

    case "burn(uint256)": {
      // Назначение: уничтожить часть токенов, уменьшив общее предложение.
      // uint256 amount — количество токенов для сжигания.
      // Баланс отправителя уменьшается на указанную сумму, а totalSupply — тоже.
      out.amount = BigInt("0x" + args[0]).toString(10);
      break;
    }

    case "increaseAllowance(address,uint256)": {
      // Назначение: увеличить разрешение (allowance) для стороннего адреса (спендера).
      // address spender — кто сможет тратить токены.
      // uint256 addedValue — на сколько увеличить лимит.
      // Используется вместе с approve, чтобы постепенно увеличивать лимит без его обнуления.
      const spender = "41" + args[0].slice(-40);;
      const addedValue = BigInt("0x" + args[1]).toString(10);
      out.spender_address_hex = spender;
      out.spender_address = addressFromHex(spender);
      out.added_value = addedValue;
      break;
    }

    case "transferOwnership(address)": {
      // Назначение: передать владение контрактом другому адресу.
      // address newOwner — новый владелец.
      // После вызова этой функции старый владелец теряет привилегии (например, возможность вызывать mint).
      const newOwner = "41" + args[0].slice(-40);;
      out.new_owner_hex = newOwner;
      out.new_owner = addressFromHex(newOwner);
      break;
    }

    default:
      out.raw_args = argsHex;
  }

  return out;
}

function getContractValueFromHex(valueHex, type_url) {
  const debug = true;
  if(debug) console.log('decode valueHex', valueHex);
  // Разбор полей TriggerSmartContract
  let p = 0;
  let type = type_url.replace('type.googleapis.com/protocol.', '');

  const out = { type: type };

  while (p < valueHex.length) {

    const tagInfo = readTagFromHex(valueHex, p);
    p = tagInfo.newPos;
    // if(debug) console.log('tagInfo',tagInfo);
    const { fieldNum, wireType } = tagInfo;

    let fieldVal, _uFieldPostfix, _uFieldVal;

    if (wireType === 2) { // length-delimited
      const { dataHex, newPos } = readLengthDelimited(valueHex, p);
      fieldVal = dataHex;
      p = newPos;
      _uFieldPostfix = "_hex";
      _uFieldVal = fieldVal;
    } else if (wireType === 0) { // varint
      const { value, newPos } = readVarintFromHex(valueHex, p);
      fieldVal = value;
      p = newPos;
      _uFieldPostfix = "_varint";
      _uFieldVal = fieldVal.toString();
    } else if (wireType === 1) { // 64-bit
      fieldVal = valueHex.substr(p, 16);
      p += 16;
      _uFieldPostfix = "_fixed64_hex";
      _uFieldVal = fieldVal;
    } else if (wireType === 5) { // 32-bit
      fieldVal = valueHex.substr(p, 8);
      p += 8;
      _uFieldPostfix = "_fixed64_hex";
      _uFieldVal = fieldVal;
    } else {
      throw new Error("Unsupported wireType " + wireType + " at field " + fieldNum);
    }

    if(type === 'TransferContract') {
      switch (fieldNum) {
        case 1: //field 1: wraper (tag 0a)
          out.owner_address_hex = fieldVal;
          try { out.owner_address = addressFromHex(fieldVal); }
          catch(e){ out.owner_address = null; }
          break;
        case 2: //field 2: wraper (tag 12)
          out.to_address_hex = fieldVal;
          try { out.to_address = addressFromHex(fieldVal); }
          catch(e){ out.to_address = null; }
          break;
        case 3: //field 3: wraper (tag 18)
          out.amount = Number(fieldVal);
          break;
      }
    }
    else if(type === 'TriggerSmartContract') {
      switch (fieldNum) {
        case 1: //field 1: wraper (tag 0a)
          out.owner_address_hex = fieldVal;
          try { out.owner_address = addressFromHex(fieldVal); }
          catch(e){ out.owner_address = null; }
          break;
        case 2: //field 2: wraper (tag 12)
          out.contract_address_hex = fieldVal;
          try { out.contract_address = addressFromHex(fieldVal); }
          catch(e){ out.contract_address = null; }
          break;
        case 3: //field 3: wraper (tag 18)
          out.call_value = fieldVal.toString();
          break;
        case 4: //field 4: wraper (tag 22)
          out.data_hex = fieldVal;
          out.data_parsed = decodeSmartContractData(fieldVal);
          // out.data_parsed2 = decodeContractData(fieldVal);
          break;
        case 5: //field 5: wraper (tag 28)
          out.call_token_value = fieldVal.toString();
          break;
        case 6: //field 6: wraper (tag 30)
          out.token_id = fieldVal.toString();
          break;
      }
    }
    // else throw new Error("Неизвестный тип контракта");
    else {
      out["field_" + fieldNum + _uFieldPostfix] = _uFieldVal;
    }
  }

  return out;
}


function getContractTypeFromHex(hex) {
  const debug = true;
  const contract_type = {};
  let type_url = '';
  let pos = hex.indexOf('0a');

  // field 1: type_url (tag 0a) /** @type {!Uint8Array} */
  if (hex.substr(pos, 2) === '0a') {
    const { dataHex, newPos } = readLengthDelimited(hex, pos + 2);
    if(debug) console.log('getContractTypeFromHex dataHex',dataHex, 'newPos', newPos);
    type_url = hexToUtf8(dataHex);
    contract_type.type_url = type_url;
    pos = newPos;
  }

  // field 2: type_url (tag 12) /** @type {!Uint8Array} */
  if (hex.substr(pos, 2) === '12') {
    const { dataHex, newPos } = readLengthDelimited(hex, pos + 2);
    if(debug) console.log('getContractTypeFromHex dataHex',dataHex, 'newPos', newPos);
    contract_type.value = getContractValueFromHex(dataHex, type_url);
    pos = newPos;
  }
  return contract_type
}



function getMessageFromHex(rawHex) {
  // -----
    // Поле  Название         Tag(hex)   WireType  Тип данных        Комментарий
    //   1   ref_block_bytes  0a           2        bytes (2 байта)   короткий ref блока
    //   3   ref_block_num    18           0        varint            номер блока
    //   4   ref_block_hash   22           2        bytes (8 байт)    hash блока
    //   8   expiration       40           0        varint            время истечения
    //   9   auths            4a           2        message[]         подписи
    //   10  data             52           2        bytes             необязательные данные
    //   11  contract         5a           2        message[]         список контрактов
    //   12  scripts          62           2        bytes             internal scripts
    //   14  timestamp        70           0        varint            метка времени
    //   18  fee_limit        90           0        varint            лимит комиссии
  // ----
  const debug = true;
  const message = {};
  let pos = 0;
  // --- Возможная внешняя обёртка (Any / outer message) ---
  // field 1: wraper (tag 0a)
  if (rawHex.substr(pos, 2) === '0a') {
    const { dataHex, newPos } = readLengthDelimited(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex dataHex',dataHex, 'newPos', newPos);
    if(newPos === rawHex.length) rawHex = dataHex;
  }

  // field 1: ref_block_bytes (tag 0a) /** @type {!Uint8Array} */
  if (rawHex.substr(pos, 2) === '0a') {
    const { dataHex, newPos } = readLengthDelimited(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex dataHex',dataHex, 'newPos', newPos);
    message.ref_block_bytes = dataHex.toUpperCase();
    pos = newPos;
  }

  // field 3: ref_block_num (tag 18) /** @type {number} */
  if (rawHex.substr(pos, 2) === '18') {
    const { value, newPos } = readVarintFromHex(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex value',value, 'newPos', newPos);
    message.ref_block_num = Number(value);
    pos = newPos;
  }

  // field 4: ref_block_hash (tag 22) /** @type {!Uint8Array} */
  if (rawHex.substr(pos, 2) === '22') {
    const { dataHex, newPos } = readLengthDelimited(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex dataHex',dataHex, 'newPos', newPos);
    message.ref_block_hash = dataHex.toUpperCase();
    pos = newPos;
  }

  // field 8: expiration (tag 40) /** @type {number} */
  if (rawHex.substr(pos, 2) === '40') {
    const { value, newPos } = readVarintFromHex(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex value',value, 'newPos', newPos);
    message.expiration = Number(value);
    message.expiration_date = new Date(Number(value)).toLocaleString('ru-RU');
    pos = newPos;
  }

  // field 9: auths (tag 4a) /** @type {!Uint8Array} */
  // обычно отсутствует, но по протоколу wireType = 2 (length-delimited)
  if (rawHex.substr(pos, 2) === '4a') {
    const { dataHex, newPos } = readLengthDelimited(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex dataHex',dataHex, 'newPos', newPos);
    message.auths = dataHex.toUpperCase();
    pos = newPos;
  }

  // field 10: data (tag 52) /** @type {!Uint8Array} */
  if (rawHex.substr(pos, 2) === '52') {
    const { dataHex, newPos } = readLengthDelimited(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex dataHex',dataHex, 'newPos', newPos);
    message.data = dataHex.toUpperCase();
    pos = newPos;
  }

  // field 11: contract (tag 5a)
  if (rawHex.substr(pos, 2) === '5a') {
    const { dataHex, newPos } = readLengthDelimited(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex dataHex',dataHex, 'newPos', newPos);
    message.contract_hex = dataHex;
    message.contract = getContractTypeFromHex(dataHex);
    pos = newPos;
  }

  // field 12: data (tag 62) /** @type {!Uint8Array} */
  if (rawHex.substr(pos, 2) === '62') {
    const { dataHex, newPos } = readLengthDelimited(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex dataHex',dataHex, 'newPos', newPos);
    message.scripts = dataHex.toUpperCase();
    pos = newPos;
  }

  // field 14: timestamp (tag 70) /** @type {number} */
  if (rawHex.substr(pos, 2) === '70') {
    const { value, newPos } = readVarintFromHex(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex value',value, 'newPos', newPos);
    message.timestamp = Number(value);
    message.timestamp_date = new Date(Number(value)).toLocaleString('ru-RU');
    pos = newPos;
  }

  // field 18: fee_limit (tag 90) /** @type {number} */
  if (rawHex.substr(pos, 2) === '90') {
    const { value, newPos } = readVarintFromHex(rawHex, pos + 2);
    if(debug) console.log('getMessageFromHex value',value, 'newPos', newPos);
    message.fee_limit = Number(value);
    pos = newPos;
  }

  if(debug) console.log('getMessageFromHex message',message);
  return message;
}

function getVerifiMessageFromHex(hex, depth = 0) {
  let pos = 0;
  const result = {};

  while (pos < hex.length) {
    const tagByte = parseInt(hex.substr(pos, 2), 16);
    pos += 2;

    const field = tagByte >> 3;
    const wireType = tagByte & 0x07;

    if (wireType === 2) {
      const { dataHex, newPos } = readLengthDelimited(hex, pos);
      pos = newPos;

      // пробуем ASCII
      const ascii = hexToAsciiSafe(dataHex);
      if (ascii) {
        result[field] = ascii;
      } else if (depth < 5) {
        // пробуем как вложенный protobuf
        result[field] = getVerifiMessageFromHex(dataHex, depth + 1);
      } else {
        result[field] = dataHex;
      }
    } else {
      const { value, newPos } = readVarintFromHex(hex, pos);
      pos = newPos;
      result[field] = value;
    }
  }

  return result;
}

function hexToAsciiSafe(hex) {
  if (!hex || hex.length % 2 !== 0) return null;

  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substr(i, 2), 16);
    if (Number.isNaN(byte)) return null;

    // разрешаем только printable ASCII
    // 0x20–0x7E + \n \r \t
    if (
      byte === 0x09 || // \t
      byte === 0x0a || // \n
      byte === 0x0d || // \r
      (byte >= 0x20 && byte <= 0x7e)
    ) {
      result += String.fromCharCode(byte);
    } else {
      return null;
    }
  }

  // защита от мусора вроде "AAAAAAA"
  if (result.length < 3) return null;

  return result;
}



document.body.addEventListener('click', (event) => {
  if (event.target.id !== 'decodeBtn') return;
  const outDiv = document.getElementById('result_decode');
  outDiv.innerHTML = '';


  let textContent = '';
  let rawHex = '';
  let qrType = 1;

  let input_val = document.getElementById('input').value;
  try {
    const qrData = JSON.parse(input_val);
    rawHex = qrData.hexList?.[0];
    qrType = qrData.type;
  } catch(e) {
    if(textContent) textContent += '<br>';
    textContent += '❌ Cтрока не является JSON';
    if (input_val.startsWith('0a') && input_val.includes('0a1541')) {
      rawHex = input_val.trim();
    }
    else {
      if(textContent) textContent += '<br>';
      textContent += '❌ Cтрока не содержит 0a1541 и не начинается с 0a';
    }
  }

  if (!rawHex) {
    if(textContent) textContent += '<br>';
    textContent += '❌ Ошибка: hexList пуст или отсутствует';
    outDiv.innerHTML = textContent;
    return;
  }

  // console.log('rawHex',rawHex);
  try {
    let message = {};
    switch (qrType) {
      case 1:
        message = getMessageFromHex(rawHex);
        break;

      case 99:
        message = getVerifiMessageFromHex(rawHex);
        break;

      default:
        throw new Error(`Unsupported QR type: ${qrType}`);
    }

    const decoded_str = JSON.stringify(message, null, 2);

    const card = document.createElement('div');
    card.className = 'card';

    const card_header = document.createElement('h2');
    card_header.textContent = '📋 Результат декодирования:';
    outDiv.appendChild(card_header);

    const type = message.contract?.value?.type || '';
    const owner_address_hex = message.contract?.value?.owner_address_hex || '';
    const owner_address = message.contract?.value?.owner_address || '';
    const contract_address_hex = message.contract?.value?.contract_address_hex || '';
    const contract_address = message.contract?.value?.contract_address || '';
    const to_address_hex = (type === 'TransferContract' ? (message.contract?.value?.to_address_hex || '') : (message.contract?.value?.data_parsed?.to_address_hex || ''));
    const to_address = (type === 'TransferContract' ? (message.contract?.value?.to_address || '') : (message.contract?.value?.data_parsed?.to_address || ''));
    const token_name = (type === 'TransferContract' ? 'TRX' : TOKENS_BY_ADDRESS[contract_address]?.abbr || '<span class="text-danger"><неизвестный токен></span>');
    const token_logo = (type === 'TransferContract' ? TOKENS_LIST_LOGO['TRX']  : (TOKENS_BY_ADDRESS[contract_address]?.abbr ? TOKENS_LIST_LOGO[TOKENS_BY_ADDRESS[contract_address].abbr] || '' : ''));
    const amount = (type === 'TransferContract' ? (message.contract?.value?.amount || '') : (message.contract?.value?.data_parsed?.amount || ''));


    const from_address_hex = message.contract?.value?.data_parsed?.from_address_hex || '';
    const from_address = message.contract?.value?.data_parsed?.from_address || '';
    const spender_address_hex = message.contract?.value?.data_parsed?.spender_address_hex || '';
    const spender_address = message.contract?.value?.data_parsed?.spender_address || '';
    const added_value = message.contract?.value?.data_parsed?.added_value || '';
    const new_owner_hex = message.contract?.value?.data_parsed?.new_owner_hex || '';
    const new_owner = message.contract?.value?.data_parsed?.new_owner || '';
    const contract_function = message.contract?.value?.data_parsed?.function || '';
    const contract_function_description = message.contract?.value?.data_parsed?.description || '';
    const contract_name = TOKENS_BY_ADDRESS[contract_address]?.name || '';




    let innerHTML = '';
    innerHTML += `<div class="field-wrap field-wrap-contract-type">`;
      innerHTML += `<h3 class="contract-type">Тип: ${type || 'Не определён!'}</h3>`;

      if(contract_function) innerHTML += `<div class="contract-description text-bold ">${contract_name ? contract_name+':' : '<span class="text-danger">Неизвестный контракт:</span>'} <span class="text-blue">${contract_function}</span></div>`;
      if(contract_function_description) innerHTML += `<div class="contract-description "><i>${contract_function_description}</i></div>`;

      // if(contract_address) innerHTML += `
      //   <div class="field-wrap contract-description text-darkred">
      //     <span class="label">Адрес контракта:</span>
      //     <div class="address-group">
      //       <span class="address">${contract_address}</span>
      //       <span class="btn-toggle" onclick="toggleCode(this)">HEX</span>
      //     </div>
      //     <pre class="code-block word-break" style="display:none;">${contract_address_hex}</pre>
      //   </div>`;
      if(contract_address) innerHTML += `
        <div class="field-wrap_grid field-wrap-js contract-description text-darkred">
          <span class="label">Адрес контракта:</span>
          <span class="address">${contract_address}</span>
          <span class="btn-toggle" onclick="toggleCode(this)">⬇HEX⬇</span>
          <pre class="code-block word-break" style="display:none;">${contract_address_hex}</pre>
        </div>
      `;

    innerHTML += `</div>`;


    innerHTML += `
      <div class="field-wrap_grid field-wrap-js">
        <span class="label">Отправитель:</span>
        <span class="address">${owner_address || ''}</span>
        <span class="btn-toggle" onclick="toggleCode(this)">⬇HEX⬇</span>
        <pre class="code-block word-break" style="display:none;">${owner_address_hex || ''}</pre>
      </div>
    `;

    if(from_address) innerHTML += `
      <div class="field-wrap_grid field-wrap-js">
        <span class="label">От кого разрешаем:</span>
        <span class="address">${from_address}</span>
        <span class="btn-toggle" onclick="toggleCode(this)">⬇HEX⬇</span>
      <pre class="code-block word-break" style="display:none;">${from_address_hex}</pre>
      </div>
    `;

    let label = 'Получатель';
    if(spender_address) label = 'Кому разрешаем';
    innerHTML += `
      <div class="field-wrap_grid field-wrap-js">
        <span class="label">${label}:</span>
        <span class="address">${to_address || spender_address ||  ''}</span>
        <span class="btn-toggle" onclick="toggleCode(this)">⬇HEX⬇</span>
      <pre class="code-block word-break" style="display:none;">${to_address_hex || spender_address_hex || ''}</pre>
      </div>
    `;

    let amountStr = '???';
    if(amount) {
      if(amount >= 115792089237316195423570985008687907853269984665640564039457584007913129639935) amountStr = '<span class="text-danger"><без ограничений></span>';
      else amountStr = amount / 1000000;
    }
    else if(added_value) {
      if(added_value >= 115792089237316195423570985008687907853269984665640564039457584007913129639935) amountStr = '<span class="text-danger"><без ограничений></span>';
      else amountStr = added_value / 1000000;
    }
    innerHTML += `
      <div class="field-wrap d-flex"><strong>Сумма: ${amountStr} ${token_name}</strong>${token_logo ? '<span class="token_logo">'+token_logo+'</span>':''}</div>
      <div style="margin-bottom: 15px;"></div>
    `;

    innerHTML += `
      <details>
        <summary class="field-wrap">📄 Показать полные hex данные</summary>
        <pre class="code-block word-break">${rawHex}</pre>
      </details>
      <details>
        <summary class="field-wrap">📄 Показать полные JSON данные</summary>
        <pre class="code-block">${decoded_str}</pre>
      </details>
      <div style="margin-bottom: 15px;"></div>
      `;
    innerHTML += `
      <div style="font-size: 12px;"><strong>Создан:</strong><i> ${message.timestamp_date || ''}</i></div>
    `;
    innerHTML += `
      <div style="font-size: 12px;"><strong>Истекает:</strong><i> ${message.expiration_date || ''}</i></div>
    `;

    card.innerHTML = innerHTML;
    outDiv.appendChild(card);
    // console.log(decodeTriggerSmartTronWeb(rawHex));
  } catch(e) {
    console.error('e',e);
    outDiv.textContent = '❌ Ошибка: ' + e.message;
  }
});

function toggleCode(el) {
  const fieldWrap = el.closest('.field-wrap-js');
  const block = fieldWrap.querySelector('.code-block');
  const addressSpan = fieldWrap.querySelector('.address');

  const isVisible = block.style.display === 'block';

  // Переключаем видимость
  block.style.display = isVisible ? 'none' : 'block';

  // Меняем текст кнопки
  el.textContent = isVisible ? '⬇HEX⬇' : 'Скрыть';
}