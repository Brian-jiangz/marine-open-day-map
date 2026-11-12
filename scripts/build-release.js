#!/usr/bin/env node
'use strict';

// A distinct page URL avoids previously cached HTML in in-app browsers.
// Content-named assets keep a release's HTML, styles and modules together.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'assets', 'web');
fs.mkdirSync(directory, { recursive: true });
fs.mkdirSync(path.join(root, 'guide'), { recursive: true });
function asset(kind, extension, content) {
  const digest = crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  const name = `${kind}-${digest}.${extension}`;
  fs.writeFileSync(path.join(directory, name), content);
  return name;
}
const music = asset('music', 'js', fs.readFileSync(path.join(root, 'music.js'), 'utf8'));
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const app = asset('app', 'js', appSource.replace(/from '\.\/music\.js(?:\?[^']*)?'/, `from './${music}'`));
const css = asset('styles', 'css', fs.readFileSync(path.join(root, 'styles.css'), 'utf8'));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/href="(?:styles\.css[^"\s]*|assets\/web\/styles-[^"]+)"/, `href="assets/web/${css}"`)
  .replace(/src="(?:app\.js[^"\s]*|assets\/web\/app-[^"]+)"/, `src="assets/web/${app}"`);
fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'guide/index.html'), html.replace('<head>', '<head>\n  <base href="../">'));
console.log(JSON.stringify({ entry: 'guide/', app, css, music }));
