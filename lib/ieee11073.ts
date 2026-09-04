// Bluetooth SIG health devices (SpO2, blood pressure, thermometer) encode
// measurements as IEEE-11073 floating point, not plain IEEE-754. Decoders below
// implement the two widths the standard GATT health profiles actually use.

/** 16-bit SFLOAT: 12-bit signed mantissa + 4-bit signed exponent (base 10). */
export function decodeSFloat16(raw: number): number {
  const mantissa = raw & 0x0fff;
  const exponent = (raw >> 12) & 0xf;
  const signedMantissa = mantissa >= 0x0800 ? mantissa - 0x1000 : mantissa;
  const signedExponent = exponent >= 0x8 ? exponent - 0x10 : exponent;
  return signedMantissa * Math.pow(10, signedExponent);
}

/** 32-bit FLOAT: 24-bit signed mantissa + 8-bit signed exponent (base 10). */
export function decodeFloat32(raw: number): number {
  const mantissa = raw & 0x00ffffff;
  const exponent = (raw >> 24) & 0xff;
  const signedMantissa = mantissa >= 0x800000 ? mantissa - 0x1000000 : mantissa;
  const signedExponent = exponent >= 0x80 ? exponent - 0x100 : exponent;
  return signedMantissa * Math.pow(10, signedExponent);
}

export function readUInt16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

export function readUInt32LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}
