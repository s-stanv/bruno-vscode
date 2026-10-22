import { describe, it, expect } from 'vitest';
import { decodeGrpcMessage } from './decode-message';

const b64 = (value: string | Uint8Array) => Buffer.from(value).toString('base64');

describe('decodeGrpcMessage', () => {
  it('replaces base64 JSON bytes with parsed JSON', () => {
    const body = { documents: [{ numberOrder: 'C032.6120638856.C217' }], total: 1 };
    const { message, binaries } = decodeGrpcMessage({ body: b64(JSON.stringify(body)), content_type: 'application/json' });

    expect(message).toEqual({ body, content_type: 'application/json' });
    expect(binaries).toEqual([]);
  });

  it('lists PDF bytes for saving and names the file from a sibling field', () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);
    const content = b64(pdf);
    const { message, binaries } = decodeGrpcMessage({
      content,
      content_type: 'application/pdf',
      filename: 'forwarding_instruction_C032.pdf'
    });

    expect(message).toEqual({
      content: '<application/pdf, 9 bytes>',
      content_type: 'application/pdf',
      filename: 'forwarding_instruction_C032.pdf'
    });
    expect(binaries).toEqual([
      {
        path: 'content',
        base64: content,
        mime: 'application/pdf',
        extension: 'pdf',
        size: 9,
        fileName: 'forwarding_instruction_C032.pdf'
      }
    ]);
  });

  it('falls back to the field name when there is no file name', () => {
    const { binaries } = decodeGrpcMessage({ items: [{ image: b64(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])) }] });

    expect(binaries.map((b) => [b.path, b.fileName])).toEqual([['items[0].image', 'image.png']]);
  });

  it('keeps ordinary strings and unknown binary data as is', () => {
    const random = b64(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    const input = { id: 'abcd1234', status: 'SIGNED', blob: random, count: 3, nested: { ok: true } };

    expect(decodeGrpcMessage(input)).toEqual({ message: input, binaries: [] });
  });

  it('decodes JSON nested inside decoded JSON and accepts a JSON string message', () => {
    const inner = b64(JSON.stringify({ a: 1 }));
    const { message } = decodeGrpcMessage(JSON.stringify({ body: b64(JSON.stringify({ details: inner })) }));

    expect(message).toEqual({ body: { details: { a: 1 } } });
  });
});
