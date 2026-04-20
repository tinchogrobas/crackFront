/**
 * Product zoom vanilla — hover magnifier + click lightbox.
 *
 * Usage:
 *   import { initProductZoom } from '@/lib/productZoom';
 *   const cleanup = initProductZoom(); // attach to every `.zoom-image`
 *   // cleanup() on unmount
 *
 * Each <img class="zoom-image"> may declare `data-zoom-src` pointing to a
 * hi-res URL; if absent, the element's current src is used.
 *
 * The magnifier is hidden on touch/coarse-pointer devices — the modal (with
 * scroll-to-zoom + drag-to-pan) is the fallback.
 */

const LENS_SIZE = 180;
const HOVER_ZOOM = 2.5;
const MODAL_MIN = 1;
const MODAL_MAX = 4;
const MODAL_STEP = 0.25;

let currentModal = null;

export function initProductZoom(root = document) {
  const isTouch =
    typeof window !== 'undefined' &&
    (window.matchMedia('(hover: none)').matches || 'ontouchstart' in window);

  const images = Array.from(root.querySelectorAll('.zoom-image'));
  const cleanups = [];

  images.forEach((img) => {
    const getSrc = () => img.getAttribute('data-zoom-src') || img.currentSrc || img.src;

    // Click → modal (en mobile también)
    const onClick = (e) => {
      e.preventDefault();
      openZoomModal(getSrc(), img.alt || '');
    };
    img.addEventListener('click', onClick);
    cleanups.push(() => img.removeEventListener('click', onClick));

    // Lupa solo en dispositivos con hover real
    if (isTouch) {
      img.classList.add('zoom-image-touch');
      return;
    }
    img.classList.add('zoom-image-hover');

    let lens = null;

    const ensureLens = () => {
      if (lens) return lens;
      lens = document.createElement('div');
      lens.className = 'zoom-magnifier';
      lens.style.width = LENS_SIZE + 'px';
      lens.style.height = LENS_SIZE + 'px';
      document.body.appendChild(lens);
      return lens;
    };

    const removeLens = () => {
      if (lens) {
        lens.remove();
        lens = null;
      }
    };

    /** Calcula el rect visible (letterbox-aware) para un <img object-fit: contain>. */
    const getDisplayedRect = () => {
      const rect = img.getBoundingClientRect();
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (!nw || !nh) return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      const rC = rect.width / rect.height;
      const rI = nw / nh;
      let dw, dh;
      if (rI > rC) {
        dw = rect.width;
        dh = rect.width / rI;
      } else {
        dh = rect.height;
        dw = rect.height * rI;
      }
      return {
        left: rect.left + (rect.width - dw) / 2,
        top: rect.top + (rect.height - dh) / 2,
        width: dw,
        height: dh,
      };
    };

    const onEnter = () => {
      const src = getSrc();
      if (!src) return;
      const l = ensureLens();
      l.style.backgroundImage = `url("${src}")`;
    };

    const onMove = (e) => {
      if (!lens) return;
      const d = getDisplayedRect();
      const x = e.clientX - d.left;
      const y = e.clientY - d.top;
      if (x < 0 || y < 0 || x > d.width || y > d.height) {
        lens.style.opacity = '0';
        return;
      }
      const bgW = d.width * HOVER_ZOOM;
      const bgH = d.height * HOVER_ZOOM;
      const bgX = -(x * HOVER_ZOOM) + LENS_SIZE / 2;
      const bgY = -(y * HOVER_ZOOM) + LENS_SIZE / 2;
      lens.style.backgroundSize = `${bgW}px ${bgH}px`;
      lens.style.backgroundPosition = `${bgX}px ${bgY}px`;
      lens.style.left = e.clientX - LENS_SIZE / 2 + 'px';
      lens.style.top = e.clientY - LENS_SIZE / 2 + 'px';
      lens.style.opacity = '1';
    };

    const onLeave = () => removeLens();

    img.addEventListener('mouseenter', onEnter);
    img.addEventListener('mousemove', onMove);
    img.addEventListener('mouseleave', onLeave);

    cleanups.push(() => {
      img.removeEventListener('mouseenter', onEnter);
      img.removeEventListener('mousemove', onMove);
      img.removeEventListener('mouseleave', onLeave);
      img.classList.remove('zoom-image-hover', 'zoom-image-touch');
      removeLens();
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
    closeZoomModal();
  };
}

// ────────────────────────── MODAL ──────────────────────────

function openZoomModal(src, alt) {
  closeZoomModal();

  const overlay = document.createElement('div');
  overlay.className = 'zoom-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Zoom de imagen');

  const stage = document.createElement('div');
  stage.className = 'zoom-modal-stage';

  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = 'zoom-modal-image';
  img.draggable = false;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'zoom-modal-close';
  closeBtn.setAttribute('aria-label', 'Cerrar');
  closeBtn.innerHTML = '&times;';

  const hint = document.createElement('div');
  hint.className = 'zoom-modal-hint';
  hint.textContent = 'Scroll para zoom · Arrastrar para moverse · ESC para cerrar';

  stage.appendChild(img);
  overlay.appendChild(stage);
  overlay.appendChild(closeBtn);
  overlay.appendChild(hint);
  document.body.appendChild(overlay);

  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => overlay.classList.add('is-open'));

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let originTx = 0;
  let originTy = 0;

  const apply = () => {
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    img.style.cursor = scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in';
  };
  apply();

  const onWheel = (e) => {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const next = Math.min(MODAL_MAX, Math.max(MODAL_MIN, scale + dir * MODAL_STEP));
    if (next === scale) return;
    if (next === MODAL_MIN) {
      tx = 0;
      ty = 0;
    }
    scale = next;
    apply();
  };

  const onDown = (e) => {
    if (scale <= 1) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    originTx = tx;
    originTy = ty;
    apply();
    e.preventDefault();
  };
  const onMove = (e) => {
    if (!dragging) return;
    tx = originTx + (e.clientX - startX);
    ty = originTy + (e.clientY - startY);
    apply();
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    apply();
  };

  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  const onOverlayClick = (e) => {
    if (e.target === overlay || e.target === stage) close();
  };

  overlay.addEventListener('wheel', onWheel, { passive: false });
  img.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('keydown', onKey);
  overlay.addEventListener('click', onOverlayClick);
  closeBtn.addEventListener('click', close);

  function close() {
    if (currentModal !== api) return;
    overlay.classList.remove('is-open');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('keydown', onKey);
    document.body.style.overflow = prevOverflow;
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 240);
    currentModal = null;
  }

  const api = { overlay, close };
  currentModal = api;
}

function closeZoomModal() {
  if (currentModal) currentModal.close();
}
