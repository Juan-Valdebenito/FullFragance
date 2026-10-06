const test = require("node:test");
const assert = require("node:assert/strict");
const { parseIntent } = require("../src/models/queryIntent");

test("separa género, segmento y precio máximo del texto", () => {
  const intent = parseIntent("perfume árabe hombre bajo 30 mil");
  assert.equal(intent.text, "");
  assert.equal(intent.filters.gender, "Masculino");
  assert.equal(intent.filters.segment, "arabic");
  assert.equal(intent.filters.maxPrice, 30000);
  assert.deepEqual(intent.chips.map((chip) => chip.label), ["Árabes", "Hombre", "Hasta $30.000"]);
});

test("conserva el texto que no es intención", () => {
  const intent = parseIntent("Sauvage EDP para mujer");
  assert.equal(intent.text, "sauvage edp");
  assert.equal(intent.filters.gender, "Femenino");
});

test("entiende distintas formas de escribir precios", () => {
  assert.equal(parseIntent("hasta $45.990").filters.maxPrice, 45990);
  assert.equal(parseIntent("menos de 50k").filters.maxPrice, 50000);
  assert.equal(parseIntent("desde 20 mil").filters.minPrice, 20000);
  assert.equal(parseIntent("entre 20 mil y 40 mil").filters.minPrice, 20000);
  assert.equal(parseIntent("entre 20 mil y 40 mil").filters.maxPrice, 40000);
});

test("barato ordena por precio y oferta por ahorro", () => {
  assert.equal(parseIntent("lattafa barato").filters.sort, "price");
  assert.equal(parseIntent("ofertas nicho").filters.sort, "savings");
  assert.equal(parseIntent("ofertas nicho").filters.segment, "niche");
});

test("no confunde números de volumen con precios", () => {
  const intent = parseIntent("yara 100 ml");
  assert.equal(intent.text, "yara 100 ml");
  assert.equal(intent.filters.maxPrice, undefined);
});

test("una consulta vacía no tiene intención", () => {
  assert.deepEqual(parseIntent("   "), { text: "", filters: {}, chips: [] });
});
