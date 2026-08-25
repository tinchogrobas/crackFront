/**
 * Servicio de gradeo (certificación de cartas).
 *
 * La consulta arranca por WhatsApp con el mensaje ya escrito. El texto va
 * codificado porque lleva acentos y coma: sin encodeURIComponent, WhatsApp
 * corta el mensaje en el primer carácter que no sea ASCII.
 */

const WHATSAPP_PHONE = '541150588131';

export const GRADEOS_MESSAGE =
  'Hola CRACKTCG, estoy interesado en el servicio de certificación de mis cartas.';

export const GRADEOS_WHATSAPP_URL =
  `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}` +
  `&text=${encodeURIComponent(GRADEOS_MESSAGE)}` +
  '&type=phone_number&app_absent=0';
