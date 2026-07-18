const { getProducts, getOlfactoryNotes } = require("./catalogRepository");

function scoreProduct(product, preferences, favoriteIds) {
  const scores = preferences?.scores || {};
  const notes = product.notes || [];
  if (!notes.length) return 0;

  const noteScore =
    notes.reduce((sum, noteId) => sum + (Number(scores[noteId]) || 0), 0) / notes.length;

  const favoriteBoost = favoriteIds.some((favId) => {
    const fav = getProducts().find((p) => p.id === favId);
    if (!fav) return false;
    return fav.notes.some((n) => notes.includes(n));
  })
    ? 1.5
    : 0;

  return noteScore + favoriteBoost;
}

function getRecommendationsForUser(user, limit = 6) {
  const products = getProducts();
  const notes = getOlfactoryNotes();
  const favoriteIds = user.favorites || [];

  if (!user.scentPreferences?.scores) {
    return {
      source: "popular",
      recommendations: products.slice(0, limit).map((product) => ({
        product,
        score: null,
        matchedNotes: [],
        reason: "Fragancias populares para empezar a comparar precios.",
      })),
    };
  }

  const ranked = products
    .map((product) => {
      const matchedNotes = (product.notes || [])
        .map((id) => notes.find((n) => n.id === id))
        .filter(Boolean)
        .filter((n) => (user.scentPreferences.scores[n.id] || 0) >= 4);

      return {
        product,
        score: scoreProduct(product, user.scentPreferences, favoriteIds),
        matchedNotes,
        reason:
          matchedNotes.length > 0
            ? `Coincide con tus notas favoritas: ${matchedNotes.map((n) => n.name).join(", ")}.`
            : "Combina varias notas que marcaste en tu test.",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { source: "preferences", recommendations: ranked };
}

module.exports = { getRecommendationsForUser, scoreProduct };
