// Utilidades para simular datos de forma consistente por ciudad,
// sin depender todavía de un feed real de tiendas/precios.

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

// PRNG determinista (mismo seed -> misma secuencia siempre).
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Genera un punto cercano a (lat, lon) dentro de un radio aproximado en km,
// usando un seed para que la ubicación sea siempre la misma para esa ciudad+tienda.
function jitterPoint(lat, lon, seedStr, radiusKm = 4) {
  const rng = seededRandom(hashSeed(seedStr));
  const angle = rng() * 2 * Math.PI;
  const distance = rng() * radiusKm;
  const dLat = (distance / 111) * Math.cos(angle);
  const dLon = (distance / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
  return { lat: lat + dLat, lon: lon + dLon };
}

module.exports = { hashSeed, seededRandom, jitterPoint };
