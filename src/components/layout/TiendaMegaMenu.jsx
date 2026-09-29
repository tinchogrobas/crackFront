'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { imgProps } from '@/lib/imageProps';

/**
 * Megamenú de "Tienda" — sólo desktop (lg+).
 *
 * Réplica del hover del tema Broadcast (ver mockup/megamenu-sellado.html): las
 * curvas y duraciones viven en globals.css (`.mm-*`); acá sólo se calculan los
 * delays en cascada, que dependen de la posición de cada elemento.
 *
 * El estado abierto lo maneja el Navbar porque también cambia su propio estilo
 * (se pone blanco mientras el menú está abierto).
 */

// delay = i × paso + 10ms, con el paso arrancando en 50ms y achicándose ×0.95:
// el final de la lista entra más apretado que el principio.
function staggerDelays(count) {
  const delays = [];
  let step = 50;
  for (let i = 0; i < count; i += 1) {
    delays.push(i * step + 10);
    step *= 0.95;
  }
  return delays;
}

const IMAGE_SIZES = '(min-width: 1400px) 360px, 26vw';

export default function TiendaMegaMenu({ data, open, primed, onOpenChange, linkClassName, underline }) {
  const pathname = usePathname();
  const rootRef = useRef(null);

  const blocks = data?.blocks || [];
  // Una sola cascada que recorre los dos grupos de arriba a abajo.
  const groups = [
    { title: 'TCG', links: data?.tcgs || [] },
    { title: 'Categorías', links: [{ name: 'Ver todo', href: '/tienda' }, ...(data?.categories || [])] },
  ].filter((group) => group.links.length > 0);
  const delays = staggerDelays(groups.reduce((n, group) => n + group.links.length, 0));
  let linkIndex = 0;

  // Al navegar desde el menú el mouse sigue encima: sin esto quedaría abierto
  // tapando la página a la que se llegó.
  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  const close = () => onOpenChange(false);

  return (
    <div
      ref={rootRef}
      className="h-14 sm:h-16 flex items-center"
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={close}
      onKeyUp={(e) => { if (e.key === 'Escape') close(); }}
      onBlur={(e) => { if (!rootRef.current?.contains(e.relatedTarget)) close(); }}
    >
      <Link
        href="/tienda"
        className={`${linkClassName} inline-flex items-center gap-1.5`}
        aria-expanded={open}
        aria-haspopup="true"
        onFocus={() => onOpenChange(true)}
        onClick={close}
      >
        Tienda
        <ChevronDown
          size={12}
          strokeWidth={2.5}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
        {underline}
      </Link>

      <div className={`mm-dropdown ${open ? 'is-visible' : ''}`}>
        <div className="mm-inner max-w-[1400px] mx-auto px-5 sm:px-8">
          <nav aria-label="Filtros de la tienda" className="mm-links">
            {groups.map((group) => (
              <div key={group.title} className="mm-group">
                <p className="mm-eyebrow">{group.title}</p>
                {group.links.map((link) => {
                  const delay = delays[linkIndex];
                  linkIndex += 1;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={close}
                      className="mm-link"
                      style={{ transitionDelay: `${delay}ms` }}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="mm-blocks">
            {blocks.map((block, i) => {
              const image = primed && block.product?.image
                ? imgProps(block.product.image, 'card', { sizes: IMAGE_SIZES })
                : null;
              const delay = { transitionDelay: `${i * 100}ms` };

              return (
                <Link
                  key={block.key}
                  href={block.href}
                  onClick={close}
                  className="mm-image"
                  style={delay}
                >
                  <div className="mm-image-wrapper" style={delay}>
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img {...image} alt={block.product.name} />
                    ) : null}
                  </div>
                  <div className="mm-caption">
                    <h2 className="mm-title">{block.label}</h2>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
