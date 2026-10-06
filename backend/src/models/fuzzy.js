// Corrección de errores de tipeo contra las palabras reales del catálogo.
// "lataffa" → "lattafa", "sauvaje" → "sauvage", "herera" → "herrera".

const MIN_LENGTH = 5;
// Una palabra que aparece tan pocas veces suele ser un error del propio
// catálogo ("Lataffa"): si hay otra casi igual mucho más común, se corrige.
const RARE_COUNT = 2;
const COMMON_FACTOR = 5;

// Distancia de Damerau-Levenshtein (variante OSA): inserción, borrado,
// sustitución y el cambio de dos letras vecinas cuentan 1 cada uno.
function editDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = Array.from({ length: rows }, (_, i) => {
    const row = new Array(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) d[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

// Palabras normalizadas del catálogo con cuántas veces aparecen: ante dos
// candidatas igual de cercanas gana la más frecuente.
function buildVocabulary(haystacks) {
  const counts = new Map();
  for (const haystack of haystacks) {
    for (const word of haystack.split(" ")) {
      if (word.length >= MIN_LENGTH - 1 && !/\d/.test(word)) counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return { words: [...counts.entries()], counts };
}

const maxDistanceFor = (token) => (token.length >= 7 ? 2 : 1);

// Una palabra ya "existe" si aparece dentro de algún texto del catálogo; así
// los prefijos que se escriben a medias ("sauv") no se corrigen.
function isKnown(token, vocabulary) {
  return vocabulary.words.some(([word]) => word.includes(token));
}

function closestWord(token, vocabulary, minCount = 0) {
  const limit = maxDistanceFor(token);
  let best = null;
  for (const [word, count] of vocabulary.words) {
    if (word === token || count < minCount || Math.abs(word.length - token.length) > limit) continue;
    const distance = editDistance(token, word);
    if (distance > limit) continue;
    if (!best || distance < best.distance || (distance === best.distance && count > best.count)) {
      best = { word, distance, count };
    }
  }
  return best?.word ?? null;
}

function correctTokens(tokens, vocabulary) {
  let corrected = false;
  const result = tokens.map((token) => {
    if (token.length < MIN_LENGTH || /\d/.test(token)) return token;
    const count = vocabulary.counts.get(token) ?? 0;
    const rare = count > 0 && count <= RARE_COUNT;
    if (!rare && isKnown(token, vocabulary)) return token;
    const match = closestWord(token, vocabulary, rare ? count * COMMON_FACTOR : 0);
    if (!match) return token;
    corrected = true;
    return match;
  });
  return { tokens: result, corrected };
}

module.exports = { editDistance, buildVocabulary, correctTokens };
