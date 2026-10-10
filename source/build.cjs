const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

async function build() {
  const root = __dirname;
  const read = name => fs.readFileSync(path.join(root, name), 'utf8');
  const wasm = fs.readFileSync(path.join(root, 'vendor/sql-wasm.wasm')).toString('base64');
  const license = read('vendor/LICENSE-sql-js.txt');
  const bundled = await esbuild.build({
    entryPoints: [path.join(root, 'main.ts')],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    banner: {js: `const WASM_BASE64=${JSON.stringify(wasm)};\nconst SQLJS_LICENSE=${JSON.stringify(license)};`}
  });

  let html = read('shell.html');
  html = html.replace('/*SQL_ENGINE*/', () => read('vendor/sql-wasm.js').replace(/<\/script/gi, '<\\/script'));
  html = html.replace('/*COURSE_DATA*/', '');
  html = html.replace('/*APP_CODE*/', () => bundled.outputFiles[0].text);

  const siteRoot = path.resolve(root, '..');
  const dist = path.join(siteRoot, 'dist');
  fs.mkdirSync(dist, {recursive: true});
  fs.writeFileSync(path.join(siteRoot, 'index.html'), html);
  fs.writeFileSync(path.join(dist, 'index.html'), html);
  console.log(`Built TypeScript course for static hosting (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
}

build().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
