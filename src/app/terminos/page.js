'use client';
import { motion } from 'framer-motion';

const LAST_UPDATED = '19 de abril de 2026';

const sections = [
  {
    id: 'introduccion',
    title: '1. Introducción',
    body: [
      'Estos Términos y Condiciones regulan el acceso y uso del sitio cracktcg.com (el "Sitio") y la compra de productos ofrecidos por CRACK® TCG ("CRACK", "nosotros"), con domicilio en Deheza 2921, PB, Saavedra, Ciudad Autónoma de Buenos Aires, República Argentina.',
      'Al navegar o realizar una compra en el Sitio, el usuario ("vos", "el Usuario") acepta estos Términos. Si no estás de acuerdo con alguna cláusula, por favor no utilices el Sitio.',
    ],
  },
  {
    id: 'productos',
    title: '2. Productos y disponibilidad',
    body: [
      'CRACK comercializa cartas de Pokémon TCG individuales (singles), cartas calificadas (slabs), productos sellados, accesorios y mystery packs. Las imágenes y descripciones son ilustrativas; pueden existir variaciones menores de centrado, brillo o estado dentro de la condición declarada.',
      'La condición de cada carta (Mint, Near Mint, Lightly Played, etc.) se informa en la ficha del producto siguiendo los estándares usuales del mercado TCG. Slabs calificados conservan la calificación original de la casa certificadora correspondiente.',
      'La disponibilidad de stock se actualiza en tiempo real; sin embargo, ante un error de sistema o agotamiento simultáneo, CRACK podrá cancelar el pedido y reintegrar el 100% del importe pagado.',
    ],
  },
  {
    id: 'precios',
    title: '3. Precios y pagos',
    body: [
      'Todos los precios están expresados en Pesos Argentinos (ARS) e incluyen IVA cuando corresponda. CRACK puede modificar los precios sin previo aviso; el precio aplicable a una compra es el vigente al momento de confirmarla.',
      'Los pagos se procesan a través de pasarelas externas habilitadas (Mercado Pago u otras). CRACK no almacena datos completos de tarjetas de crédito o débito. El pedido se considera confirmado una vez acreditado el pago.',
      'Los cupones de descuento (por ejemplo CRACK15) son de uso personal, no acumulables con otras promociones salvo aclaración expresa, y pueden discontinuarse en cualquier momento.',
    ],
  },
  {
    id: 'envios',
    title: '4. Envíos',
    body: [
      'Realizamos envíos a todo el país a través de Correo Argentino, Andreani u otros operadores logísticos. El costo y plazo se calculan según el código postal de destino y se informan antes de confirmar la compra.',
      'Los plazos estimados de despacho van de 24 a 72 horas hábiles desde la acreditación del pago. Los tiempos de tránsito dependen del transportista y del destino; no somos responsables por demoras ajenas al despacho.',
      'Todos los envíos incluyen empaque protectivo (toploader + team bag o equivalente según el producto). Se recomienda revisar el paquete al recibirlo y reportar cualquier daño dentro de las 48 horas.',
    ],
  },
  {
    id: 'cambios',
    title: '5. Cambios, devoluciones y arrepentimiento',
    body: [
      'Conforme al artículo 34 de la Ley 24.240 de Defensa del Consumidor, el Usuario dispone de 10 (diez) días corridos desde la recepción del producto para ejercer el derecho de arrepentimiento, siempre que el producto se devuelva en su estado original y empaque.',
      'Quedan excluidos del derecho de arrepentimiento los productos sellados o blisters originales cuya integridad haya sido violada, y los sobres/mystery packs una vez abiertos, dado que su valor depende del contenido no revelado.',
      'Si recibiste un producto con defecto o que no coincide con la descripción, escribinos a cracktcg@gmail.com dentro de las 72 horas de recibido para coordinar la devolución o reemplazo. Los costos de envío del retorno en casos de error nuestro corren por cuenta de CRACK.',
    ],
  },
  {
    id: 'autenticidad',
    title: '6. Autenticidad de las cartas',
    body: [
      'Garantizamos que todas las cartas comercializadas son originales y auténticas. En el caso de slabs calificados, respetamos la condición y el grado asignado por la casa certificadora; CRACK no re-califica ni abre slabs.',
      'Si comprás una carta y tenés dudas sobre su autenticidad, contactanos dentro de los 10 días de recibida; realizaremos la verificación correspondiente y, de confirmarse cualquier anomalía, se reintegrará el 100% del importe abonado.',
    ],
  },
  {
    id: 'propiedad',
    title: '7. Propiedad intelectual',
    body: [
      '"CRACK" y su identidad visual son marcas del titular. Las marcas "Pokémon", "Pokémon TCG" y los personajes asociados son propiedad de The Pokémon Company, Nintendo, Game Freak y Creatures Inc. CRACK TCG no está afiliado, patrocinado ni avalado por dichas compañías; operamos como tienda independiente de productos originales.',
      'El contenido del Sitio (textos, fotografías propias, diseño) está protegido por las leyes de propiedad intelectual argentinas e internacionales. Queda prohibida su reproducción sin autorización previa.',
    ],
  },
  {
    id: 'cuenta',
    title: '8. Cuenta y uso del Sitio',
    body: [
      'El Usuario es responsable de la veracidad de los datos que provee y del uso de sus credenciales. CRACK puede suspender o cancelar cuentas que incurran en fraude, reventa masiva desleal, scraping automatizado o cualquier uso contrario a estos Términos.',
      'Está prohibido interferir con la seguridad del Sitio, realizar ingeniería inversa o utilizar bots para adquirir productos de edición limitada en detrimento de otros usuarios.',
    ],
  },
  {
    id: 'responsabilidad',
    title: '9. Limitación de responsabilidad',
    body: [
      'CRACK no será responsable por daños indirectos, lucro cesante o pérdida de oportunidad derivados del uso del Sitio, más allá de lo expresamente exigido por la Ley 24.240 y demás normas de orden público.',
      'No garantizamos disponibilidad ininterrumpida del Sitio; podemos realizar tareas de mantenimiento o mejoras sin previo aviso.',
    ],
  },
  {
    id: 'ley',
    title: '10. Ley aplicable y jurisdicción',
    body: [
      'Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier controversia serán competentes los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, sin perjuicio de las vías administrativas ante la Dirección Nacional de Defensa del Consumidor que asisten al consumidor.',
    ],
  },
  {
    id: 'modificaciones',
    title: '11. Modificaciones',
    body: [
      'CRACK puede actualizar estos Términos en cualquier momento. La versión vigente será siempre la publicada en esta página, con su fecha de última actualización. Las compras ya confirmadas se rigen por los Términos vigentes al momento de la operación.',
    ],
  },
  {
    id: 'contacto',
    title: '12. Contacto',
    body: [
      'Para cualquier consulta sobre estos Términos, escribinos a cracktcg@gmail.comcktcg.com o desde la página de Contacto. También podés acercarte a nuestro domicilio en Deheza 2921, PB, Saavedra, Ciudad Autónoma de Buenos Aires.',
    ],
  },
];

export default function TerminosPage() {
  return (
    <div className="pt-28 pb-24">
      <div className="max-w-[920px] mx-auto px-5 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase mb-2 font-medium">Legal</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.02em] text-[#1A1A1A] mb-3">
            Términos y condiciones<span className="text-[#C8972E]">.</span>
          </h1>
          <p className="text-[12px] text-[#6B6560]/60 mb-12">Última actualización: {LAST_UPDATED}</p>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          aria-label="Índice"
          className="bg-[#F5F1EA] border border-[#E8E4DD] px-5 py-5 mb-12"
        >
          <p className="text-[11px] tracking-[0.2em] text-[#C8972E]/70 uppercase font-medium mb-3">Índice</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[13px] text-[#6B6560] hover:text-[#1A1A1A] transition-colors">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </motion.nav>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="space-y-12"
        >
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1A1A1A] mb-4 tracking-[-0.01em]">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.body.map((p, i) => (
                  <p key={i} className="text-[14px] leading-[1.75] text-[#6B6560]">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </motion.div>

        <div className="mt-16 pt-8 border-t border-[#E8E4DD]">
          <p className="text-[12px] text-[#6B6560]/60">
            Para consultas legales o de consumidor: <a href="mailto:cracktcg@gmail.comcktcg.com" className="text-[#C8972E] hover:underline">cracktcg@gmail.comcktcg.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
