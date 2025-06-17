import fse from 'fs-extra';
import * as path from 'path';
import { fileURLToPath } from 'url';
import tmp from 'tmp';
import { generateObfuscatedFont, loadConfig } from 'digit-font';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fse.ensureDirSync(path.join(__dirname, './tmp'));
tmp.setGracefulCleanup();

export function withObfuscationConfig<T>(
  callback: (config: ReturnType<typeof loadConfig>, tmpDir: string) => T
): T {
  // @ts-ignore
  const dir = tmp.dirSync({
    prefix: 'digit-font-',
    unsafeCleanup: true
  });

  try {
    const customConfigIni = `
[general]
input = ${path.join(__dirname, 'assets', 'Roboto-Regular.ttf')}

[numbermap]
1=6
2=2
3=7
4=3
5=8
6=1
7=5
8=4
9=0
0=9
`.trim();

    const tmpConfigPath = path.join(dir.name, 'digit-font.cfg');
    fse.writeFileSync(tmpConfigPath, customConfigIni, 'utf-8');

    const config = loadConfig(tmpConfigPath);
    return callback(config, dir.name);
  } finally {
    // @ts-ignore
    dir.removeCallback();
  }
}

const generateValidId = (length = 6) => {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const alphanumeric = letters + '0123456789';

  let id = letters[Math.floor(Math.random() * letters.length)];
  for (let i = 1; i < length; i++) {
    id += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
  }
  return id;
};

export const OBFUSCATION_META = {
  className: process.env.OBFUSCATION_CLASS_NAME || generateValidId(),
  fontFamily: generateValidId(4)
};

export function generateObfuscatedFontCss(): string {
  return withObfuscationConfig((config, tmpDir) => {
    const outputFont = path.join(tmpDir, 'obfuscated-font.ttf');

    generateObfuscatedFont(
      config.input,
      outputFont,
      config.numberMap
    );

    const fontBuffer = fse.readFileSync(outputFont);
    const fontBase64 = fontBuffer.toString('base64');

    return `
@font-face {
    font-family: '${OBFUSCATION_META.fontFamily}';
    src: url('data:font/ttf;charset=utf-8;base64,${fontBase64}') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

.${OBFUSCATION_META.className} {
    font-family: '${OBFUSCATION_META.fontFamily}', sans-serif;
}
`.trim();
  });
}

if (process.argv[1] === __filename) {
  try {
    const cssString = generateObfuscatedFontCss();
    fse.writeFileSync(path.join(__dirname, './tmp/obfuscated-font.css'), cssString, 'utf-8');
    console.log('✅ CSS 已保存到 tmp/obfuscated-font.css');
  } catch (err) {
    console.error(err);
  }
}