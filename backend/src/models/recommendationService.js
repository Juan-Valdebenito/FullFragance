const { getProducts, getOlfactoryNotes } = require("./catalogRepository");

function scoreProduct(product, preferences, favoriteIds, allProducts = []) {
  const scores = preferences?.scores || {};
  const notes = product.notes || [];
  if (!notes.length) return 0;

  const noteScore =
    notes.reduce((sum, noteId) => sum + (Number(scores[noteId]) || 0), 0) / notes.length;

  const favoriteBoost = favoriteIds.some((favId) => {
    const fav = allProducts.find((p) => p.id === favId || p.aliases?.includes(favId));
    if (!fav) return false;
    return fav.notes?.some((n) => notes.includes(n));
  })
    ? 1.5
    : 0;

  return noteScore + favoriteBoost;
}

async function getRecommendationsForUser(user, limit = 6) {
  const products = await getProducts();
  const availableProducts = products.filter((product) => product.offers?.some((offer) => offer.price > 0));
  const notes = await getOlfactoryNotes();
  const favoriteIds = user.favorites || [];

  if (!user.scentPreferences?.scores) {
    return {
      source: "popular",
      recommendations: availableProducts.slice(0, limit).map((product) => ({
        product,
        score: null,
        matchedNotes: [],
        reason: "Fragancias populares para empezar a comparar precios.",
      })),
    };
  }

  const profiledProducts = availableProducts.filter((product) => product.notes?.length);
  const ranked = profiledProducts
    .map((product) => {
      const matchedNotes = (product.notes || [])
        .map((id) => notes.find((n) => n.id === id))
        .filter(Boolean)
        .filter((n) => (user.scentPreferences.scores[n.id] || 0) >= 4);

      return {
        product,
        score: scoreProduct(product, user.scentPreferences, favoriteIds, products),
        matchedNotes,
        reason:
          matchedNotes.length > 0
            ? `Coincide con tus notas favoritas: ${matchedNotes.map((n) => n.name).join(", ")}.`
            : "Combina varias notas que marcaste en tu test.",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (!ranked.length) {
    return {
      source: "popular",
      recommendations: availableProducts.slice(0, limit).map((product) => ({
        product,
        score: null,
        matchedNotes: [],
        reason: "Todavía no tenemos notas verificadas para este perfume; se muestra por disponibilidad.",
      })),
    };
  }

  return { source: "preferences", recommendations: ranked };
}

module.exports = { getRecommendationsForUser, scoreProduct };
