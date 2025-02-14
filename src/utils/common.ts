export function strToBase64(str: string) {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join('');
  return btoa(binString);
}
