/**
 * gallery.js — Goles por el Mundo
 * Sliders automáticos + Modal ampliado con soporte táctil
 * ES6+ · Código modular y comentado
 */

'use strict';

/* ============================================================
   CLASE GALLERY — gestiona un slider individual
   ============================================================ */
class Gallery {
  /**
   * @param {HTMLElement} container — elemento .gallery-slider
   */
  constructor(container) {
    this.container   = container;
    this.track       = container.querySelector('.slider-track');
    this.slides      = Array.from(container.querySelectorAll('.slide'));
    this.dotsWrap    = container.querySelector('.slider-dots');
    this.btnPrev     = container.querySelector('.slider-btn.prev');
    this.btnNext     = container.querySelector('.slider-btn.next');

    this.current     = 0;           // índice activo
    this.total       = this.slides.length;
    this.interval    = null;        // referencia al auto-play
    this.DELAY       = 5000;        // ms entre cambios automáticos
    this.isAnimating = false;       // bloqueo durante transición

    if (this.total === 0) return;

    this._buildDots();
    this._bindEvents();
    this._goTo(0, false);           // mostrar primera sin animación
    this._startAutoPlay();
  }

  /* ------ Crear dots indicadores ------ */
  _buildDots() {
    this.slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className  = 'dot';
      dot.setAttribute('aria-label', `Ir a imagen ${i + 1}`);
      dot.addEventListener('click', () => this._goTo(i));
      this.dotsWrap.appendChild(dot);
    });
    this.dots = Array.from(this.dotsWrap.querySelectorAll('.dot'));
  }

  /* ------ Ir a un slide específico ------ */
  _goTo(index, animate = true) {
    if (this.isAnimating && animate) return;

    // Normalizar índice (loop circular)
    index = ((index % this.total) + this.total) % this.total;

    if (animate) {
      this.isAnimating = true;
      setTimeout(() => { this.isAnimating = false; }, 600);
    }

    // Mover el track con CSS transform
    this.track.style.transition = animate ? 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' : 'none';
    this.track.style.transform  = `translateX(-${index * 100}%)`;

    // Actualizar clases aria
    this.slides.forEach((s, i) => {
      s.setAttribute('aria-hidden', i !== index);
      s.classList.toggle('active', i === index);
    });

    // Actualizar dots
    this.dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
      d.setAttribute('aria-pressed', i === index);
    });

    this.current = index;
  }

  /* ------ Auto-play ------ */
  _startAutoPlay() {
    this._stopAutoPlay();
    this.interval = setInterval(() => {
      this._goTo(this.current + 1);
    }, this.DELAY);
  }

  _stopAutoPlay() {
    if (this.interval) clearInterval(this.interval);
  }

  /* ------ Eventos: botones, hover, teclado, touch ------ */
  _bindEvents() {
    // Botones anterior / siguiente
    this.btnPrev.addEventListener('click', () => {
      this._goTo(this.current - 1);
      this._restartAutoPlay();
    });
    this.btnNext.addEventListener('click', () => {
      this._goTo(this.current + 1);
      this._restartAutoPlay();
    });

    // Pausa al hover
    this.container.addEventListener('mouseenter', () => this._stopAutoPlay());
    this.container.addEventListener('mouseleave', () => this._startAutoPlay());

    // Soporte táctil (swipe)
    let touchStartX = 0;
    this.container.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    this.container.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        dx < 0 ? this._goTo(this.current + 1) : this._goTo(this.current - 1);
        this._restartAutoPlay();
      }
    }, { passive: true });
  }

  _restartAutoPlay() {
    this._stopAutoPlay();
    this._startAutoPlay();
  }

  /* ------ API pública ------ */
  prev()  { this._goTo(this.current - 1); this._restartAutoPlay(); }
  next()  { this._goTo(this.current + 1); this._restartAutoPlay(); }
  goTo(i) { this._goTo(i); this._restartAutoPlay(); }
  getCurrentIndex() { return this.current; }
}


/* ============================================================
   CLASE MODAL — visualización ampliada de imágenes
   ============================================================ */
class Modal {
  constructor() {
    this.overlay   = document.getElementById('modal-overlay');
    this.img       = document.getElementById('modal-img');
    this.caption   = document.getElementById('modal-caption');
    this.btnClose  = document.getElementById('modal-close');
    this.btnPrev   = document.getElementById('modal-prev');
    this.btnNext   = document.getElementById('modal-next');

    this.images    = [];   // array de { src, alt } del contexto activo
    this.current   = 0;
    this.touchStartX = 0;

    this._bindEvents();
  }

  /* ------ Abrir modal con contexto de galería ------ */
  open(images, startIndex) {
    this.images  = images;
    this.current = startIndex;
    this._show(this.current);
    this.overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';

    // Focus para accesibilidad
    this.btnClose.focus();
  }

  /* ------ Mostrar imagen dentro del modal ------ */
  _show(index) {
    index = ((index % this.images.length) + this.images.length) % this.images.length;
    this.current = index;

    const { src, alt } = this.images[index];
    this.img.classList.add('loading');
    this.img.src     = '';
    this.img.alt     = alt;
    this.caption.textContent = alt;

    const tmp = new Image();
    tmp.onload = () => {
      this.img.src = src;
      this.img.classList.remove('loading');
    };
    tmp.onerror = () => {
      this.img.src = src;   // mostrar de todas formas
      this.img.classList.remove('loading');
    };
    tmp.src = src;
  }

  /* ------ Cerrar modal ------ */
  close() {
    this.overlay.classList.remove('visible');
    document.body.style.overflow = '';
    this.img.src = '';
  }

  /* ------ Eventos ------ */
  _bindEvents() {
    // Botón cerrar
    this.btnClose.addEventListener('click', () => this.close());

    // Click fuera de la imagen
    this.overlay.addEventListener('click', e => {
      if (e.target === this.overlay) this.close();
    });

    // Navegación
    this.btnPrev.addEventListener('click', () => this._show(this.current - 1));
    this.btnNext.addEventListener('click', () => this._show(this.current + 1));

    // Teclado
    document.addEventListener('keydown', e => {
      if (!this.overlay.classList.contains('visible')) return;
      if (e.key === 'Escape')      this.close();
      if (e.key === 'ArrowLeft')   this._show(this.current - 1);
      if (e.key === 'ArrowRight')  this._show(this.current + 1);
    });

    // Soporte táctil en modal
    this.overlay.addEventListener('touchstart', e => {
      this.touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    this.overlay.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      if (Math.abs(dx) > 50) {
        dx < 0 ? this._show(this.current + 1) : this._show(this.current - 1);
      }
    }, { passive: true });
  }
}


/* ============================================================
   LAZY LOADING — carga diferida de imágenes
   ============================================================ */
function initLazyLoad() {
  const imgs = document.querySelectorAll('img[data-src]');
  if (!imgs.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        obs.unobserve(img);
      }
    });
  }, { rootMargin: '200px 0px' });

  imgs.forEach(img => observer.observe(img));
}


/* ============================================================
   NAVBAR — hamburger + scroll effect (idéntico al index)
   ============================================================ */
function initNavbar() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const nav        = document.querySelector('nav');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });

    // Cerrar al hacer click en enlace
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      }
    });
  }

  // Efecto de scroll en la navbar
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.background = window.scrollY > 50
        ? 'rgba(10, 45, 22, 0.99)'
        : 'rgba(13, 61, 32, 0.97)';
    }, { passive: true });
  }
}


/* ============================================================
   SCROLL REVEAL — animaciones de aparición
   ============================================================ */
function initScrollReveal() {
  const elements = document.querySelectorAll(
    '.gallery-section, .gallery-header, .gallery-slider'
  );
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => {
    el.classList.add('reveal-ready');
    observer.observe(el);
  });
}


/* ============================================================
   INICIALIZACIÓN PRINCIPAL
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Navbar
  initNavbar();

  // 2. Lazy Loading
  initLazyLoad();

  // 3. Scroll Reveal
  initScrollReveal();

  // 4. Modal global (una sola instancia)
  const modal = new Modal();

  // 5. Inicializar cada slider
  const sliderContainers = document.querySelectorAll('.gallery-slider');
  const galleries = [];

  sliderContainers.forEach((container, galIndex) => {
    const gallery = new Gallery(container);
    galleries.push(gallery);

    // Recolectar imágenes de este slider para el modal
    const slideImages = Array.from(container.querySelectorAll('.slide')).map(slide => {
      const img = slide.querySelector('img');
      return {
        src: img.dataset.src || img.src,
        alt: img.alt
      };
    });

    // Abrir modal al hacer click en una imagen del slide
    container.querySelectorAll('.slide').forEach((slide, slideIndex) => {
      slide.addEventListener('click', () => {
        // Usar el índice actual del slider para abrir el modal en la imagen correcta
        modal.open(slideImages, gallery.getCurrentIndex());
      });
      // Cursor pointer para indicar que es clickeable
      slide.style.cursor = 'pointer';
    });
  });

});
