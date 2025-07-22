const fs = require('fs');
const assert = require('assert');

try {
  const content = fs.readFileSync('public/books.json', 'utf8');
  const data = JSON.parse(content);
  assert.ok(Array.isArray(data), 'books.json should contain an array');
  console.log('books.json parsed successfully.');
} catch (err) {
  console.error('Test failed:', err);
  process.exit(1);
}
