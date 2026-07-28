import {readFile, mkdir, writeFile, stat} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(resolve(root, 'assets-manifest.json'), 'utf8'));
for (const asset of manifest) {
  const target = resolve(root, 'site/assets/images', asset.file);
  try { const info = await stat(target); if (info.size > 10000) { console.log(`exists: ${asset.file}`); continue; } } catch {}
  await mkdir(dirname(target), {recursive:true});
  const response = await fetch(asset.url, {headers:{'accept':'image/jpeg,image/*;q=0.9,*/*;q=0.5','user-agent':'Mozilla/5.0 asset migration'}});
  if (!response.ok) throw new Error(`${asset.url}: ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error(`${asset.url}: unexpected ${contentType}`);
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  console.log(`downloaded: ${asset.file}`);
}