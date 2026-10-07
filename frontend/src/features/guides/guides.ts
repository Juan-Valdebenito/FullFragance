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
  {
    slug: "como-saber-si-un-perfume-es-original",
    title: "Cómo saber si un perfume es original antes de comprarlo",
    description:
      "Señales para reconocer un perfume original en Chile: dónde comprar, qué revisar en el envase, cuándo desconfiar de un precio y qué son testers y decants.",
    published: "2026-10-07",
    authors: GUIDE_AUTHORS,
    intro:
      "Un precio muy bajo es tentador, pero en perfumería también es la forma más común de terminar con una imitación. No existe una prueba infalible desde la casa, aunque sí varias señales que, juntas, reducen mucho el riesgo. Estas son las que revisamos nosotros.",
    sections: [
      {
        heading: "Empieza por dónde compras",
        paragraphs: [
          "La protección más efectiva es comprar en una tienda identificable: una multitienda, una farmacia o una perfumería con sitio propio, razón social y canal de reclamos. Por eso en FullFragance sólo comparamos tiendas que publican sus productos en su propio sitio, y no ventas entre particulares.",
          "En marketplaces y redes sociales conviven vendedores serios con revendedores de imitaciones, y si algo sale mal es mucho más difícil reclamar.",
        ],
      },
      {
        heading: "Desconfía de un precio fuera de rango",
        paragraphs: [
          "Si el mismo perfume, del mismo tamaño, cuesta en casi todas las tiendas entre $60.000 y $80.000, uno a $15.000 merece una pregunta. Puede ser una liquidación real, un error de la tienda o una imitación.",
          "Comparar sirve justamente para eso: ver el rango normal antes de comprar. Cuando una tienda publica un precio absurdamente bajo frente a las demás, lo dejamos fuera de la comparación hasta que se corrija, porque casi siempre es un error de publicación.",
        ],
      },
      {
        heading: "Qué revisar en la caja y el frasco",
        paragraphs: ["Cuando ya lo tienes en la mano, fíjate en los detalles:"],
        list: [
          "El código de lote (batch code): suele venir grabado o impreso en la base de la caja y del frasco, y ambos deberían coincidir.",
          "La impresión de la caja: letras nítidas, sin faltas de ortografía y con la información del fabricante y el importador.",
          "El atomizador y la tapa: en los originales calzan firme y el spray sale como una nube fina y pareja.",
          "El líquido: color y transparencia parejos, sin partículas en suspensión.",
        ],
      },
      {
        heading: "Testers, sets y decants",
        paragraphs: [
          "Un tester es un perfume original que la marca entrega a las tiendas para que el público lo pruebe. Suele venir en caja blanca o sin tapa y cuesta menos; comprar uno en una tienda confiable no tiene nada de malo, pero no es lo mismo que el producto de venta.",
          "Un decant es una parte de un perfume original trasvasijada a un frasco pequeño. Sirve para probar antes de comprar el frasco completo, pero depende totalmente de la confianza en quien lo prepara.",
          "En el comparador mantenemos testers, sets y decants separados del frasco normal, para que el precio que ves sea comparable.",
        ],
        rail: {
          title: "Testers que hoy se venden en varias tiendas",
          params: { q: "tester", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=tester&sort=stores",
        },
      },
    ],
  },
  {
    slug: "perfumes-para-el-verano",
    title: "Perfumes para el verano: qué familias olfativas funcionan con calor",
    description:
      "Qué tipo de perfume conviene con calor, por qué los cítricos y acuáticos son tan populares en verano y cómo comparar precios de los clásicos de la temporada.",
    published: "2026-10-07",
    authors: GUIDE_AUTHORS,
    intro:
      "Con el calor los perfumes se comportan distinto: la piel tibia los proyecta más y los aromas dulces o muy densos pueden volverse pesados. Por eso, cuando se acerca el verano, las búsquedas se mueven hacia fragancias frescas. Aquí explicamos qué buscar y mostramos los clásicos de la temporada que hoy se pueden comparar entre tiendas.",
    sections: [
      {
        heading: "Familias que funcionan con calor",
        paragraphs: ["Estas son las familias olfativas que más se usan en verano:"],
        list: [
          "Cítricas: limón, bergamota, mandarina o pomelo. Son luminosas y limpias, aunque se evaporan rápido.",
          "Acuáticas o marinas: evocan agua, sal y brisa. Fueron muy populares desde los años noventa y siguen siéndolo.",
          "Aromáticas: lavanda, menta, romero o albahaca. Frescas y versátiles, muy comunes en perfumería masculina.",
          "Florales ligeras: flores blancas o verdes en versiones suaves, sin bases muy dulces.",
        ],
      },
      {
        heading: "Concentración y forma de uso",
        paragraphs: [
          "En verano muchas personas prefieren una Eau de Toilette o una colonia: se sienten más ligeras y se pueden volver a aplicar durante el día. Una Eau de Parfum también sirve, pero conviene usar menos atomizaciones.",
          "Aplica el perfume sobre la piel hidratada y evita dejar el frasco al sol o en el auto: el calor y la luz degradan la fragancia.",
        ],
        rail: {
          title: "Light Blue: precios entre tiendas",
          params: { q: "light blue", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=light%20blue&sort=stores",
        },
      },
      {
        heading: "Los clásicos frescos que más se repiten",
        paragraphs: [
          "Algunas fragancias frescas llevan décadas vendiéndose y están en casi todas las tiendas, lo que las hace fáciles de comparar: Acqua di Giò de Giorgio Armani, Light Blue de Dolce & Gabbana, Cool Water de Davidoff o CK One de Calvin Klein, entre otras.",
          "Ojo con las líneas: Acqua di Giò y Acqua di Gioia son perfumes distintos, y cada uno tiene versiones (Profondo, Parfum, Intense) que no huelen igual. Revisa el nombre completo en la ficha antes de comparar.",
        ],
        rail: {
          title: "Acqua di Giò y su familia en el comparador",
          params: { q: "acqua di gio", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=acqua%20di%20gio&sort=stores",
        },
      },
    ],
  },
  {
    slug: "perfumes-de-nicho-en-chile",
    title: "Perfumes de nicho en Chile: qué son y cómo comparar sus precios",
    description:
      "Qué diferencia a un perfume de nicho de uno de diseñador, qué casas de nicho se venden en Chile y por qué conviene comparar antes de comprar uno.",
    published: "2026-10-07",
    authors: GUIDE_AUTHORS,
    intro:
      "Los perfumes de nicho son los más caros del catálogo y también los que menos tiendas venden. Esa combinación hace que una diferencia de precio entre tiendas pueda significar decenas de miles de pesos. Esta guía explica qué son y cómo encontrarlos en el comparador.",
    sections: [
      {
        heading: "Nicho, diseñador y árabe",
        paragraphs: [
          "Un perfume de diseñador es el que lanza una casa de moda o una gran marca (Dior, Carolina Herrera, Versace) y se vende en multitiendas de todo el mundo. Un perfume de nicho viene de una casa dedicada principalmente a la perfumería, con producción y distribución más acotadas: Creed, Xerjoff, Parfums de Marly, Mancera, Montale, Initio o Nishane, entre otras.",
          "En el comparador separamos el catálogo en tres segmentos (diseñador, nicho y árabe) según la marca, para que puedas explorar cada uno por separado.",
        ],
      },
      {
        heading: "Por qué cuestan más",
        paragraphs: [
          "El precio de un nicho no se explica sólo por los ingredientes: influyen las tiradas más pequeñas, la importación, la distribución exclusiva y el posicionamiento de la marca. Por lo mismo, en Chile hay menos tiendas que los venden y los precios entre ellas pueden variar bastante.",
          "Que sea más caro no significa que sea mejor para ti. Probar antes de comprar (en tienda o con un decant de confianza) es especialmente recomendable en este segmento.",
        ],
        rail: {
          title: "Perfumes de nicho que hoy se comparan en varias tiendas",
          params: { segment: "niche", comparison: "multiple", sort: "stores" },
          href: "/dashboard?segment=niche&sort=stores",
        },
      },
      {
        heading: "Cómo comparar un nicho",
        paragraphs: ["Antes de comprar, revisa:"],
        list: [
          "El volumen exacto: muchas casas de nicho venden 50, 75, 100 o 125 ml, y la diferencia de precio por mililitro es grande.",
          "Que la tienda tenga stock real: en nicho es común que un perfume aparezca publicado pero agotado.",
          "Si es tester o frasco de venta: los testers de nicho son frecuentes y cuestan menos, pero vienen sin caja o con caja simple.",
        ],
      },
    ],
  },
  {
    slug: "perfumes-arabes-inspirados-en-disenador",
    title: "Perfumes árabes inspirados en perfumes de diseñador y nicho",
    description:
      "Qué son los perfumes árabes 'inspirados en' otros más caros, ejemplos que la comunidad compara con frecuencia y qué esperar de ellos antes de comprar.",
    published: "2026-10-07",
    authors: GUIDE_AUTHORS,
    intro:
      "Una de las razones del crecimiento de la perfumería árabe es que varias de sus fragancias recuerdan a perfumes de diseñador o de nicho mucho más caros. En foros y redes se les llama \"dupes\" o \"inspirados en\". Esta guía resume qué significa eso y qué conviene tener en cuenta.",
    sections: [
      {
        heading: "Qué significa \"inspirado en\"",
        paragraphs: [
          "Un perfume inspirado en otro busca un aroma parecido, no idéntico. Puede compartir las notas principales y aun así diferir en la salida, la duración o cómo evoluciona en la piel. Tampoco son productos de la misma marca: son creaciones independientes que se venden con su propio nombre.",
          "No hay que confundirlos con las falsificaciones, que copian el nombre, la caja y la marca de otro perfume. Un inspirado legítimo lleva siempre el nombre de su propia casa.",
        ],
      },
      {
        heading: "Comparaciones que más se repiten",
        paragraphs: [
          "Estas son algunas comparaciones frecuentes en la comunidad de perfumería. Son opiniones extendidas, no equivalencias oficiales de las marcas:",
        ],
        list: [
          "Armaf Club de Nuit Intense Man, que suele compararse con Aventus de Creed.",
          "Lattafa Khamrah, comparado a menudo con Angels' Share de Kilian.",
          "Afnan 9PM, que muchos asocian con Ultra Male de Jean Paul Gaultier.",
        ],
        rail: {
          title: "Club de Nuit: precios entre tiendas",
          params: { q: "club de nuit", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=club%20de%20nuit&sort=stores",
        },
      },
      {
        heading: "Qué esperar antes de comprar uno",
        paragraphs: [
          "La principal ventaja es el precio: muchas de estas fragancias cuestan una fracción del perfume que recuerdan. A cambio, es común que algunas notas se perciban distintas o que la versión varíe un poco entre lotes.",
          "Si te interesa uno en particular, busca su nombre exacto en el comparador: de las líneas más populares suele haber varias versiones (Intense, Elixir, ediciones limitadas) que no son lo mismo.",
        ],
        rail: {
          title: "Khamrah y sus versiones",
          params: { q: "khamrah", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=khamrah&sort=stores",
        },
      },
    ],
  },
  {
    slug: "tiendas-de-perfumes-en-chile",
    title: "Tiendas de perfumes en Chile: multitiendas, farmacias y perfumerías especializadas",
    description:
      "Diferencias entre comprar perfume en una multitienda, una farmacia o una perfumería especializada en Chile, y qué revisar en cada caso además del precio.",
    published: "2026-10-07",
    authors: GUIDE_AUTHORS,
    intro:
      "El mismo perfume se vende en lugares muy distintos: grandes multitiendas, cadenas de farmacias y perfumerías que se dedican sólo a fragancias. Cada tipo de tienda tiene ventajas y cosas a revisar. Esto es lo que vemos al comparar sus catálogos todos los días.",
    sections: [
      {
        heading: "Multitiendas",
        paragraphs: [
          "Falabella, Paris y Ripley venden sobre todo perfumes de diseñador y algunas marcas árabes. Suelen tener precios de lista más altos, pero con eventos de descuento frecuentes (Cyber, CyberDay, liquidaciones) y promociones con sus tarjetas, que no siempre aparecen en el precio publicado.",
          "Su ventaja es la logística: despacho a todo Chile, retiro en tienda y procesos de devolución conocidos.",
        ],
      },
      {
        heading: "Farmacias y cadenas de belleza",
        paragraphs: [
          "Cadenas como Preunic tienen una selección más acotada, con foco en marcas masivas y colonias. Pueden ser una buena opción para perfumes de uso diario y para comprar en una tienda física cercana.",
        ],
      },
      {
        heading: "Perfumerías especializadas",
        paragraphs: [
          "Tiendas como Silk Perfumes, Elite Perfumes, Alisha Perfumes, Cosmetic, L'Odoro, Le Paris Parfums o Dreams Parfums concentran la mayor variedad, especialmente en perfumería árabe y de nicho. Cuando revisamos el catálogo el 7 de octubre de 2026, de los 940 perfumes con stock en al menos dos tiendas, en 747 (cerca de 8 de cada 10) el precio más bajo era de una perfumería especializada. Silk Perfumes, Cosmetic y Elite Perfumes fueron las que más veces quedaron primeras.",
          "Antes de comprar revisa el costo y plazo de despacho, si el producto es tester o de venta, y la política de cambios de cada una.",
        ],
        rail: {
          title: "Perfumes que hoy están en más tiendas",
          params: { comparison: "multiple", sort: "stores" },
          href: "/dashboard?sort=stores",
        },
      },
      {
        heading: "El precio no es todo",
        paragraphs: [
          "Al comparar, suma el despacho y considera el stock: el precio más bajo de una tienda sin stock no sirve, por eso en las fichas esas tiendas quedan al final. Y si un precio está muy por debajo del resto, revisa con calma: puede ser un error de publicación.",
        ],
      },
    ],
  },
];

export function guideBySlug(slug: string) {
  return GUIDES.find(guide => guide.slug === slug) ?? null;
}
