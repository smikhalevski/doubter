import fs from 'fs';

process.chdir(process.argv[2]);

for (const file of fs.readdirSync('.', { recursive: true })) {
  if (file.endsWith('.js')) {
    fs.writeFileSync(
      file.slice(0, -3) + '.mjs',
      fs.readFileSync(file, 'utf8').replace(/(['"]\.[^'"]+)\.js/g, '$1.mjs')
    );
  }
}
