const test = require("node:test");
const assert = require("node:assert/strict");
const { buildVocabulary, correctTokens, editDistance } = require("../src/models/fuzzy");

const vocabulary = buildVocabulary([
  "lattafa yara candy edp 100 ml",
  "lattafa asad edp 100 ml",
  "dior sauvage edt 100 ml",
  "carolina herrera good girl edp 80 ml",
  "versace eros edt 100 ml",
]);

test("distancia de edición con transposición", () => {
  assert.equal(editDistance("lataffa", "lattafa"), 2);
  assert.equal(editDistance("sauvaje", "sauvage"), 1);
  assert.equal(editDistance("eros", "eors"), 1);
});

test("corrige palabras con errores de tipeo", () => {
  assert.deepEqual(correctTokens(["lataffa"], vocabulary), { tokens: ["lattafa"], corrected: true });
  assert.deepEqual(correctTokens(["sauvaje"], vocabulary), { tokens: ["sauvage"], corrected: true });
  assert.deepEqual(correctTokens(["carolina", "herera"], vocabulary), { tokens: ["carolina", "herrera"], corrected: true });
});

test("no toca palabras existentes, prefijos, números ni palabras cortas", () => {
  assert.deepEqual(correctTokens(["sauv"], vocabulary), { tokens: ["sauv"], corrected: false });
  assert.deepEqual(correctTokens(["100", "ml"], vocabulary), { tokens: ["100", "ml"], corrected: false });
  assert.deepEqual(correctTokens(["eors"], vocabulary), { tokens: ["eors"], corrected: false });
});

test("deja la palabra igual si nada se parece", () => {
  assert.deepEqual(correctTokens(["zzzzzzz"], vocabulary), { tokens: ["zzzzzzz"], corrected: false });
});

test("corrige una palabra rara del catálogo hacia la versión común", () => {
  const withTypo = buildVocabulary([
    "lataffa yara desodorante",
    ...Array.from({ length: 10 }, (_, i) => `lattafa perfume ${i}`),
  ]);
  assert.deepEqual(correctTokens(["lataffa"], withTypo), { tokens: ["lattafa"], corrected: true });
  // Una palabra común no se "corrige" hacia otra.
  assert.deepEqual(correctTokens(["lattafa"], withTypo), { tokens: ["lattafa"], corrected: false });
});
