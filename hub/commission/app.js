/* =============================================================
   72H ECSS · Espace commission — logique client
   - Auth via passcode (POST /api/submissions)
   - Stats + filtres + tableau + export CSV
   ============================================================= */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const lockScreen = $('#lockScreen');
  const lockForm = $('#lockForm');
  const passcodeInput = $('#passcodeInput');
  const unlockBtn = $('#unlockBtn');
  const lockError = $('#lockError');

  const dashboard = $('#dashboard');
  const tbody = $('#tbody');
  const emptyState = $('#emptyState');
  const csvBtn = $('#csvBtn');
  const refreshBtn = $('#refreshBtn');

  // État
  let currentPasscode = '';
  let allSubmissions = [];
  let currentFilter = 'all';

  // ============== Auth + Fetch ==============
  lockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pc = passcodeInput.value.trim();
    if (!pc) return;
    await loadSubmissions(pc, true);
  });

  refreshBtn.addEventListener('click', () => {
    if (currentPasscode) loadSubmissions(currentPasscode, false);
  });

  async function loadSubmissions(passcode, isInitial) {
    lockError.textContent = '';
    unlockBtn.disabled = true;
    if (isInitial) unlockBtn.textContent = 'Chargement…';
    refreshBtn.disabled = true;
    const originalRefresh = refreshBtn.textContent;
    refreshBtn.textContent = '⏳ Chargement…';

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          lockError.textContent = data.error || 'Passcode invalide.';
        } else {
          lockError.textContent = data.error || 'Erreur de chargement. Réessayer.';
        }
        return;
      }

      // Succès
      currentPasscode = passcode;
      allSubmissions = Array.isArray(data.submissions) ? data.submissions : [];
      lockScreen.style.display = 'none';
      dashboard.classList.add('is-active');
      dashboard.setAttribute('aria-hidden', 'false');
      render();
    } catch (err) {
      lockError.textContent = 'Connexion impossible. Vérifier internet.';
      console.error(err);
    } finally {
      unlockBtn.disabled = false;
      if (isInitial) unlockBtn.textContent = 'Déverrouiller';
      refreshBtn.disabled = false;
      refreshBtn.textContent = originalRefresh;
    }
  }

  // ============== Détection activité ==============
  // Tally renvoie le label exact du champ. On cherche les patterns sur "Activité" ou "participer".
  function getActivity(sub) {
    const fields = sub.fields || {};
    for (const [label, value] of Object.entries(fields)) {
      const l = label.toLowerCase();
      if (l.includes('participer') || l.includes('activit')) {
        return String(value).toLowerCase();
      }
    }
    return '';
  }

  function activityCategory(text) {
    const t = (text || '').toLowerCase();
    const hasRando = t.includes('randonn');
    const hasSang = t.includes('sang') || t.includes('don');
    const isBoth = t.includes('deux') || (hasRando && hasSang);
    if (isBoth) return 'both';
    if (hasRando) return 'rando';
    if (hasSang) return 'sang';
    return 'other';
  }

  // ============== Extraction champs (best-effort sur labels variables) ==============
  function pickField(fields, ...needles) {
    if (!fields) return '';
    for (const [label, value] of Object.entries(fields)) {
      const l = label.toLowerCase();
      for (const n of needles) {
        if (l.includes(n.toLowerCase())) return String(value || '');
      }
    }
    return '';
  }

  function getName(sub) {
    const fields = sub.fields || {};
    const full = pickField(fields, 'nom complet', 'full name');
    if (full) return full;
    const first = pickField(fields, 'prénom', 'prenom', 'first');
    const last = pickField(fields, 'nom', 'last');
    return [first, last].filter(Boolean).join(' ').trim() || '—';
  }

  function getWhatsapp(sub) {
    return pickField(sub.fields, 'whatsapp', 'téléphone', 'phone', 'numéro', 'numero');
  }

  function getSector(sub) {
    return pickField(sub.fields, 'secteur', 'sector', 'quartier');
  }

  // ============== Rendu ==============
  function render() {
    const filtered = filterSubmissions(allSubmissions, currentFilter);
    renderStats(allSubmissions);
    renderTable(filtered);
  }

  function filterSubmissions(list, filter) {
    if (filter === 'all') return list;
    return list.filter((s) => activityCategory(getActivity(s)) === filter);
  }

  function renderStats(list) {
    let total = list.length;
    let rando = 0, sang = 0, both = 0;
    for (const s of list) {
      const cat = activityCategory(getActivity(s));
      if (cat === 'rando') rando++;
      else if (cat === 'sang') sang++;
      else if (cat === 'both') { both++; }
    }
    // Pour les compteurs Randonnée et Don de sang, on inclut "les deux"
    $('#statTotal').textContent = total;
    $('#statRando').textContent = rando + both;
    $('#statSang').textContent = sang + both;
    $('#statBoth').textContent = both;
  }

  function renderTable(list) {
    tbody.innerHTML = '';
    if (!list.length) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    const frag = document.createDocumentFragment();
    for (const s of list) {
      const tr = document.createElement('tr');

      const tdDate = document.createElement('td');
      tdDate.textContent = formatDate(s.submittedAt);

      const tdName = document.createElement('td');
      tdName.className = 'col-name';
      tdName.textContent = getName(s);

      const tdWa = document.createElement('td');
      tdWa.className = 'col-wa';
      const wa = getWhatsapp(s);
      if (wa) {
        const a = document.createElement('a');
        a.href = 'https://wa.me/' + wa.replace(/[^\d]/g, '');
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = wa;
        tdWa.appendChild(a);
      } else {
        tdWa.textContent = '—';
      }

      const tdAct = document.createElement('td');
      const cat = activityCategory(getActivity(s));
      const pill = document.createElement('span');
      pill.className = 'activity-pill activity-pill--' + (cat === 'other' ? 'both' : cat);
      pill.textContent = activityLabel(cat);
      tdAct.appendChild(pill);

      const tdSector = document.createElement('td');
      tdSector.textContent = getSector(s) || '—';

      tr.append(tdDate, tdName, tdWa, tdAct, tdSector);
      frag.appendChild(tr);
    }
    tbody.appendChild(frag);
  }

  function activityLabel(cat) {
    switch (cat) {
      case 'rando': return '🚶 Randonnée';
      case 'sang': return '🩸 Don de sang';
      case 'both': return '∞ Les deux';
      default: return '—';
    }
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  // ============== Filtres ==============
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  // ============== Export CSV ==============
  csvBtn.addEventListener('click', () => {
    const list = filterSubmissions(allSubmissions, currentFilter);
    const csv = buildCsv(list);
    downloadCsv(csv, `72h-ecss-inscriptions-${todayStamp()}.csv`);
  });

  function buildCsv(list) {
    const headers = ['Date', 'Prénom et Nom', 'WhatsApp', 'Activité', 'Secteur'];
    const lines = [headers.join(';')];
    for (const s of list) {
      lines.push([
        csvCell(formatDate(s.submittedAt)),
        csvCell(getName(s)),
        csvCell(getWhatsapp(s)),
        csvCell(activityLabel(activityCategory(getActivity(s)))),
        csvCell(getSector(s)),
      ].join(';'));
    }
    return '﻿' + lines.join('\r\n'); // BOM pour Excel
  }

  function csvCell(v) {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[";\r\n]/.test(s) ? `"${s}"` : s;
  }

  function downloadCsv(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function todayStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

})();
