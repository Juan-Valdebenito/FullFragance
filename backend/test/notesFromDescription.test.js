const test = require("node:test");
const assert = require("node:assert/strict");
const { notesFromDescription } = require("../src/models/catalogRepository");

test("encuentra notas reales cuando la tienda las nombra explícitamente", () => {
  const description = "Una fragancia con notas de bergamota, jazmín y sándalo que evoluciona hacia un fondo amaderado.";
  const notes = notesFromDescription(description);
  assert.deepEqual(notes, ["n1", "n5", "n9"]);
});

test("no devuelve nada si sólo hay una nota mencionada (no alcanza el mínimo)", () => {
  assert.equal(notesFromDescription("Perfume con un toque de vainilla."), null);
});

test("no devuelve nada sin descripción o con texto vacío", () => {
  assert.equal(notesFromDescription(null), null);
  assert.equal(notesFromDescription(""), null);
  assert.equal(notesFromDescription("   "), null);
  assert.equal(notesFromDescription(undefined), null);
});

test("no confunde piña con piñata ni limón con limoncillo", () => {
  assert.equal(notesFromDescription("Decoración con piñata y aroma a limoncillo, nada más."), null);
});

test("ignora mayúsculas y acentos al buscar las notas", () => {
  const notes = notesFromDescription("CANELA, PIMIENTA y un fondo de ÁMBAR cálido.");
  assert.deepEqual(notes, ["n14", "n16", "n17"]);
});

test("corta en 6 notas aunque la descripción nombre más", () => {
  const description = "Bergamota, limón, naranja, rosa, jazmín, lavanda, iris y cedro en una sola fragancia.";
  const notes = notesFromDescription(description);
  assert.equal(notes.length, 6);
});
