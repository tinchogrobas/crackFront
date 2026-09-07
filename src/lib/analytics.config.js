/**
 * Configuración de medición: IDs de tags y bootstrap de Consent Mode v2.
 *
 * Todo es opcional y se activa solo si existe la env var. Un deploy sin
 * ninguna configurada no carga un solo byte de script de terceros: la capa de
 * eventos igual empuja al `dataLayer`, así que si mañana enchufás GTM ya tenés
 * todo el ecommerce trackeado sin tocar componentes.
 *
 * Las `NEXT_PUBLIC_*` se leen de forma literal a propósito: Next las inlinea en
 * build time solo si aparecen escritas completas, no vía índice dinámico.
 */

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || '';
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '';
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

/**
 * Labels de conversión de Google Ads. Se sacan de
 * Google Ads → Objetivos → Conversiones → (acción) → Configurar con etiqueta.
 * El formato del `send_to` es `AW-123456789/AbC-D_efGh12345`.
 */
export const ADS_LABELS = {
  purchase: process.env.NEXT_PUBLIC_ADS_LABEL_PURCHASE || '',
  begin_checkout: process.env.NEXT_PUBLIC_ADS_LABEL_BEGIN_CHECKOUT || '',
  add_to_cart: process.env.NEXT_PUBLIC_ADS_LABEL_ADD_TO_CART || '',
  lead: process.env.NEXT_PUBLIC_ADS_LABEL_LEAD || '',
};

/** Envío de eventos server-side a la Conversions API de Meta (route handler propio). */
export const CAPI_ENABLED = process.env.NEXT_PUBLIC_META_CAPI_ENABLED === 'true';

/** El banner de cookies se puede apagar sin desarmar Consent Mode. */
export const CONSENT_BANNER_ENABLED = process.env.NEXT_PUBLIC_CONSENT_BANNER !== 'false';

export const CONSENT_STORAGE_KEY = 'crack-consent-v2';

export const ANALYTICS_ENABLED = Boolean(GTM_ID || GA4_ID || GOOGLE_ADS_ID || META_PIXEL_ID);

/**
 * Países donde el consentimiento tiene que ser opt-in explícito (EEE + UK + CH).
 * Fuera de esta lista —Argentina incluida— los defaults arrancan en `granted`:
 * la Ley 25.326 no exige opt-in previo para analítica propia, y arrancar en
 * `denied` acá significaría perder la atribución de la mayoría del tráfico.
 */
const EEA_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL',
  'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH',
];

/**
 * Script inline que corre ANTES de cualquier tag.
 *
 * Consent Mode v2 exige que los defaults se declaren antes de que se cargue
 * gtag/GTM; si llegan después, Google ya mandó el primer hit sin señal de
 * consentimiento y el modelado de conversiones no aplica. Por eso esto se
 * inyecta directo en el <head> del layout y no vía next/script.
 */
export function consentBootstrapScript() {
  return `
(function () {
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    region: ${JSON.stringify(EEA_REGIONS)},
    wait_for_update: 500
  });

  gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });

  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);

  try {
    var stored = window.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)});
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed && parsed.state) gtag('consent', 'update', parsed.state);
    }
  } catch (e) {}
})();`.trim();
}
