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

// render ejs templates (including .html files which may contain ejs)
for (const file of fs.readdirSync(srcDir)) {
  if (file.endsWith('.ejs') || file.endsWith('.html')) {
    const template = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const html = ejs.render(template, {}, { filename: path.join(srcDir, file) });
    const outFile = file.replace(/\.ejs$/, '.html');
    fs.writeFileSync(path.join(distDir, outFile), html);
  }
}

// build js and css
const jsFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
for (const file of jsFiles) {
  esbuild.buildSync({
    entryPoints: [path.join(srcDir, file)],
    outfile: path.join(distDir, file),
    bundle: false,
    minify: true,
    format: 'iife',
  });
}

const cssFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.css'));
for (const file of cssFiles) {
  const css = fs.readFileSync(path.join(srcDir, file), 'utf8');
  fs.writeFileSync(path.join(distDir, file), css);
}
