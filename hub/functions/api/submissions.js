/**
 * Cloudflare Pages Function
 * Route : POST /api/submissions
 *
 * Body : { passcode: "string" }
 *
 * Env vars (à set dans Cloudflare → Pages → Settings → Environment Variables) :
 *   - PASSCODE        : passcode partagé avec la commission (ex: ECSS-Unite8-2026)
 *   - TALLY_API_KEY   : Personal Access Token Tally (commence par "tly-...")
 *   - TALLY_FORM_ID   : ID interne du formulaire Tally (voir docs/deploy-cloudflare.md)
 *
 * Réponse OK : 200 { ok: true, count, submissions: [{id, submittedAt, fields}] }
 * Réponse KO : 401 { ok: false, error: "Passcode invalide" }
 */

export async function onRequestPost({ request, env }) {
  // ============== 1. Validation env vars ==============
  if (!env.PASSCODE || !env.TALLY_API_KEY || !env.TALLY_FORM_ID) {
    return json(500, {
      ok: false,
      error: 'Configuration serveur incomplète. Contacter l\'admin du compte CCQ.',
    });
  }

  // ============== 2. Parse body ==============
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'Requête invalide.' });
  }

  const submittedPasscode = String(body?.passcode || '');

  // ============== 3. Vérif passcode (constant-time) ==============
  if (!constantTimeEqual(submittedPasscode, env.PASSCODE)) {
    // Petit délai pour ralentir les tentatives de brute-force basiques
    await new Promise((r) => setTimeout(r, 500));
    return json(401, { ok: false, error: 'Passcode invalide.' });
  }

  // ============== 4. Fetch Tally (avec pagination) ==============
  const allSubmissions = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      const res = await fetch(
        `https://api.tally.so/forms/${env.TALLY_FORM_ID}/submissions?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${env.TALLY_API_KEY}`,
            Accept: 'application/json',
          },
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        return json(502, {
          ok: false,
          error: `Erreur Tally API (${res.status})`,
          detail: txt.slice(0, 200),
        });
      }

      const data = await res.json();
      const items = data.submissions || data.items || data.data || [];
      allSubmissions.push(...items);

      hasMore = !!data.hasMore;
      page += 1;
      if (page > 50) break; // garde-fou : max 50 pages
    }
  } catch (err) {
    return json(502, {
      ok: false,
      error: 'Tally API injoignable.',
      detail: String(err).slice(0, 200),
    });
  }

  // ============== 5. Normaliser ==============
  const normalized = allSubmissions.map((s) => {
    const fields = {};
    const responses = s.responses || [];
    for (const r of responses) {
      const label = r.questionLabel || r.question?.label || r.question || 'champ';
      const answer = formatAnswer(r.answer ?? r.value);
      fields[label] = answer;
    }
    return {
      id: s.id || s.submissionId || cryptoRandomId(),
      submittedAt: s.submittedAt || s.createdAt || s.created_at || null,
      fields,
    };
  });

  // Trié du plus récent au plus ancien
  normalized.sort((a, b) => {
    const da = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const db = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return db - da;
  });

  return json(200, {
    ok: true,
    count: normalized.length,
    submissions: normalized,
  });
}

// ============== Méthodes non autorisées ==============
export function onRequest({ request }) {
  if (request.method === 'POST') return; // handled by onRequestPost
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST' },
  });
}

// ============== Helpers ==============

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) {
    // Boucle factice pour ne pas leak la longueur via timing
    let dummy = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) dummy |= 1;
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function formatAnswer(val) {
  if (val == null) return '';
  if (Array.isArray(val)) return val.map(formatAnswer).join(', ');
  if (typeof val === 'object') {
    // Tally renvoie parfois { value: "...", label: "..." } pour les multi-choices
    if ('label' in val) return String(val.label);
    if ('value' in val) return String(val.value);
    return JSON.stringify(val);
  }
  return String(val);
}

function cryptoRandomId() {
  return 'sub_' + Math.random().toString(36).slice(2, 10);
}
