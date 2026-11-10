#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

function safePath(urlPath) {
  const pathname = decodeURIComponent(String(urlPath || '/').split('?')[0]);
  const requested = pathname === '/' ? '/index.html' : pathname;
  const resolved = path.resolve(root, '.' + requested);
  return resolved.startsWith(root + path.sep) ? resolved : null;
}

function startServer(port = 4173, host = '127.0.0.1') {
  const server = http.createServer((request, response) => {
    const file = safePath(request.url);
    if (!file) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }
    fs.readFile(file, (error, content) => {
      if (error) {
        response.writeHead(error.code === 'ENOENT' ? 404 : 500);
        response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
        return;
      }
      response.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      response.end(content);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve(server));
  });
}

if (require.main === module) {
  startServer(Number(process.env.PORT) || 4173).then((server) => {
    const address = server.address();
    console.log(`Marine Open Day Map: http://${address.address}:${address.port}/`);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { startServer };
