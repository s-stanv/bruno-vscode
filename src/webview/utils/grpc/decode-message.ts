/**
 * gRPC `bytes` fields arrive in the response as base64 strings. This helper renders them
 * readably: base64 that decodes to a JSON object/array is replaced with that JSON, and known
 * binary payloads (PDF, images, archives) are listed so the UI can offer to save them.
 */

export interface BinaryField {
  path: string;
  base64: string;
  mime: string;
  extension: string;
  size: number;
  fileName: string;
}

export interface DecodedMessage {
  message: unknown;
  binaries: BinaryField[];
}

const BASE64_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const MIN_BASE64_LENGTH = 8;

const SIGNATURES: Array<{ bytes: number[]; mime: string; extension: string }> = [
  { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], mime: 'application/pdf', extension: 'pdf' },
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: 'image/png', extension: 'png' },
  { bytes: [0xff, 0xd8, 0xff], mime: 'image/jpeg', extension: 'jpg' },
  { bytes: [0x50, 0x4b, 0x03, 0x04], mime: 'application/zip', extension: 'zip' }
];

const decodeBase64 = (value: string): Uint8Array | null => {
  if (value.length < MIN_BASE64_LENGTH || value.length % 4 !== 0 || !BASE64_RE.test(value)) {
    return null;
  }
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
};

const parseJson = (bytes: Uint8Array): unknown => {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
  const trimmed = text.trimStart();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const sniffBinary = (bytes: Uint8Array) =>
  SIGNATURES.find((signature) => signature.bytes.every((byte, i) => bytes[i] === byte));

const fileNameFor = (owner: Record<string, unknown> | null, path: string, extension: string) => {
  const sibling = owner?.filename ?? owner?.fileName ?? owner?.file_name;
  if (typeof sibling === 'string' && sibling.trim()) {
    return sibling.trim();
  }
  const base = path.split('.').pop()?.replace(/\[\d+\]/g, '') || 'response';
  return `${base}.${extension}`;
};

export const decodeGrpcMessage = (input: unknown): DecodedMessage => {
  const binaries: BinaryField[] = [];

  const walk = (value: unknown, path: string, owner: Record<string, unknown> | null): unknown => {
    if (typeof value === 'string') {
      const bytes = decodeBase64(value);
      if (!bytes) {
        return value;
      }
      const json = parseJson(bytes);
      if (json !== undefined) {
        return walk(json, path, null);
      }
      const signature = sniffBinary(bytes);
      if (signature) {
        binaries.push({
          path,
          base64: value,
          mime: signature.mime,
          extension: signature.extension,
          size: bytes.length,
          fileName: fileNameFor(owner, path, signature.extension)
        });
        return `<${signature.mime}, ${bytes.length} bytes>`;
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((entry, i) => walk(entry, `${path}[${i}]`, null));
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(record).map(([key, entry]) => [key, walk(entry, path ? `${path}.${key}` : key, record)])
      );
    }
    return value;
  };

  let message = input;
  if (typeof input === 'string') {
    try {
      message = JSON.parse(input);
    } catch {
      return { message: input, binaries };
    }
  }

  return { message: walk(message, '', null), binaries };
};
