const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html'));
let checked = 0;
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)) {
    const ref = match[1].split('?')[0];
    if (/^(?:https?:|mailto:|tel:|data:)/.test(ref)) continue;
    const target = path.resolve(root, decodeURIComponent(ref).replace(/^\/+/, ''));
    if (!target.startsWith(root + path.sep) && target !== root) throw new Error('Outside site: ' + ref);
    if (!fs.existsSync(target)) throw new Error(page + ': missing ' + ref);
    checked++;
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  if (new Set(ids).size !== ids.length) throw new Error(page + ': duplicate IDs');
}
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, {recursive:true});
for (const page of pages) fs.copyFileSync(path.join(root,page), path.join(dist,page));
fs.cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
console.log('Verified ' + pages.length + ' pages and ' + checked + ' local references; static site prepared.');
