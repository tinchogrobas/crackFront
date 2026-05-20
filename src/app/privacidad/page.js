'use client';
import { motion } from 'framer-motion';

const LAST_UPDATED = '19 de abril de 2026';

const sections = [
  {
    id: 'responsable',
    title: '1. Responsable del tratamiento',
    body: [
      'El responsable del tratamiento de los datos personales recolectados a través de cracktcg.com es CRACK® TCG, con domicilio en Deheza 2921, PB, Saavedra, Ciudad Autónoma de Buenos Aires, República Argentina.',
      'Para consultas sobre privacidad podés escribirnos a cracktcg@gmail.com',
    ],
  },
  {
    id: 'datos',
    title: '2. Qué datos recolectamos',
    body: [
      'Datos de identificación y contacto: nombre y apellido, email, teléfono, DNI o CUIT cuando aplique para facturación.',
      'Datos de envío: domicilio, código postal, localidad, provincia e instrucciones de entrega.',
      'Datos de compra: productos, historial de pedidos, cupones aplicados y monto.',
      'Datos de pago: los datos de tarjeta o medio de pago se procesan directamente en la pasarela (Mercado Pago u otras); CRACK sólo recibe un token o identificador de transacción, sin datos sensibles completos.',
      'Datos técnicos: dirección IP, tipo de navegador, sistema operativo, páginas visitadas, referrer y eventos de navegación a través de cookies y herramientas analíticas.',
    ],
  },
  {
    id: 'finalidad',
    title: '3. Para qué los usamos',
    body: [
      'Procesar pedidos, emitir comprobantes y coordinar envíos con operadores logísticos.',
      'Brindar soporte, responder consultas y gestionar cambios o devoluciones.',
      'Enviar comunicaciones transaccionales (confirmaciones, estado del envío) y, si prestaste consentimiento, novedades y promociones. Podés darte de baja en cualquier momento desde el link de desuscripción.',
      'Prevenir fraude, uso indebido del Sitio y cumplir obligaciones legales, contables e impositivas.',
      'Mejorar la experiencia del Sitio mediante analítica agregada y tests de usabilidad.',
    ],
  },
  {
    id: 'base-legal',
    title: '4. Base legal',
    body: [
      'El tratamiento se funda en la ejecución de la relación comercial solicitada por el Usuario (compra), el consentimiento prestado al registrarse o suscribirse al newsletter, el cumplimiento de obligaciones legales (facturación, AFIP) y el interés legítimo en prevenir fraude y mejorar el servicio.',
      'Todo conforme a la Ley 25.326 de Protección de los Datos Personales de la República Argentina y sus normas reglamentarias.',
    ],
  },
  {
    id: 'destinatarios',
    title: '5. Con quién los compartimos',
    body: [
      'Pasarelas de pago (Mercado Pago u otras habilitadas) para procesar cobros.',
      'Operadores logísticos (Correo Argentino, Andreani u otros) para la entrega del pedido.',
      'Proveedores de infraestructura, email transaccional y analítica (por ejemplo Vercel, Google Analytics), que actúan como encargados del tratamiento bajo instrucciones nuestras.',
      'Autoridades competentes cuando exista requerimiento legal debidamente fundado.',
      'No vendemos ni alquilamos bases de datos personales a terceros con fines comerciales.',
    ],
  },
  {
    id: 'cookies',
    title: '6. Cookies y tecnologías similares',
    body: [
      'Usamos cookies propias y de terceros con distintas finalidades:',
      '— Esenciales: mantener la sesión, el carrito y preferencias básicas. No pueden desactivarse sin afectar el funcionamiento del Sitio.',
      '— Analíticas: entender cómo se navega para mejorar la experiencia (por ejemplo Google Analytics, de manera agregada).',
      '— De marketing: medir el rendimiento de campañas y recordar preferencias promocionales.',
      'Podés configurar tu navegador para bloquear o eliminar cookies. Algunas funciones pueden verse limitadas si las desactivás.',
    ],
  },
  {
    id: 'conservacion',
    title: '7. Por cuánto tiempo los conservamos',
    body: [
      'Conservamos los datos el tiempo necesario para cumplir con la finalidad para la que fueron recolectados y con las obligaciones legales aplicables (por ejemplo, 10 años para documentación comercial y contable conforme normas argentinas).',
      'Transcurridos esos plazos, los datos se eliminan o anonimizan.',
    ],
  },
  {
    id: 'derechos',
    title: '8. Tus derechos (ARCO)',
    body: [
      'Como titular de los datos, tenés derecho a acceder, rectificar, actualizar y suprimir tus datos personales, así como a oponerte a su tratamiento con fines de marketing. Para ejercerlos, escribinos a cracktcg@gmail.comcktcg.com acreditando tu identidad.',
      'Responderemos dentro de los plazos previstos por la Ley 25.326 (10 días para acceso; 5 días para rectificación y supresión). El ejercicio es gratuito en los intervalos que fija la normativa.',
      'La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley 25.326, tiene la atribución de atender denuncias y reclamos sobre el incumplimiento de las normas de protección de datos personales.',
    ],
  },
  {
    id: 'seguridad',
    title: '9. Seguridad',
    body: [
      'Aplicamos medidas técnicas y organizativas razonables para proteger la información, incluyendo cifrado TLS en las comunicaciones, control de acceso a sistemas y minimización de datos. Ningún sistema es 100% infalible; ante cualquier incidente que pueda afectar tus datos, actuaremos conforme a la normativa aplicable.',
    ],
  },
  {
    id: 'menores',
    title: '10. Menores de edad',
    body: [
      'El Sitio está dirigido a personas mayores de 18 años o a menores con autorización de sus padres o tutores. No recolectamos datos de menores de forma consciente; si sos tutor y detectás que un menor nos brindó datos, escribinos para eliminarlos.',
    ],
  },
  {
    id: 'internacional',
    title: '11. Transferencias internacionales',
    body: [
      'Algunos proveedores (hosting, analítica, email) pueden alojar datos fuera de Argentina. En todos los casos exigimos que los destinatarios otorguen niveles adecuados de protección, conforme a los estándares de la Ley 25.326 y disposiciones complementarias.',
    ],
  },
  {
    id: 'cambios',
    title: '12. Cambios a esta política',
    body: [
      'Podemos actualizar esta Política de Privacidad para reflejar cambios legales o operativos. La versión vigente es la publicada en esta página, con su fecha de última actualización. Cambios sustanciales se comunicarán por email o mediante aviso destacado en el Sitio.',
    ],
  },
  {
    id: 'contacto',
    title: '13. Contacto',
    body: [
      'Consultas, ejercicio de derechos ARCO o reclamos: cracktcg@gmail.comcktcg.com. Domicilio: Deheza 2921, PB, Saavedra, Ciudad Autónoma de Buenos Aires, Argentina.',
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <div className="pt-28 pb-24">
      <div className="max-w-[920px] mx-auto px-5 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[11px] tracking-[0.3em] text-[#C8972E] uppercase mb-2 font-medium">Legal</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.02em] text-[#1A1A1A] mb-3">
            Política de privacidad<span className="text-[#C8972E]">.</span>
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
            Para ejercer tus derechos ARCO: <a href="mailto:cracktcg@gmail.comcktcg.com" className="text-[#C8972E] hover:underline">cracktcg@gmail.comcktcg.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
