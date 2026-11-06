import { deflateSync, crc32 } from 'node:zlib';

export type SymbolName = 'circle' | 'square' | 'triangle';
export interface FixtureAnswer { symbol: SymbolName; code: string }
export interface Fixture {
  capture(signal: AbortSignal): Promise<Buffer>;
  replace(answer: FixtureAnswer): void;
  answer(): FixtureAnswer;
}

export function createFixture(initial: FixtureAnswer): Fixture {
  const validate = (answer: FixtureAnswer): FixtureAnswer => {
    if (!['circle', 'square', 'triangle'].includes(answer.symbol) || !/^\d{4}$/.test(answer.code)) {
      throw new Error('Use circle, square, or triangle and exactly four digits.');
    }
    return { ...answer };
  };
  let current = validate(initial);
  return {
    async capture(signal) {
      signal.throwIfAborted();
      // Render each read afresh. Retain only the synthetic source, never a PNG cache.
      return renderPng({ ...current });
    },
    replace(answer) { current = validate(answer); },
    answer() { return { ...current }; },
  };
}

function chunk(name: string, bytes: Buffer): Buffer {
  const type = Buffer.from(name, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([type, bytes])));
  return Buffer.concat([length, type, bytes, checksum]);
}

// Native RGB PNG encoder: no filesystem, canvas runtime, embedded text, or image dependency.
function renderPng(answer: FixtureAnswer): Buffer {
  const width = 640;
  const height = 360;
  const stride = width * 3 + 1;
  const pixels = Buffer.alloc(height * stride, 255);
  for (let y = 0; y < height; y++) pixels[y * stride] = 0;
  const dot = (x: number, y: number) => {
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const px = Math.round(x) + dx;
      const py = Math.round(y) + dy;
      if (dx * dx + dy * dy <= 9 && px >= 0 && px < width && py >= 0 && py < height) {
        pixels.fill(0, py * stride + 1 + px * 3, py * stride + 4 + px * 3);
      }
    }
  };
  const line = (x: number, y: number, endX: number, endY: number) => {
    const steps = Math.ceil(Math.hypot(endX - x, endY - y));
    for (let i = 0; i <= steps; i++) dot(x + (endX - x) * i / Math.max(steps, 1), y + (endY - y) * i / Math.max(steps, 1));
  };
  if (answer.symbol === 'circle') {
    for (let i = 0; i < 360; i++) {
      const angle = i * Math.PI / 180;
      dot(140 + 76 * Math.cos(angle), 180 + 76 * Math.sin(angle));
    }
  } else if (answer.symbol === 'square') {
    line(64, 104, 216, 104); line(216, 104, 216, 256);
    line(216, 256, 64, 256); line(64, 256, 64, 104);
  } else {
    line(140, 92, 228, 256); line(228, 256, 52, 256); line(52, 256, 140, 92);
  }
  const glyphs: Record<string, string[]> = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
  };
  for (const [index, digit] of [...answer.code].entries()) {
    for (const [row, cells] of glyphs[digit].entries()) for (const [column, cell] of [...cells].entries()) {
      if (cell === '1') for (let dy = 0; dy < 14; dy++) {
        line(300 + index * 76 + column * 16, 140 + row * 16 + dy, 313 + index * 76 + column * 16, 140 + row * 16 + dy);
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0)),
  ]);
}
