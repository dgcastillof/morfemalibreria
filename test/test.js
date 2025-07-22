const fs = require('fs');
const assert = require('assert');

try {
  const content = fs.readFileSync('public/books.json', 'utf8');
  const data = JSON.parse(content);
  assert.ok(Array.isArray(data), 'books.json should contain an array');

  const requiredKeys = [
    'id',
    'titulo',
    'idioma',
    'autor',
    'estado',
    'precio',
    'imagen',
    'vendido'
  ];
  const ids = new Set();

  data.forEach((book, idx) => {
    requiredKeys.forEach((key) => {
      assert.ok(
        Object.prototype.hasOwnProperty.call(book, key),
        `Missing key "${key}" in object at index ${idx}`
      );
    });

    assert.ok(!ids.has(book.id), `Duplicate id ${book.id} at index ${idx}`);
    ids.add(book.id);

    const numericPrice = parseFloat(String(book.precio).replace(/[^0-9.-]+/g, ''));
    assert.ok(!Number.isNaN(numericPrice), `precio at index ${idx} is not numeric`);
  });

  console.log('books.json parsed successfully. All checks passed.');
} catch (err) {
  console.error('Test failed:', err);
  process.exit(1);
}
