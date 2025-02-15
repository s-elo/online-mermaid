import encodedKey from '../key.json';

export function decrypt(
  password: string,
  keyArr: Uint8Array = encodedKey as unknown as Uint8Array,
) {
  if (!password.length) return '';

  const paddedPassword = padPassword(password, keyArr.length);
  const passwordArr = new TextEncoder().encode(paddedPassword);

  return new TextDecoder().decode(
    new Uint8Array(keyArr.map((byte, idx) => byte - passwordArr[idx])),
  );
}

export function padPassword(password: string, len: number) {
  if (len > password.length) {
    while (password.length < len) {
      password += password;
    }
  }
  return password.slice(0, len);
}

export function strToBase64(str: string) {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join('');
  return btoa(binString);
}

export function base64ToStr(base64: string) {
  const binString = atob(base64) as Iterable<number>;
  return new TextDecoder().decode(
    Uint8Array.from(
      binString,
      (c) => (c as unknown as string).codePointAt(0) as number,
    ),
  );
}