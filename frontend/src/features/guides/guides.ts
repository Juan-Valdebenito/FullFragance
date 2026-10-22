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
  {
    slug: "notas-olfativas-salida-corazon-fondo",
    title: "Notas olfativas: cómo entender la salida, el corazón y el fondo de un perfume",
    description:
      "Cómo leer la pirámide olfativa de un perfume, por qué el aroma cambia con las horas y qué información aportan realmente sus notas y familias.",
    published: "2026-10-22",
    authors: GUIDE_AUTHORS,
    intro:
      "La ficha de un perfume puede enumerar bergamota, jazmín, vainilla y madera, pero esa lista no significa que todos esos aromas se perciban al mismo tiempo. Las notas son una forma de describir cómo evoluciona una fragancia; sirven para orientarse, aunque no reemplazan probarla sobre la piel. Entender esa estructura ayuda a comparar perfumes con más criterio y a evitar compras basadas sólo en un ingrediente atractivo.",
    sections: [
      {
        heading: "La pirámide olfativa no es una receta",
        paragraphs: [
          "Las marcas suelen ordenar las notas en tres niveles: salida, corazón y fondo. Es una representación sencilla de la evaporación y de la impresión que deja el perfume en distintos momentos. No indica la cantidad exacta de cada materia prima ni permite reconstruir la fórmula.",
          "Además, una nota declarada no siempre corresponde a un ingrediente natural. El perfumista puede construir la idea de manzana, cuero, brisa marina o algodón limpio combinando varias moléculas. Conviene leer la pirámide como un mapa descriptivo y no como una lista literal de ingredientes.",
        ],
      },
      {
        heading: "Salida: la primera impresión",
        paragraphs: [
          "La salida aparece apenas se atomiza el perfume. Suele incluir materiales volátiles como cítricos, hierbas aromáticas o acordes frescos. Es la etapa más brillante, pero también la más breve; por eso decidir en los primeros segundos puede llevar a una impresión incompleta.",
          "Al probar en tienda, espera a que se evapore el alcohol y deja pasar al menos varios minutos antes de evaluar. Una tira de papel ayuda a comparar varias opciones, pero la piel permite observar cómo se desarrolla la fragancia en condiciones de uso real.",
        ],
        rail: {
          title: "Fragancias cítricas para explorar",
          params: { q: "citrus", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=citrus&sort=stores",
        },
      },
      {
        heading: "Corazón: el carácter principal",
        paragraphs: [
          "Cuando baja la salida aparece el corazón, que suele definir el tema reconocible del perfume. Aquí son comunes flores, especias, frutas y acordes aromáticos. Esta etapa puede sentirse durante varias horas y conecta la apertura con los materiales más persistentes del fondo.",
          "Dos perfumes con una salida cítrica parecida pueden tomar caminos completamente distintos: uno puede volverse floral y limpio, mientras otro se hace especiado o dulce. Por eso buscar sólo por la primera nota rara vez basta para encontrar una alternativa similar.",
        ],
      },
      {
        heading: "Fondo: lo que queda en la piel y la ropa",
        paragraphs: [
          "El fondo reúne los acordes menos volátiles. Maderas, resinas, almizcles, vainilla, ámbar y cuero aparecen con frecuencia en esta etapa. No necesariamente son intensos, pero suelen permanecer cuando la salida y buena parte del corazón ya se disiparon.",
          "La impresión final se conoce a veces como secado o drydown. Probarlo es importante, porque un perfume que encanta al comienzo puede terminar demasiado dulce o seco para tu gusto, y uno de salida discreta puede desarrollar un fondo mucho más interesante.",
        ],
        rail: {
          title: "Perfumes con vainilla en el catálogo",
          params: { q: "vanilla", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=vanilla&sort=stores",
        },
      },
      {
        heading: "Cómo usar las notas para elegir",
        paragraphs: [
          "Empieza por recordar perfumes que ya te gustan y busca patrones amplios: familias frescas, florales, amaderadas, ambaradas o gourmand. Después usa las notas para acotar, no para asumir que dos fragancias olerán igual. La posición de una nota, los materiales que la acompañan y la intensidad cambian por completo el resultado.",
          "Si compras sin probar, revisa más de una descripción y confirma la versión exacta. Una línea puede tener EDT, EDP, Parfum y ediciones Intense con pirámides diferentes. Comparar nombre completo, concentración y volumen sigue siendo tan importante como leer sus notas.",
        ],
      },
    ],
  },
  {
    slug: "cuanto-dura-un-perfume-y-como-aplicarlo",
    title: "Cuánto dura un perfume y cómo aplicarlo sin desperdiciarlo",
    description:
      "Qué factores cambian la duración y la proyección de una fragancia, cómo aplicarla y por qué más atomizaciones no siempre producen un mejor resultado.",
    published: "2026-10-22",
    authors: GUIDE_AUTHORS,
    intro:
      "La duración de un perfume no se puede resumir en una cifra universal. La misma fragancia cambia según la piel, el clima, la cantidad aplicada e incluso la atención de quien la usa. Antes de concluir que un perfume dura poco —o de aplicar el doble— conviene separar duración, proyección y percepción.",
    sections: [
      {
        heading: "Duración, proyección y estela son cosas distintas",
        paragraphs: [
          "La duración es el tiempo durante el cual todavía puedes percibir la fragancia. La proyección describe qué tan lejos se siente alrededor del cuerpo, mientras que la estela es el rastro que deja al moverte. Un perfume puede durar muchas horas muy cerca de la piel y proyectar con fuerza sólo durante la primera parte.",
          "También existe la fatiga olfativa: después de exponerse de manera continua a un olor, el cerebro puede dejar de registrarlo aunque otras personas todavía lo perciban. Antes de reaplicar, aléjate un momento del ambiente o pregunta a alguien de confianza; acercar la nariz repetidamente al punto de aplicación no siempre ayuda.",
        ],
      },
      {
        heading: "Qué hace que dure más o menos",
        paragraphs: [
          "La concentración influye, pero no actúa sola. Los cítricos y algunos acordes frescos suelen evaporarse antes que maderas, resinas o notas ambaradas. La fórmula concreta importa más que la sigla del frasco: una EDT bien construida puede sentirse durante más tiempo que una EDP ligera.",
          "El calor aumenta la evaporación y puede hacer que el perfume proyecte más al comienzo, pero se consuma antes. En una piel seca también tiende a desaparecer con mayor rapidez. Aplicarlo sobre piel limpia e hidratada, sin frotar, ofrece una base más uniforme.",
        ],
        rail: {
          title: "Eau de Parfum para comparar",
          params: { q: "edp", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=edp&sort=stores",
        },
      },
      {
        heading: "Dónde y cómo aplicarlo",
        paragraphs: [
          "Cuello, pecho y antebrazos son zonas habituales porque quedan relativamente expuestas y permiten que el aroma se mueva. No es necesario cubrir todos los puntos de pulso. Empieza con pocas atomizaciones, observa el resultado durante un día completo y ajusta en el siguiente uso.",
          "Evita frotar las muñecas: no destruye mágicamente el perfume, pero mezcla el líquido con más rapidez, genera calor y altera la forma en que percibes la salida. Déjalo secar por sí solo. Tampoco rocíes cerca de los ojos ni sobre piel irritada.",
        ],
        list: [
          "Para oficina o espacios cerrados, usa una aplicación moderada y considera la cercanía de otras personas.",
          "Para reaplicar, lleva un atomizador pequeño bien cerrado en vez del frasco completo.",
          "En ropa puede durar más, pero prueba primero en una zona oculta: algunos líquidos manchan telas claras o delicadas.",
        ],
      },
      {
        heading: "Cómo evaluar el rendimiento de forma justa",
        paragraphs: [
          "Prueba el perfume varios días, con la misma cantidad, y anota cuándo deja de proyectar y cuándo desaparece por completo. No compares una prueba al aire libre con otra en una habitación climatizada: la temperatura, el viento y la actividad física cambian mucho la percepción.",
          "Una muestra o un decant confiable permite hacer esa evaluación antes de pagar un frasco grande. Si una fragancia te obliga a usar mucha cantidad para disfrutarla, incorpora ese consumo a la comparación; el frasco más barato no siempre resulta el más conveniente por uso.",
        ],
      },
      {
        heading: "Cuándo conviene reaplicar",
        paragraphs: [
          "Reaplicar tiene sentido cuando la fragancia quedó muy cerca de la piel y aún quieres que se perciba, no apenas dejas de notarla tú. Una aplicación ligera a mitad del día suele ser más controlable que una dosis excesiva por la mañana.",
          "No hay un número correcto de atomizaciones para todos los perfumes. El atomizador, la concentración, la fórmula y el contexto cambian. La regla útil es empezar con menos, observar cómo se comporta y respetar el espacio compartido.",
        ],
      },
    ],
  },
  {
    slug: "como-elegir-un-perfume-para-regalo",
    title: "Cómo elegir un perfume para regalo sin adivinar a ciegas",
    description:
      "Una guía práctica para regalar perfume: qué averiguar, cómo reducir el riesgo, cuándo elegir un set o un tamaño pequeño y qué revisar antes de pagar.",
    published: "2026-10-22",
    authors: GUIDE_AUTHORS,
    intro:
      "Regalar un perfume puede sentirse muy personal, pero justamente por eso es fácil equivocarse. La edad o el género dicen bastante menos que los aromas que la persona ya usa, su rutina y la intensidad que tolera. Con unas pocas pistas se puede pasar de una apuesta al azar a una elección razonada.",
    sections: [
      {
        heading: "La mejor pista está en su propio estante",
        paragraphs: [
          "Si puedes, averigua el nombre completo de uno o dos perfumes que la persona use de verdad. Una foto del frasco es mejor que recordar sólo la marca: líneas famosas suelen tener varias concentraciones, tamaños y ediciones con nombres casi idénticos.",
          "Observa también cuándo los usa. Un perfume liviano de todos los días cumple una función distinta de uno intenso reservado para salir de noche. Regalar algo para el mismo uso es más seguro; elegir un contraste puede ser interesante, pero implica más riesgo.",
        ],
      },
      {
        heading: "Busca patrones, no una copia exacta",
        paragraphs: [
          "Con los nombres de referencia, revisa sus familias y notas dominantes. Si ambos son frescos y cítricos, una fragancia muy dulce y resinosa probablemente quede lejos de sus hábitos. Si repite vainilla, flores blancas o maderas, ese patrón ofrece un punto de partida.",
          "No hace falta buscar un clon. Una opción de la misma familia, con intensidad y ocasión parecidas, puede sentirse familiar sin repetir lo que ya tiene. Cuando no hay ninguna pista, una tarjeta de regalo o una salida para probar juntos es más honesta que elegir por popularidad.",
        ],
      },
      {
        heading: "Tamaño, concentración y presentación",
        paragraphs: [
          "Un frasco de 30 o 50 ml reduce el compromiso y permite variar; uno de 100 ml tiene sentido cuando ya sabes que la persona disfruta esa fragancia. No asumas que el envase grande siempre es el mejor regalo: también ocupa más espacio y tarda años en terminarse si forma parte de una colección.",
          "Confirma si la publicación corresponde a EDT, EDP o Parfum. Los sets pueden verse más completos y a veces incluyen crema o miniatura, pero revisa su contenido exacto. Un tester puede ser original y conveniente para uso personal, aunque su caja simple o la ausencia de tapa puede hacerlo menos apropiado como regalo formal.",
        ],
        rail: {
          title: "Sets de perfumes disponibles en varias tiendas",
          params: { q: "set", comparison: "multiple", sort: "stores" },
          href: "/dashboard?q=set&sort=stores",
        },
      },
      {
        heading: "Define el presupuesto completo",
        paragraphs: [
          "Compara el mismo producto y no sólo la marca. Al precio publicado suma despacho, envoltorio si lo necesitas y cualquier condición de la oferta. Las promociones asociadas a una tarjeta pueden cambiar el total, pero no son un descuento accesible para todas las personas.",
          "Antes de pagar revisa la fecha de entrega, especialmente si es para una ocasión concreta, y la política de cambios de la tienda. Por razones de higiene, un perfume abierto puede tener restricciones; conocerlas evita prometer un cambio que después no será posible.",
        ],
        rail: {
          title: "Perfumes presentes en más tiendas",
          params: { comparison: "multiple", sort: "stores" },
          href: "/dashboard?sort=stores",
        },
      },
      {
        heading: "Una lista breve antes de comprar",
        paragraphs: [
          "Antes de decidir, confirma estos datos. Si faltan varios, conviene mantener el regalo flexible en vez de aumentar el presupuesto para compensar la incertidumbre.",
        ],
        list: [
          "Nombre y versión exactos de al menos una fragancia que ya utiliza.",
          "Familias o notas que se repiten entre sus favoritos.",
          "Uso principal: diario, trabajo, ocasiones especiales o clima cálido.",
          "Concentración, volumen y tipo de presentación del producto publicado.",
          "Costo final, plazo de despacho y condiciones de cambio de la tienda.",
        ],
      },
    ],
  },
  {
    slug: "como-guardar-perfumes",
    title: "Cómo guardar perfumes para conservar mejor su aroma",
    description:
      "Dónde guardar los frascos, qué efecto tienen la luz y el calor, por qué el baño no es el lugar ideal y cuáles son las señales de un perfume alterado.",
    published: "2026-10-22",
    authors: GUIDE_AUTHORS,
    intro:
      "Un perfume no mejora por estar exhibido al sol. La luz, el calor y los cambios repetidos de temperatura aceleran transformaciones en su fórmula. No hace falta convertir la casa en una cava: un lugar oscuro, estable y seco suele ser suficiente para conservar bien una colección durante años.",
    sections: [
      {
        heading: "Los tres factores que conviene controlar",
        paragraphs: [
          "La luz directa es el problema más fácil de evitar. Puede alterar el color del líquido y favorecer la degradación de algunos componentes, especialmente en frascos transparentes. La caja original ofrece una protección sencilla, pero un cajón o armario cerrado también cumple esa función.",
          "El calor acelera reacciones químicas y los cambios bruscos de temperatura someten el contenido a ciclos innecesarios. La humedad afecta sobre todo la caja y las etiquetas, aunque también vuelve poco conveniente almacenar una colección en el baño.",
        ],
        list: [
          "Guárdalos lejos de ventanas, estufas y aparatos que emitan calor.",
          "Prefiere una repisa interior, un cajón o un armario con temperatura estable.",
          "Mantén cada frasco de pie para reducir el contacto continuo del líquido con el atomizador y sus sellos.",
        ],
      },
      {
        heading: "Baño, auto y refrigerador",
        paragraphs: [
          "El baño combina vapor, humedad y cambios de temperatura, de modo que no es el mejor lugar aunque el frasco quede cómodo junto al espejo. El auto es todavía más agresivo: al sol puede alcanzar temperaturas muy altas y además mueve el líquido constantemente.",
          "El refrigerador doméstico no es necesario para la mayoría de las colecciones. Introduce frío, humedad y cambios cada vez que el frasco sale para usarse. Una habitación templada y estable es una solución más simple. Si vives en una zona muy calurosa, prioriza el rincón más fresco del interior, sin luz directa.",
        ],
      },
      {
        heading: "¿Conviene conservar la caja?",
        paragraphs: [
          "La caja protege de la luz y ayuda a identificar lote, concentración y volumen. Es especialmente útil si el mueble recibe claridad durante el día o si planeas transportar el perfume. No es indispensable cuando el frasco vive dentro de un armario oscuro.",
          "Evita sacar y poner la tapa con fuerza o manipular el atomizador. Si el frasco tiene tapón, ciérralo bien después de cada uso. No trasvasijes toda la botella sin necesidad: cada transferencia aumenta la exposición al aire y el riesgo de contaminación o derrame.",
        ],
      },
      {
        heading: "Qué cambios son normales y cuáles observar",
        paragraphs: [
          "Algunos perfumes se oscurecen gradualmente, en especial los que contienen materiales asociados a vainilla. Un cambio de color por sí solo no demuestra que estén arruinados. Lo importante es compararlo con el olor y el funcionamiento del atomizador.",
          "Una salida claramente avinagrada, metálica o muy distinta de la habitual, pérdida marcada del aroma o partículas que antes no estaban pueden indicar alteración. Antes de desecharlo, prueba una pequeña cantidad en papel: a veces sólo queda residuo seco en la boquilla y el líquido interior sigue bien.",
        ],
      },
      {
        heading: "Cómo transportar una fragancia",
        paragraphs: [
          "Para el uso diario resulta más seguro llenar un atomizador de viaje que llevar el frasco grande. En un viaje, protege los envases dentro de una bolsa sellada y acolchada, y revisa las restricciones de equipaje para líquidos de la empresa de transporte.",
          "Al recibir una compra, deja que el frasco vuelva a temperatura ambiente si llegó muy frío o caliente antes de probarlo. El transporte breve no suele ser un problema; la exposición prolongada y repetida es la que conviene evitar.",
        ],
      },
    ],
  },
  {
    slug: "comparar-precio-por-ml-perfume",
    title: "Precio por ml en perfumes: cómo comparar tamaños y ofertas",
    description:
      "Cómo calcular el precio por mililitro, cuándo un frasco grande conviene de verdad y qué revisar para no comparar tamaños, concentraciones o presentaciones distintas.",
    published: "2026-10-22",
    authors: GUIDE_AUTHORS,
    intro:
      "Una oferta de $59.990 no dice mucho si no sabemos cuántos mililitros incluye. El precio por ml permite poner tamaños distintos en una misma escala, pero tampoco decide la compra por sí solo: un frasco económico que no alcanzarás a usar puede ser peor elección que uno pequeño con un costo unitario mayor.",
    sections: [
      {
        heading: "La fórmula y un ejemplo simple",
        paragraphs: [
          "Divide el precio final por el volumen del frasco. Si 50 ml cuestan $45.000, el precio unitario es $900 por ml. Si la versión de 100 ml cuesta $75.000, queda en $750 por ml. El segundo tamaño ofrece un costo unitario menor, aunque exige gastar $30.000 adicionales en ese momento.",
          "Usa el total que realmente pagarás. Si una tienda cobra despacho y otra permite retiro gratuito, agrega ese costo antes de dividir. Las cuotas cambian la forma de pago, pero no reducen el precio salvo que exista un descuento explícito.",
        ],
      },
      {
        heading: "Compara sólo versiones equivalentes",
        paragraphs: [
          "El cálculo sirve cuando los productos contienen la misma fragancia en la misma concentración. Una EDT de 100 ml no es automáticamente mejor oferta que una EDP de 50 ml porque son fórmulas diferentes. Tampoco mezcles recargas, testers, sets o splash corporales con el frasco regular.",
          "Lee el título completo y, si algo no cuadra, abre la página de la tienda. A veces la fotografía corresponde a toda una línea y el selector interno define el tamaño; otras veces el precio visible pertenece a la variante más pequeña.",
        ],
        list: [
          "Mismo nombre y edición: evita mezclar Intense, Elixir, Sport o flankers.",
          "Misma concentración: EDT con EDT, EDP con EDP y Parfum con Parfum.",
          "Misma presentación: frasco regular con frasco regular; tester y set por separado.",
          "Stock disponible y precio final aplicable a tu medio de pago.",
        ],
      },
      {
        heading: "Cuándo conviene el frasco grande",
        paragraphs: [
          "El tamaño grande tiene sentido para una fragancia que ya conoces, usas con frecuencia y puedes guardar correctamente. Su precio por ml suele ser menor y exige menos reposiciones. También puede convenir en un perfume compartido por más de una persona.",
          "No es ahorro si compras a ciegas, te cansas pronto del aroma o mantienes tantos frascos abiertos que tardarás años en terminarlo. El dinero inmovilizado y el espacio también cuentan. Para explorar, 30 o 50 ml suelen ofrecer una relación más equilibrada entre variedad y gasto total.",
        ],
        rail: {
          title: "Perfumes para comparar entre varias tiendas",
          params: { comparison: "multiple", sort: "stores" },
          href: "/dashboard?sort=stores",
        },
      },
      {
        heading: "Sets, recargas y formatos pequeños",
        paragraphs: [
          "En un set, suma sólo los mililitros de perfume si quieres compararlo con un frasco. Una crema corporal no equivale al mismo volumen de fragancia, aunque agregue valor si la usarás. En una recarga, verifica que ya tengas el frasco compatible: el envase más simple puede explicar parte de la diferencia.",
          "Las miniaturas y los decants casi siempre cuestan más por ml porque incluyen manipulación y envases adicionales. Su valor está en permitir una prueba prolongada sin asumir el costo de una botella completa, no en ganar la comparación unitaria.",
        ],
      },
      {
        heading: "Una decisión en dos pasos",
        paragraphs: [
          "Primero compara el precio total del mismo tamaño entre tiendas; esa es la forma más directa de detectar una oferta. Después, si estás eligiendo entre tamaños, calcula el precio por ml y pregúntate cuánto usarás realmente.",
          "La opción conveniente equilibra costo unitario, desembolso total y uso esperado. El número más bajo por ml es una señal útil, no una orden de comprar el frasco más grande.",
        ],
      },
    ],
  },
];

export function guideBySlug(slug: string) {
  return GUIDES.find(guide => guide.slug === slug) ?? null;
}
