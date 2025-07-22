const fs = require('fs');
const path = require('path');
const assert = require('assert');
const Ajv = require('ajv');

try {
  const schemaPath = path.join(__dirname, '..', 'books.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv();
  const validate = ajv.compile(schema);

  const content = fs.readFileSync('public/books.json', 'utf8');
  const data = JSON.parse(content);
  assert.ok(Array.isArray(data), 'books.json should contain an array');

  const valid = validate(data);
  if (!valid) {
    console.error('Schema validation errors:', validate.errors);
    throw new Error('books.json failed schema validation');
  }

  const ids = new Set();
  data.forEach((book, idx) => {
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
