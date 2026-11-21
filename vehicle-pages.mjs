import { readFileSync } from 'node:fs';

const vehicles = JSON.parse(readFileSync(new URL('./src/fleet.json', import.meta.url), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function vehiclePages() {
  let base;
  const siteUrl = process.env.SITE_URL || 'https://test.anubisreal.es';
  const pathFor = vehicle => `equipos/${vehicle.id}/`;
  function render(vehicle, origin) {
    const home = new URL(base, origin);
    const url = new URL(pathFor(vehicle), home).href;
    const photo = escape(new URL('images/' + vehicle.image, home).href);
    const title = escape(vehicle.name + ' · ' + vehicle.year);
    const number = process.env.VITE_WHATSAPP_NUMBER?.replace(/\D/g, '') || '19419771723';
    const message = encodeURIComponent(`Hola, Berenguer. Me interesa alquilar ${vehicle.name} (${vehicle.year}). ¿Está disponible?\n${url}`);
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="${escape(new URL('favicon.ico', home).href)}"><link rel="icon" type="image/svg+xml" sizes="any" href="${escape(new URL('images/berenguer-pliegue.svg', home).href)}">
<title>${title} | Berenguer Transport</title><meta property="og:type" content="website"><meta property="og:title" content="${title}">
<meta property="og:site_name" content="Berenguer Transport"><meta property="og:description" content="Consulta disponibilidad con Berenguer Transport.">
<meta property="og:url" content="${escape(url)}"><meta property="og:image" content="${photo}"><meta property="og:image:alt" content="${title}">
<style>*{box-sizing:border-box}body{margin:0;padding:clamp(1rem,5vw,4rem);font:1rem/1.45 system-ui;background:#e9eae8;color:#20251f}main{max-width:44rem;margin:auto}article{margin:1rem 0;padding:.5rem;border-radius:1.5rem;background:#f6f7f4}img{display:block;width:100%;border-radius:1.1rem}section{padding:1rem}h1{margin:0;font-size:clamp(1.5rem,4vw,2.4rem);line-height:1.1}a{color:inherit}.contact{display:inline-block;border-radius:.9rem;padding:.75rem 1rem;background:#223b30;color:white;text-decoration:none;font-weight:650}</style><link rel="stylesheet" href="${escape(new URL('vehicle-details.css', home).href)}"></head>
<body><main><a href="${escape(home.href)}#catalogo">← Catálogo Berenguer</a><article><img src="${photo}" alt="${title}"><section><h1>${escape(vehicle.name)}</h1><p>${vehicle.year} · ${escape(vehicle.color)}</p><div class="load-summary"><h3>${escape(vehicle.loadType)}</h3><dl><div><dt>Habitual</dt><dd>${vehicle.usualLoadLb == null ? 'Consultar' : vehicle.usualLoadLb + ' lb'}</dd></div><div><dt>Máxima</dt><dd>${vehicle.maxLoadLb == null ? 'Por confirmar' : vehicle.maxLoadLb + ' lb'}</dd></div></dl></div><a class="panel-contact" href="https://wa.me/${number}?text=${message}">Me interesa este ${escape(vehicle.kind)} <span aria-hidden="true">↗</span></a></section></article></main><footer class="site-footer"><span class="footer-logo"><img src="${escape(new URL('images/berenguer-pliegue.svg', home).href)}" width="40" height="40" alt=""></span>© ${new Date().getFullYear()} Berenguer Transport LLC. All rights reserved.</footer></body></html>`;
  }
  return {
    name: 'vehicle-pages',
    configResolved(config) { base = config.base; },
    transformIndexHtml() {
      const home = new URL(base, siteUrl);
      const photo = new URL('images/portada-berenguer.jpg', home).href;
      const properties = {
        'og:type': 'website',
        'og:site_name': 'Berenguer Transport LLC',
        'og:title': 'Berenguer Transport LLC | Alquiler de vehículos y tráileres',
        'og:description': 'Explora la flota y consulta disponibilidad por WhatsApp.',
        'og:url': home.href,
        'og:image': photo,
        'og:image:alt': 'Berenguer. RAM blanca con un tráiler de cuello de ganso en carretera.',
        'og:image:type': 'image/jpeg',
        'og:image:width': '1536',
        'og:image:height': '1024'
      };
      return [
        ...Object.entries(properties).map(([property, content]) => ({ tag: 'meta', attrs: { property, content } })),
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: photo } }
      ];
    },
    generateBundle() {
      for (const vehicle of vehicles) {
        this.emitFile({ type: 'asset', fileName: pathFor(vehicle) + 'index.html', source: render(vehicle, siteUrl) });
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0];
        const vehicle = vehicles.find(item => path === base + pathFor(item));
        if (!vehicle) return next();
        const host = req.headers.host || 'localhost';
        const protocol = req.headers['x-forwarded-proto'] === 'https' || host === 'test.anubisreal.es' ? 'https' : 'http';
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(render(vehicle, `${protocol}://${host}`));
      });
    }
  };
}
