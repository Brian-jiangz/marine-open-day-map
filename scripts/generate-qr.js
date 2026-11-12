#!/usr/bin/env node
'use strict';

const QRCode = require('qrcode');

const url = process.env.QR_URL || 'https://brian-jiangz.github.io/marine-open-day-map/guide/';
const root = require('path').resolve(__dirname, '..');

async function main() {
  await QRCode.toFile(require('path').join(root, 'qr-code.png'), url, {
    errorCorrectionLevel: 'H',
    margin: 3,
    width: 960,
    color: {
      dark: '#0D3448',
      light: '#FFFFFF',
    },
  });
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 3,
    color: {
      dark: '#0D3448',
      light: '#FFFFFF',
    },
  });
  require('fs').writeFileSync(require('path').join(root, 'qr-code.svg'), svg, 'utf8');
  console.log(JSON.stringify({ url, png: 'qr-code.png', svg: 'qr-code.svg' }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
