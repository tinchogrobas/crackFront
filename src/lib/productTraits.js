/**
 * Idioma, acabado y particularidades de un producto (campos `language`,
 * `finish`, `altered`, `signed`, `stamped` y `freshly_opened` de la API).
 *
 * Mismas etiquetas que el backend (apps/catalog/finishes.py y
 * Product.ATTRIBUTES), así la tienda dice lo mismo que el admin.
 */

// La bandera de portugués es la de Brasil: de ahí salen las cartas en portugués.
export const LANGUAGES = {
  en: { label: 'Inglés', flag: '/flags/flag-en.svg' },
  es: { label: 'Español', flag: '/flags/flag-es.svg' },
  pt: { label: 'Portugués', flag: '/flags/flag-br.svg' },
  ja: { label: 'Japonés', flag: '/flags/flag-jp.svg' },
  zh: { label: 'Chino', flag: '/flags/flag-cn.svg' },
};

/** El idioma de la carta: el del producto o, en uno viejo, el de su set. */
export const languageOf = (product) => {
  const code = product?.language || product?.catalog?.language || '';
  return LANGUAGES[code] ? { code, ...LANGUAGES[code] } : null;
};

// Acabado tal como lo publica TCGplayer ("Reverse Holofoil") → cómo se conoce.
const FINISH_LABELS = {
  Normal: 'Normal',
  Holofoil: 'Holo',
  'Reverse Holofoil': 'Reverse Holo',
  Unlimited: 'Unlimited',
  'Unlimited Holofoil': 'Unlimited Holo',
  '1st Edition': '1st Edition',
  '1st Edition Holofoil': '1st Edition Holo',
  Foil: 'Foil',
  'Cold Foil': 'Cold Foil',
};

export const finishLabel = (finish) => (finish ? FINISH_LABELS[finish] || finish : '');

// Las impresiones "de base" de una carta: es lo que el comprador espera por
// defecto y no hace falta destacarlas. Lo demás (Reverse Holo, 1st Edition,
// Foil...) es una variante que vale distinto y se señala.
const BASE_FINISHES = new Set(['', 'Normal', 'Holofoil', 'Unlimited', 'Unlimited Holofoil']);

/** Si el acabado merece una insignia (una variante especial). */
export const isSpecialFinish = (finish) => !BASE_FINISHES.has(finish || '');

/** Si el acabado aporta algo en la ficha técnica ("Normal" no dice nada). */
export const isInformativeFinish = (finish) => !!finish && finish !== 'Normal';

// Particularidades de la unidad, en el orden en que se muestran.
export const ATTRIBUTES = [
  ['altered', 'Alterada'],
  ['signed', 'Firmada'],
  ['stamped', 'Estampada'],
  ['freshly_opened', 'Recién abierta'],
];

/** Las particularidades marcadas de un producto, como etiquetas. */
export const attributesOf = (product) =>
  ATTRIBUTES.filter(([field]) => product?.[field]).map(([, label]) => label);

// Filtros de la tienda. El acabado se filtra por insignia (como en el admin):
// "1st Edition" cubre la normal y la holo.
export const FINISH_FILTERS = [
  { value: 'reverse', label: 'Reverse Holo' },
  { value: '1st', label: '1st Edition' },
  { value: 'holo', label: 'Holo' },
  { value: 'foil', label: 'Foil' },
  { value: 'unlimited', label: 'Unlimited' },
];
