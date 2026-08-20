'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Cielo animado del hero — reemplazo del video.
 *
 * Cada nube es una capa independiente: `top`/`left` en % del hero, ancho en
 * clamp() para que escale con el viewport, y una duración larga (60-120s) para
 * que el desplazamiento se lea como deriva y no como carrusel. Los delays son
 * negativos a propósito: la animación arranca ya empezada, así en el primer
 * frame el cielo aparece poblado en vez de vacío.
 *
 * `speed` es el factor de parallax de scroll (px por px scrolleado). Las nubes
 * de atrás se mueven menos que los personajes de adelante.
 */
const CLOUDS = [
  // { img, alto original (900 x h) para reservar espacio y no generar CLS }
  // Los anchos van en clamp(min, vw, max): el mínimo manda en mobile (la nube
  // ocupa casi todo el ancho y se lee), el vw manda en tablet/desktop y el
  // máximo evita que en pantallas 2K la nube tape media pantalla.
  { img: 1, h: 464, top: 58, left: 26, width: 'clamp(300px, 48vw, 700px)', duration: '64s', delay: '-28s', opacity: 0.85, speed: 0.16 },
  { img: 3, h: 350, top: 6, left: 20, width: 'clamp(260px, 42vw, 620px)', duration: '82s', delay: '-12s', opacity: 0.8, speed: 0.1 },
  { img: 5, h: 274, top: 44, left: 80, width: 'clamp(240px, 34vw, 520px)', duration: '99s', delay: '-42s', opacity: 0.6, blur: '1px', speed: 0.07 },
  { img: 6, h: 311, top: 22, left: 64, width: 'clamp(220px, 30vw, 470px)', duration: '116s', delay: '-64s', opacity: 0.5, blur: '1.5px', speed: 0.05 },
  { img: 2, h: 394, top: -12, left: 46, width: 'clamp(240px, 36vw, 560px)', duration: '92s', delay: '-6s', opacity: 0.55, blur: '1px', speed: 0.06 },
];

// Nube en primer plano: pasa por delante de los personajes y cierra la
// profundidad. Va arriba, lejos del bloque de texto.
const FRONT_CLOUDS = [
  { img: 4, h: 387, top: -18, left: 72, width: 'clamp(320px, 52vw, 760px)', duration: '52s', delay: '-34s', opacity: 0.7, speed: 0.24 },
];

export default function HeroSky() {
  const rootRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const raf = requestAnimationFrame(() => setReady(true));

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) return () => cancelAnimationFrame(raf);

    // Parallax: una sola lectura de scrollY por frame y escritura de una custom
    // property por capa. No se toca layout, así que no hay reflow.
    const nodes = Array.from(root.querySelectorAll('[data-speed]'));
    let frame = 0;
    let last = -1;

    const apply = () => {
      frame = 0;
      // Más allá del alto del hero la escena ya no se ve: se congela el valor.
      const y = Math.min(window.scrollY, root.offsetHeight);
      if (y === last) return;
      last = y;
      for (const node of nodes) {
        node.style.setProperty('--parallax-y', `${(y * Number(node.dataset.speed)).toFixed(1)}px`);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const renderCloud = (cloud, i) => (
    <div
      key={`${cloud.img}-${i}`}
      className="sky__cloud"
      data-speed={cloud.speed}
      style={{
        '--cloud-top': cloud.top,
        '--cloud-left': cloud.left,
        '--cloud-width': cloud.width,
        '--cloud-duration': cloud.duration,
        '--cloud-delay': cloud.delay,
        '--cloud-opacity': cloud.opacity,
        '--cloud-blur': cloud.blur || '0px',
      }}
    >
      <div className="sky__drift">
        <img
          src={`/home_page/cloud-${cloud.img}.webp`}
          alt=""
          width={900}
          height={cloud.h}
          loading="eager"
          fetchPriority={i === 0 ? 'high' : 'low'}
          decoding="async"
        />
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className={`sky ${ready ? 'sky--ready' : ''}`} aria-hidden="true">
      <div className="sky__layer sky__clouds">{CLOUDS.map(renderCloud)}</div>

      {/* Personajes: sólo de tablet para arriba. En mobile el hero es angosto y
          alto, cualquier figura le compite al texto — ahí queda el cielo solo.
          `loading="lazy"` no es cosmético: mientras el bloque está en
          `display:none` el browser no descarga los SVG, así el celular no paga
          por lo que no ve. */}
      <div className="sky__layer sky__characters">
        {/* Dragonite — el ancla visual: a la derecha, bien despegado de la navbar
            y del bloque de texto. */}
        <div
          className="sky__char hidden sm:block sm:right-[1%] sm:top-[19%] lg:right-[3%] lg:top-[21%] w-[clamp(190px,27vw,400px)]"
          data-speed="0.22"
          style={{ '--float-duration': '11s', '--float-delay': '-2s', '--float-amp': '12px' }}
        >
          <div className="sky__float">
            <img src="/home_page/character-3.svg" alt="" width={595} height={420} loading="lazy" decoding="async" />
          </div>
        </div>

        {/* Drifloon de frente */}
        <div
          className="sky__char hidden sm:block sm:left-[9%] sm:top-[16%] lg:left-[12%] lg:top-[15%] w-[clamp(46px,6vw,88px)]"
          data-speed="0.34"
          style={{
            '--float-duration': '7.5s',
            '--float-delay': '-3s',
            '--float-amp': '9px',
            '--sway-duration': '6.5s',
            '--sway-delay': '-1.5s',
            '--sway-amp': '5deg',
          }}
        >
          <div className="sky__float">
            <span className="sky__sway">
              <img src="/home_page/character-2.svg" alt="" width={100} height={190} loading="lazy" decoding="async" />
            </span>
          </div>
        </div>

        {/* Drifloon de perfil, un poco más cerca. Desde md: abajo de eso el hero
            no tiene ancho libre entre el logo y Dragonite. */}
        <div
          className="sky__char hidden md:block left-[28%] top-[32%] w-[clamp(70px,9vw,130px)]"
          data-speed="0.28"
          style={{
            '--float-duration': '9s',
            '--float-delay': '-5s',
            '--float-amp': '7px',
            '--sway-duration': '8s',
            '--sway-delay': '-4s',
            '--sway-amp': '3deg',
          }}
        >
          <div className="sky__float">
            <span className="sky__sway">
              <img src="/home_page/character-1.svg" alt="" width={160} height={106} loading="lazy" decoding="async" />
            </span>
          </div>
        </div>

        {/* Drifloon lejano: chico y traslúcido, sólo para dar profundidad */}
        <div
          className="sky__char hidden lg:block left-[62%] top-[60%] w-[clamp(32px,3.5vw,52px)] opacity-60"
          data-speed="0.12"
          style={{
            '--float-duration': '12s',
            '--float-delay': '-8s',
            '--float-amp': '5px',
            '--sway-duration': '10s',
            '--sway-delay': '-6s',
            '--sway-amp': '4deg',
          }}
        >
          <div className="sky__float">
            <span className="sky__sway">
              <img src="/home_page/character-2.svg" alt="" width={100} height={190} loading="lazy" decoding="async" />
            </span>
          </div>
        </div>
      </div>

      <div className="sky__layer sky__clouds--front">{FRONT_CLOUDS.map(renderCloud)}</div>

      <div className="sky__vignette" />
    </div>
  );
}
