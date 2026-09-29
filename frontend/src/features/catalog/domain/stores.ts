// Nombre visible de cada fuente de catálogo. Es la única tabla del frontend:
// al sumar una tienda nueva basta con agregarla aquí.
export const storeLabels: Record<string, string> = {
  "falabella-cl": "Falabella",
  "ripley-cl": "Ripley",
  "alisha-cl": "Alisha Perfumes",
  "silk-cl": "Silk Perfumes",
  "elite-cl": "Elite Perfumes",
  "cosmetic-cl": "Cosmetic",
  "paris-cl": "Paris",
  "abc-cl": "ABC",
  "preunic-cl": "Preunic",
  "lodoro-cl": "L'Odoro",
  "leparis-cl": "Le Paris Parfums",
  "dreams-cl": "Dreams Parfums",
};

export function storeLabel(source: string) {
  return storeLabels[source] ?? source.replace(/-cl$/, "");
}
