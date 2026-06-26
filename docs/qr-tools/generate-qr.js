#!/usr/bin/env node
/**
 * 72H ECSS · CCQ Unité 8 — Générateur de QR code
 *
 * Usage :
 *   node generate-qr.js                              → utilise URL par défaut
 *   node generate-qr.js https://votre-url.pages.dev  → URL personnalisée
 *
 * Sortie : ../../hub/assets/qr-code.svg
 *
 * Le QR utilise un niveau de correction d'erreur HAUT (H = 30%),
 * ce qui permet de placer le "8" doré au centre sans casser la lecture.
 */

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// =========== CONFIG ===========
const DEFAULT_URL = 'https://72h-ecss-unite8.pages.dev/';
const url = process.argv[2] || DEFAULT_URL;

const MARINE = '#0A2342';
const GOLD = '#E8A020';
const WHITE = '#FFFFFF';

const OUTPUT = path.join(__dirname, '..', '..', 'hub', 'assets', 'qr-code.svg');

// =========== GÉNÉRATION ===========
async function build() {
  // 1. Matrice brute des modules QR (error correction H = 30% pour permettre overlay)
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const modules = qr.modules;
  const moduleCount = modules.size;
  const data = modules.data; // Uint8Array, 1 = noir, 0 = blanc

  // 2. Échelle visuelle : on choisit une taille pixel par module
  const MODULE_PX = 16;       // chaque module = 16px
  const QUIET = 2;            // marge "quiet zone" en modules
  const qrSize = (moduleCount + QUIET * 2) * MODULE_PX;

  // Construction des rects noirs pour chaque module activé
  let qrInner = '';
  for (let y = 0; y < moduleCount; y++) {
    for (let x = 0; x < moduleCount; x++) {
      if (data[y * moduleCount + x]) {
        const px = (x + QUIET) * MODULE_PX;
        const py = (y + QUIET) * MODULE_PX;
        qrInner += `<rect x="${px}" y="${py}" width="${MODULE_PX}" height="${MODULE_PX}" fill="${MARINE}"/>`;
      }
    }
  }

  // 3. Zone centrale pour le "8" (≈18% du QR, safe sous H avec quiet zone)
  const cx = qrSize / 2;
  const cy = qrSize / 2;
  const eightRadius = qrSize * 0.10;

  // 4. Composition finale : cadre + QR + 8 central + label
  const FRAME = 80;       // marge de cadre
  const LABEL_H = 110;    // hauteur de la zone label
  const TOTAL_W = qrSize + FRAME * 2;
  const TOTAL_H = qrSize + FRAME * 2 + LABEL_H;

  const composed = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TOTAL_W} ${TOTAL_H}" role="img" aria-label="QR code 72H ECSS · CCQ Unité 8">
  <title>72H ECSS · CCQ Unité 8 — ${url}</title>

  <!-- Fond blanc avec coins arrondis -->
  <rect x="0" y="0" width="${TOTAL_W}" height="${TOTAL_H}" rx="48" ry="48" fill="${WHITE}"/>

  <!-- Cadre or extérieur -->
  <rect x="12" y="12" width="${TOTAL_W - 24}" height="${TOTAL_H - 24}" rx="40" ry="40"
        fill="none" stroke="${GOLD}" stroke-width="6"/>

  <!-- Décor "8" en filigrane top-left -->
  <g opacity="0.06" transform="translate(40 40)">
    <path d="M30 6a17 17 0 1 0 0 34 17 17 0 1 1 0 34 17 17 0 1 1 0-34 17 17 0 1 0 0-34z"
          fill="none" stroke="${GOLD}" stroke-width="4"/>
  </g>
  <g opacity="0.06" transform="translate(${TOTAL_W - 100} ${TOTAL_H - 220})">
    <path d="M30 6a17 17 0 1 0 0 34 17 17 0 1 1 0 34 17 17 0 1 1 0-34 17 17 0 1 0 0-34z"
          fill="none" stroke="${GOLD}" stroke-width="4"/>
  </g>

  <!-- QR code -->
  <g transform="translate(${FRAME} ${FRAME})">
    ${qrInner}
  </g>

  <!-- Cercle blanc + 8 doré au centre -->
  <g transform="translate(${FRAME + cx} ${FRAME + cy})">
    <circle r="${eightRadius * 1.15}" fill="${WHITE}"/>
    <circle r="${eightRadius * 1.05}" fill="${MARINE}"/>
    <g transform="translate(${-eightRadius * 0.6} ${-eightRadius})">
      <path d="M${eightRadius * 0.6} ${eightRadius * 0.06}
               a${eightRadius * 0.42} ${eightRadius * 0.42} 0 1 0 0 ${eightRadius * 0.84}
               a${eightRadius * 0.42} ${eightRadius * 0.42} 0 1 1 0 ${eightRadius * 0.84}
               a${eightRadius * 0.42} ${eightRadius * 0.42} 0 1 1 0 -${eightRadius * 0.84}
               a${eightRadius * 0.42} ${eightRadius * 0.42} 0 1 0 0 -${eightRadius * 0.84}z"
            fill="none" stroke="${GOLD}" stroke-width="${eightRadius * 0.16}" stroke-linecap="round"/>
    </g>
  </g>

  <!-- Label en bas -->
  <g transform="translate(${TOTAL_W / 2} ${qrSize + FRAME * 2 + 10})">
    <text text-anchor="middle" y="36"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          font-size="42" font-weight="900" fill="${MARINE}" letter-spacing="-1">
      72H ECSS · Unité 8
    </text>
    <text text-anchor="middle" y="72"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          font-size="22" font-weight="600" fill="${GOLD}" letter-spacing="3">
      7 · 8 · 9 AOÛT 2026
    </text>
  </g>
</svg>
`;

  // 5. Sauvegarde
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, composed, 'utf8');

  console.log('✔ QR code généré');
  console.log('  URL  :', url);
  console.log('  Fichier :', OUTPUT);
  console.log('  Taille SVG : ' + composed.length + ' octets');
}

build().catch((err) => {
  console.error('✘ Erreur génération QR :', err.message);
  process.exit(1);
});
