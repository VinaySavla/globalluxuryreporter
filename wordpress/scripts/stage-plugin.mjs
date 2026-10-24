import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';

const directory = process.argv[2];
if (!directory) throw new Error('Provide a private staging directory outside the repository');
const root = resolve(directory);
await mkdir(root, { recursive: true });
const credentialsPath = join(root, 'credentials.json');
let credentials;
try { credentials = JSON.parse(await readFile(credentialsPath, 'utf8')); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  if (!process.env.WORDPRESS_URL) throw new Error('Set WORDPRESS_URL for the new installation');
  credentials = { cmsUrl: process.env.WORDPRESS_URL, token: randomBytes(48).toString('base64url') };
  await writeFile(credentialsPath, JSON.stringify(credentials), { flag: 'wx' });
}
const output = join(root, 'deploy', 'glr-cms');
await mkdir(output, { recursive: true });
await copyFile('wordpress/glr-cms/glr-cms.php', join(output, 'glr-cms.php'));
await copyFile('wordpress/glr-cms/report-editor.js', join(output, 'report-editor.js'));
await writeFile(join(output, 'service-key.php'), `<?php\nif (!defined('ABSPATH')) exit;\nreturn '${createHash('sha256').update(credentials.token).digest('hex')}';\n`);
console.log(JSON.stringify({ stagingDirectory: output, credentialsStoredPrivately: true }));
