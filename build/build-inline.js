const fs = require('fs');
const path = require('path');

// Корень проекта
const root = path.join(__dirname, '..');
const srcHtmlPath = path.join(root, 'src', 'index.html');
const distDir = path.join(root, 'dist');
const distHtmlPath = path.join(distDir, 'scandecodeTRON.html');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Функция для добавления отступов к каждой строке
function indentContent(content, spaces = 2) {
  const indent = ' '.repeat(spaces);
  return content
    .split('\n')
    .map(line => line ? indent + line : line) // Добавляем отступ только к непустым строкам
    .join('\n');
}

let html = fs.readFileSync(srcHtmlPath, 'utf8');

// Встраиваем CSS: <link rel="stylesheet" href="...">
html = html.replace(
  /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
  (match, href) => {
    const cssPath = path.join(root, 'src', href);
    const css = fs.readFileSync(cssPath, 'utf8');
    const indentedCss = indentContent(css, 4);
    return `<style>\n${indentedCss}\n  </style>`;
  }
);

// Встраиваем JS: <script src="..."></script>
html = html.replace(
  /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
  (match, src) => {
    const jsPath = path.join(root, 'src', src);
    const js = fs.readFileSync(jsPath, 'utf8');
    const indentedJs = indentContent(js, 4);
    return `<script>\n${indentedJs}\n  </script>`;
  }
);

fs.writeFileSync(distHtmlPath, html, 'utf8');
console.log('Собрано в', distHtmlPath);