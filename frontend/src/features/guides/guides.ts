/**
 * Guías editoriales. Cada sección puede cerrar con una fila de perfumes que se
 * consulta al catálogo en vivo: el texto lo escribe el equipo y los precios
 * salen de las tiendas, así la guía no queda desactualizada.
 *
 * Para publicar una guía nueva basta con agregarla a GUIDES: la página, el
 * índice y el sitemap la toman de aquí.
 */

export type GuideRail = {
  title: string;
  /** Parámetros de /catalog/search (q, segment, gender, sort, comparison…). */
  params: Record<string, string>;
  /** Enlace "Ver más" al comparador con los mismos filtros. */
  href: string;
};

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
  rail?: GuideRail;
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  /** Fecha ISO (AAAA-MM-DD). */
  published: string;
  updated?: string;
  authors: string[];
  intro: string;
  sections: GuideSection[];
};

export const GUIDE_AUTHORS = ["Benjamín Cantero", "Juan Pablo Valdebenito"];

export const GUIDES: Guide[] = [
  {
    slug: "perfumes-arabes-en-chile",
    title: "Perfumes árabes en Chile: marcas, precios y cómo comparar antes de comprar",
    description:
      "Qué marcas de perfumería árabe se venden en Chile, por qué el mismo frasco cambia tanto de precio entre tiendas y cómo encontrar la oferta real.",
    published: "2026-10-07",
    authors: GUIDE_AUTHORS,
    intro:
      "La perfumería árabe pasó de ser un nicho a ocupar vitrinas completas en las tiendas chilenas. Al revisar el catálogo nos encontramos con lo mismo una y otra vez: el mismo perfume, con el mismo tamaño, publicado con diferencias de varios miles de pesos según la tienda. Esta guía resume lo que aprendimos al comparar estos perfumes todos los días.",
    sections: [
      {
        heading: "Las marcas que más se repiten en las tiendas",
        paragraphs: [
          "Lattafa, Armaf, Afnan, Rasasi, Al Haramain y Maison Alhambra concentran la mayor parte de la oferta árabe que vemos en Chile. Algunas, como Lattafa y Armaf, están en casi todas las tiendas especializadas; otras aparecen sólo en una o dos.",
          "Que una marca esté en muchas tiendas es una buena noticia para quien compra: hay más competencia y la diferencia entre el precio más alto y el más bajo suele ser mayor. Abajo están los perfumes árabes que hoy se venden en más tiendas a la vez.",
        ],
        rail: {
          title: "Perfumes árabes en más tiendas hoy",
          params: { segment: "arabic", comparison: "multiple", sort: "stores" },
          href: "/dashboard?segment=arabic&sort=stores",
        },
      },
      {
        heading: "Por qué el mismo perfume cambia tanto de precio",
        paragraphs: [
          "Las tiendas especializadas en perfumería árabe importan directamente y ajustan precios con frecuencia, mientras que las multitiendas suelen tener precios más estables pero con descuentos puntuales. Por eso el orden de \"la más barata\" cambia de una semana a otra.",
          "Al comparar, revisa siempre tres cosas antes de decidir:",
        ],
        list: [
          "El volumen: un mismo perfume se vende en 30, 50, 100 o 200 ml, y no se pueden comparar entre sí.",
          "La concentración: Eau de Parfum y Eau de Toilette de la misma línea son productos distintos.",
          "El stock: un precio bajo no sirve si la tienda está agotada. En FullFragance las tiendas sin stock quedan al final.",
        ],
      },
      {
        heading: "Sets, testers y versiones parecidas",
        paragraphs: [
          "Muchas tiendas venden sets (perfume más una miniatura o crema) y testers. Aunque contengan el mismo líquido, no son la misma oferta, así que en el comparador los mantenemos separados del frasco individual.",
          "También es común que una línea tenga varias versiones con nombres casi iguales (por ejemplo, ediciones \"Intense\", \"Oud\" o \"Elixir\"). Si buscas una en particular, entra a la ficha y confirma el nombre completo antes de ir a la tienda.",
        ],
      },
      {
        heading: "Cómo usar el comparador para comprar mejor",
        paragraphs: [
          "Busca el perfume por nombre, abre la ficha y revisa la lista de tiendas: está ordenada de la más barata a la más cara, con las tiendas sin stock al final. El botón de cada tienda te lleva a su página para que compres directamente allí; FullFragance no vende ni cobra comisión por la compra.",
          "Si ves un precio que no coincide con el de la tienda, escríbenos desde el enlace \"Reportar un precio\" al final de la página y lo revisamos.",
        ],
        rail: {
          title: "Lattafa: precios entre tiendas",
          params: { q: "lattafa", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=lattafa&sort=stores",
        },
      },
    ],
  },
  {
    slug: "edt-edp-parfum-diferencias",
    title: "EDT, EDP o Parfum: qué significa cada concentración y cuál conviene",
    description:
      "Las diferencias entre Eau de Toilette, Eau de Parfum, Parfum y colonia, cómo influyen en la duración y en el precio, y por qué no conviene compararlas entre sí.",
    published: "2026-10-07",
    authors: GUIDE_AUTHORS,
    intro:
      "Una de las dudas más comunes al comparar precios es por qué el mismo perfume aparece con dos o tres precios muy distintos. Casi siempre la respuesta está en la concentración: EDT, EDP y Parfum son versiones diferentes, aunque compartan nombre y frasco parecido.",
    sections: [
      {
        heading: "Qué indica cada sigla",
        paragraphs: [
          "La concentración es la proporción de esencia aromática dentro del perfume. Los rangos varían según cada casa, pero como referencia general:",
        ],
        list: [
          "Eau de Cologne (colonia): la más ligera, pensada para refrescar. Dura poco en la piel.",
          "Eau de Toilette (EDT): concentración media-baja. Suele ser más fresca y luminosa.",
          "Eau de Parfum (EDP): más concentrada que la EDT. Normalmente dura más y se percibe más cálida.",
          "Parfum o Extrait: la más concentrada y, en general, la más cara por mililitro.",
        ],
      },
      {
        heading: "Más concentración no siempre es mejor",
        paragraphs: [
          "Muchas casas no sólo suben la concentración: cambian la fórmula. La EDT y la EDP de una misma línea pueden oler distinto, con notas que se destacan más en una que en otra. Por eso conviene elegir por el aroma que te gusta y no sólo por la duración.",
          "La duración también depende de la piel, del clima y de la familia olfativa: las notas cítricas se evaporan antes que las amaderadas o ambaradas, sin importar la concentración.",
        ],
      },
      {
        heading: "Cómo afecta al precio y a la comparación",
        paragraphs: [
          "Como son productos distintos, en FullFragance no agrupamos concentraciones ni volúmenes diferentes en una misma ficha cuando la tienda los informa: un Eau de Toilette de 100 ml se compara con el mismo Eau de Toilette de 100 ml. Si un perfume está en una sola tienda, la ficha te sugiere otras versiones de la misma fragancia (otro tamaño o concentración) que sí se venden en varias.",
          "Un consejo práctico: calcula el precio por mililitro. Un frasco de 200 ml puede parecer caro, pero salir más barato por uso que dos de 100 ml.",
        ],
        rail: {
          title: "Eau de Parfum en más tiendas",
          params: { q: "edp", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=edp&sort=stores",
        },
      },
      {
        heading: "Entonces, ¿cuál conviene?",
        paragraphs: [
          "Para uso diario, clima cálido o la oficina, una EDT suele ser suficiente. Para la noche, el invierno o si buscas que dure toda la jornada, una EDP es la opción más común. El Parfum tiene sentido si ya conoces la fragancia y quieres su versión más intensa.",
          "Sea cual sea la elección, compara siempre la misma concentración y el mismo volumen entre tiendas antes de comprar.",
        ],
        rail: {
          title: "Eau de Toilette en más tiendas",
          params: { q: "edt", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=edt&sort=stores",
        },
      },
    ],
  },
];

export function guideBySlug(slug: string) {
  return GUIDES.find(guide => guide.slug === slug) ?? null;
}
