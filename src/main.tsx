import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/barlow-condensed/latin-900.css';
import './style.css';
import fleet from './fleet.json';

const facebook = import.meta.env.VITE_FACEBOOK_URL;
const tiktok = import.meta.env.VITE_TIKTOK_URL;
const instagram = import.meta.env.VITE_INSTAGRAM_URL;
const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER?.replace(/\D/g, '') || '19419771723';
const whatsapp = `https://wa.me/${whatsappNumber}`;

function VehicleCard({ id, name, image, color, year, kind, usualLoadLb, maxLoadLb, loadType }: (typeof fleet)[number]) {
  const link = new URL(`${import.meta.env.BASE_URL}equipos/${id}/`, location.origin);
  const inquiry = `Hola, Berenguer. Me interesa alquilar ${name} (${year}). ¿Está disponible?
${link.href}`;
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useLayoutEffect(() => {
    if (open) closeButton.current?.focus({ preventScroll: true });
    else if (wasOpen.current) trigger.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  return (
    <div className="fleet-frame">
        <button
          className="vehicle-card"
          type="button"
          ref={trigger}
          inert={open}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(true)}
        >
          <img src={`${import.meta.env.BASE_URL}images/${image}`} alt={name + ", vista delantera de tres cuartos"} width="1536" height="1024" />
          <span className="vehicle-caption">
            <span className="vehicle-name">
              <span className="vehicle-title">{name}</span>
              <small>{year ? year + " · " : ""}{color}</small>
            </span>
            <span className="vehicle-action">Ver ficha</span>
          </span>
        </button>
      <section
        id={id}
        className="vehicle-details"
        data-open={open}
        inert={!open}
        aria-labelledby={id + "-titulo"}
        onKeyDown={event => {
          if (event.key === 'Escape') setOpen(false);
        }}
      >
      <div className="vehicle-panel">
        <div className="panel-heading">
          <div>
            <h2 id={id + "-titulo"}>{name}</h2>
            <p>{[year, color].filter(Boolean).join(' · ')}</p>
          </div>
          <button type="button" className="panel-close" aria-label="Cerrar ficha" ref={closeButton} onClick={() => setOpen(false)}>×</button>
        </div>
        <section className="load-summary" aria-label={loadType}>
          <h3>{loadType}</h3>
          <dl><div><dt>Habitual</dt><dd>{usualLoadLb == null ? 'Consultar' : usualLoadLb + ' lb'}</dd></div>
          <div><dt>Máxima</dt><dd>{maxLoadLb == null ? 'Por confirmar' : maxLoadLb + ' lb'}</dd></div></dl>
        </section>
        <a className="panel-contact" href={`${whatsapp}?text=${encodeURIComponent(inquiry)}`}>
          Me interesa este {kind} <span aria-hidden="true">↗</span>
        </a>
      </div>
      </section>
    </div>
  );
}

const filterIcons = {
  Todos: <path d="M5 4h8v6H5z M17 4h8v6h-8z M5 14h8v6H5z M17 14h8v6h-8z" />,
  Trocas: <><path d="M2 10h9l2-5h5l4 6 5 1v4h-2m-5 0H10m-5 0H2z M12 10h8" /><circle cx="7.5" cy="16.5" r="2.5"/><circle cx="22.5" cy="16.5" r="2.5"/></>,
  Camiones: <><path d="M2 4h16v11H2z M18 8h5l4 5v3h-2 M18 16h2"/><circle cx="7" cy="17" r="2.5"/><circle cx="22.5" cy="17" r="2.5"/></>,
  Tráileres: <><path d="M2 12h18l2-6h5v3h-3l-2 6H2z M20 15v4"/><circle cx="5" cy="17.5" r="2"/><circle cx="10" cy="17.5" r="2"/></>,
};

function FilterBubble({ index }: { index: number }) {
  const shape = useRef<SVGPathElement>(null);
  const edges = useRef([{ x: index * 100, v: 0 }, { x: index * 100 + 100, v: 0 }]);

  useLayoutEffect(() => {
    const target = index * 100;
    const [left, right] = edges.current;
    const movingRight = target > (left.x + right.x - 100) / 2;
    let frame = 0;
    let previous = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .024);
      previous = now;
      let moving = false;
      edges.current.forEach((edge, side) => {
        const goal = target + side * 100;
        const stiffness = (side === 1) === movingRight ? 290 : 145;
        edge.v += ((goal - edge.x) * stiffness - edge.v * Math.sqrt(stiffness) * 1.48) * dt;
        edge.x += edge.v * dt;
        if (reduced || (Math.abs(edge.x - goal) < .05 && Math.abs(edge.v) < .5)) {
          edge.x = goal;
          edge.v = 0;
        } else moving = true;
      });
      const l = left.x + 1, r = right.x - 1, mid = (l + r) / 2;
      const radius = Math.min(25, (r - l) / 3);
      const neck = Math.min(18, Math.max(0, (r - l - 98) * .45));
      shape.current?.setAttribute('d',
        `M ${l+radius} 2 Q ${mid} ${2+2*neck} ${r-radius} 2
         C ${r+radius*.33} 2 ${r+radius*.33} 48 ${r-radius} 48
         Q ${mid} ${48-2*neck} ${l+radius} 48
         C ${l-radius*.33} 48 ${l-radius*.33} 2 ${l+radius} 2 Z`);
      if (moving) frame = requestAnimationFrame(draw);
    };
    draw(previous);
    return () => cancelAnimationFrame(frame);
  }, [index]);

  return <svg className="filter-track" viewBox="0 0 400 50" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="filter-glass" x2=".18" y2="1">
      <stop stopColor="#fff" stopOpacity=".94" />
      <stop offset=".55" stopColor="#c7d1cc" stopOpacity=".72" />
      <stop offset="1" stopColor="#f7fbf8" stopOpacity=".95" />
    </linearGradient></defs>
    <path ref={shape} fill="url(#filter-glass)" stroke="#fff" strokeOpacity=".85" />
  </svg>;
}

function App() {
  const [filter, setFilter] = useState('Todos');
  const vehicles = fleet.filter(vehicle => filter === 'Todos' || vehicle.category === filter);
  const [showHeader, setShowHeader] = useState(() => window.scrollY > 8);

  useLayoutEffect(() => {
    const syncHeader = () => setShowHeader(window.scrollY > 8);
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
    return () => window.removeEventListener('scroll', syncHeader);
  }, []);

  return (<>

    <main>
      <div className="rental-hero">
        <picture className="rental-scene">
          <source media="(max-aspect-ratio: 1/1)" srcSet={`${import.meta.env.BASE_URL}images/portada-berenguer-movil.jpg`} />
          <img src={`${import.meta.env.BASE_URL}images/portada-berenguer.jpg`} alt="BERENGUER. RAM 3500 blanca remolcando un tráiler Horizon de cuello de ganso vacío por carretera" fetchPriority="high" />
        </picture>
      </div>
    <header className="site-header" data-visible={showHeader} inert={!showHeader}>
      <div className="header-inner">
        <span className="company-name">Berenguer <span className="company-subtitle">TRANSPORT LLC</span></span>
        <nav className="header-links" aria-label="Redes sociales y contacto">
          <div className="social-links">
            <a className="social-link" href={facebook || undefined} aria-disabled={!facebook} aria-label="Facebook" title="Facebook">
              <svg viewBox="3.3 2.8 19 19" fill="currentColor" aria-hidden="true">
                <path d="M14 21v-8h2.7l.4-3H14V8c0-.9.3-1.5 1.6-1.5h1.7V3.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H8v3h2.6v8z" />
              </svg>
            </a>
            <a className="social-link" href={instagram || undefined} aria-disabled={!instagram} aria-label="Instagram" title="Instagram">
              <svg viewBox="2 2 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.9" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a className="social-link" href={tiktok || undefined} aria-disabled={!tiktok} aria-label="TikTok" title="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.6 1c.3 2.8 1.9 4.6 4.9 4.9v3.6a9.2 9.2 0 0 1-4.9-1.5v7.8a7.1 7.1 0 1 1-6.1-7v3.7a3.5 3.5 0 1 0 2.4 3.3V1z" />
              </svg>
            </a>
          </div>
          <a className="whatsapp-link" href={whatsapp}>
            <span className="whatsapp-icon" aria-hidden="true">
              <img src={`${import.meta.env.BASE_URL}images/berenguer-pliegue.svg`} alt="" width="24" height="24" />
            </span>
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
      <section id="catalogo" className="fleet" aria-label="Catálogo de vehículos">
        <div className="fleet-filters" role="group" aria-label="Filtrar catálogo por categoría">
          <FilterBubble index={Object.keys(filterIcons).indexOf(filter)} />
          {Object.entries(filterIcons).map(([label, icon]) => (
            <button key={label} type="button" aria-label={label} title={label} aria-pressed={label === filter} onClick={() => setFilter(label)}>
              <svg viewBox="0 0 30 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">{icon}</svg>
            </button>
          ))}
        </div>
        {vehicles.map(vehicle => <VehicleCard key={vehicle.id} {...vehicle} />)}
      </section>
    </main>
    <footer className="site-footer">
      <span className="footer-logo"><img src={`${import.meta.env.BASE_URL}images/berenguer-pliegue.svg`} width="40" height="40" alt="" /></span>
      © {new Date().getFullYear()} Berenguer Transport LLC. All rights reserved.
    </footer>
  </>);
}

createRoot(document.getElementById('root')!).render(<App />);
