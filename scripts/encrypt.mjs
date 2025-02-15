import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const token = process.argv[2];
const password = process.argv[3];
if (!token || !password) {
  console.log('please provide your token and password.');
  process.exit(0);
}

function stringToUint8Array(str) {
  return new TextEncoder().encode(str);
}

function padPassword(password, len) {
  if (len > password.length) {
    while (password.length < len) {
      password += password;
    }
  }
  return password.slice(0, len);
}

function encrypt(token, password) {
  const tokenArr = stringToUint8Array(token);
  const paddedPassword = padPassword(password, token.length);
  const passwordArr = stringToUint8Array(paddedPassword);

  return tokenArr.map((byte, idx) => byte + passwordArr[idx]);
}

function main() {
  const keyArr = encrypt(token, password);
  console.log(
    `your encrypted key length: ${keyArr.length}, token length: ${token.length}`,
  );

  const keyPath = path.resolve(__dirname, '../src/key.json');
  fs.writeFileSync(keyPath, JSON.stringify([...keyArr]));
}

main();
