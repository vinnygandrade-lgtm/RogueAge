#!/usr/bin/env node
/** Quick check: preview/dist serves Vite entry + chunks (post-build). */
import http from 'node:http';

const base = process.argv[2] || 'http://localhost:4174';

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = '';
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      })
      .on('error', reject);
  });
}

const idx = await get(`${base}/`);
const entry = idx.body.match(/src="(\/assets\/index-[^"]+\.js)"/);
if (!entry) {
  console.error('FAIL: no Vite entry script in index.html');
  process.exit(1);
}

const js = await get(`${base}${entry[1]}`);
const cssMatch = idx.body.match(/href="(\/assets\/index-[^"]+\.css)"/);
const css = cssMatch ? await get(`${base}${cssMatch[1]}`) : { status: 0, body: '' };

const hasMainRef = /main-[A-Za-z0-9_-]+\.js/.test(js.body);
console.log(`OK html=${idx.status} entry=${entry[1]} js=${js.status}(${js.body.length}b) css=${css.status} mainRef=${hasMainRef}`);

if (idx.status !== 200 || js.status !== 200 || !hasMainRef) process.exit(1);
