const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const ejs = require('ejs');

const srcDir = path.join(__dirname, 'src');
const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

// copy static assets from public
fs.cpSync(publicDir, distDir, { recursive: true });

function processDir(srcPath, outPath) {
  fs.mkdirSync(outPath, { recursive: true });
  for (const entry of fs.readdirSync(srcPath, { withFileTypes: true })) {
    const srcFile = path.join(srcPath, entry.name);
    const outFile = path.join(outPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'templates') continue;
      processDir(srcFile, outFile);
    } else if (entry.name.endsWith('.ejs') || entry.name.endsWith('.html')) {
      const template = fs.readFileSync(srcFile, 'utf8');
      const html = ejs.render(template, {}, { filename: srcFile });
      fs.writeFileSync(outFile.replace(/\.ejs$/, '.html'), html);
    } else if (entry.name.endsWith('.js')) {
      esbuild.buildSync({
        entryPoints: [srcFile],
        outfile: outFile,
        bundle: false,
        minify: true,
        format: 'iife',
      });
    } else if (entry.name.endsWith('.css')) {
      const css = fs.readFileSync(srcFile, 'utf8');
      fs.writeFileSync(outFile, css);
    }
  }
}

processDir(srcDir, distDir);
