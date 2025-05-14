import fs from 'fs';

process.chdir(process.argv[2]);

for (const file of fs.readdirSync('.', { recursive: true })) {
  if (file.endsWith('.js')) {
    fs.writeFileSync(file.replaceAll('.js', '.mjs'), fs.readFileSync(file, 'utf8').replaceAll(".js'", ".mjs'"));
  }
}
