# Déploiement Cloudflare Pages via GitHub

Guide complet pour mettre en ligne le hub des 72H ECSS avec la page commission verrouillée.

> **Durée estimée** : 25–35 minutes la première fois.

---

## Vue d'ensemble

```
[Ton ordi] ──git push──> [GitHub repo] ──auto deploy──> [Cloudflare Pages]
                                                              │
                                                              ├─ /               (hub public)
                                                              ├─ /commission/    (page verrouillée)
                                                              └─ /api/submissions (Function — appelle Tally)
```

Trois **secrets** doivent être configurés dans Cloudflare (jamais commités) :

| Variable | Description |
| --- | --- |
| `PASSCODE` | Code partagé avec la commission pour accéder à `/commission/` |
| `TALLY_API_KEY` | Personal Access Token Tally (commence par `tly-…`) |
| `TALLY_FORM_ID` | ID interne du formulaire Tally |

---

## Étape 1 — Récupérer la clé API Tally

1. Aller sur <https://tally.so> → se connecter avec le compte CCQ.
2. Cliquer sur ton avatar (en haut à droite) → **Settings**.
3. Onglet **API keys** (menu de gauche).
4. Cliquer **Create new API key** → nommer `72h-cloudflare`.
5. **Copier la clé** (elle commence par `tly-...`). On ne pourra plus la voir.
   > Garde-la en sécurité dans un gestionnaire de mots de passe.

---

## Étape 2 — Récupérer l'ID du formulaire Tally

1. Toujours sur tally.so, ouvrir le formulaire **« 72H ECSS · CCQ Unité 8 »**.
2. Dans l'URL admin, repérer la partie après `/forms/` :
   ```
   https://tally.so/forms/wA0M3K2/summary
                          ^^^^^^^
                          ID du formulaire
   ```
3. Noter cet ID. C'est `TALLY_FORM_ID`.

> ⚠️ Ne pas confondre avec le slug public (`xXoX7r`) — ce sont deux identifiants différents.
> L'ID admin (pour l'API) ≠ le slug public (pour le partage).

---

## Étape 3 — Choisir un passcode

Règles :
- Minimum 12 caractères (résistance brute-force).
- Mémorisable par la commission (pas généré aléatoire).
- Pas d'espace.

Exemples : `ECSS-Unite8-2026`, `Cambérène-72h-Août`, `CCQ-PA-AOUT-26`.

Noter le passcode quelque part en sécurité — c'est `PASSCODE`.

---

## Étape 4 — Créer le repo GitHub

Sur <https://github.com> :

1. **New repository** (bouton vert).
2. **Owner** : ton org (ex: `ccq-unite8`) ou ton compte perso.
3. **Repository name** : `72h-ecss` (ou autre).
4. **Public** ou **Private** au choix.
   > Private recommandé : aucun secret n'est dans le code, mais une URL Cloudflare Pages préview gratuite l'accompagne (`*.pages.dev`) qui sera publique.
5. **NE PAS** cocher "Initialize with README" (on va le pousser nous).
6. Cliquer **Create repository**.
7. Sur la page suivante, **copier l'URL HTTPS** (ex: `https://github.com/ccq-unite8/72h-ecss.git`).

---

## Étape 5 — Push depuis ta machine

Ouvrir un terminal dans `C:\Users\james\72H U8` :

```bash
cd "C:\Users\james\72H U8"

git init
git add .
git commit -m "init: hub 72H ECSS + page commission verrouillée"

git branch -M main
git remote add origin https://github.com/<TON-ORG>/72h-ecss.git
git push -u origin main
```

> Première fois : Git va te demander tes identifiants GitHub.
> Préférable : créer un **Personal Access Token** (Settings → Developer settings → Tokens) et l'utiliser comme mot de passe.

Vérifier sur GitHub que le code est bien arrivé.

---

## Étape 6 — Connecter Cloudflare Pages au repo

1. Aller sur <https://dash.cloudflare.com> → se connecter (créer un compte si besoin, gratuit).
2. Sidebar gauche → **Workers & Pages**.
3. Onglet **Pages** → **Create application** → **Connect to Git**.
4. Autoriser Cloudflare à accéder à ton compte GitHub (popup OAuth).
5. Sélectionner le repo `72h-ecss`.
6. **Configuration build** :
   | Champ | Valeur |
   | --- | --- |
   | Project name | `72h-ecss-unite8` (donnera `72h-ecss-unite8.pages.dev`) |
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | *(laisser vide)* |
   | Build output directory | `hub` |
   | Root directory | *(laisser vide)* |
7. **Save and Deploy**.

Premier déploiement : ~1 minute. Suis le log dans l'interface.

Une fois fini → URL : `https://72h-ecss-unite8.pages.dev`

> Si tu choisis un autre nom de projet, **régénère le QR code** : voir [regen-qr.md](regen-qr.md).

---

## Étape 7 — Configurer les variables secrètes

Dans Cloudflare Pages :

1. Ouvrir le projet `72h-ecss-unite8` qu'on vient de créer.
2. **Settings** → **Environment variables** (ou **Variables and Secrets**).
3. Section **Production**.
4. Cliquer **Add variable** pour chacune :

   | Variable name | Type | Valeur |
   | --- | --- | --- |
   | `PASSCODE` | **Secret** (encrypt) | le passcode choisi étape 3 |
   | `TALLY_API_KEY` | **Secret** (encrypt) | la clé `tly-...` étape 1 |
   | `TALLY_FORM_ID` | **Secret** (encrypt) | l'ID du form étape 2 |

   > **Important** : cocher **Encrypt** sur chacune. Une fois encryptée, la valeur n'est plus visible — seul Cloudflare la fournit aux Functions à l'exécution.

5. **Save**.
6. Pour appliquer : **Deployments** → trouver le dernier → **Retry deployment** (force un rebuild avec les nouvelles env vars).

---

## Étape 8 — Tester

1. Ouvrir <https://72h-ecss-unite8.pages.dev/> → le hub doit s'afficher.
2. Scroller en bas du hub → cliquer **« Espace commission »** dans le footer.
3. Saisir le passcode → un mauvais passcode doit afficher *"Passcode invalide"*.
4. Saisir le bon passcode → le tableau des inscriptions doit charger.
5. Tester les filtres (Tous / Randonnée / Don de sang / Les deux).
6. Tester **Export CSV** → fichier téléchargé, ouvrable dans Excel.

> Pas d'inscriptions encore ? Faire une fausse soumission depuis `tally.so/r/xXoX7r` puis revenir et cliquer **Rafraîchir**.

---

## Étape 9 — Domaine personnalisé (optionnel)

Si tu veux `72h.dextera-group.com` au lieu de `*.pages.dev` :

1. Dans le projet CF Pages → **Custom domains** → **Set up a custom domain**.
2. Entrer `72h.dextera-group.com`.
3. Cloudflare donne un **CNAME** à ajouter chez ton registrar (ou s'il gère déjà ton DNS, ajout direct).
4. Attendre la propagation DNS (5 min à 1 h).
5. **Régénérer le QR** avec cette nouvelle URL — voir [regen-qr.md](regen-qr.md).

---

## Mettre à jour le site

Toute modification locale :

```bash
git add .
git commit -m "update: <description>"
git push
```

Cloudflare détecte le push, redéploie automatiquement (~1 min). Aucune action côté CF.

---

## Sécurité — bonnes pratiques

- ✅ Ne jamais commiter `.dev.vars` ou tout fichier contenant les secrets.
- ✅ Changer le `PASSCODE` après les 72H pour invalider l'accès commission.
- ✅ Révoquer la clé API Tally si elle fuite (Tally Settings → API keys → Revoke).
- ✅ Si un membre quitte la commission : changer le `PASSCODE` + retry deploy.
- ⚠️ Le passcode est **partagé** : pour vraie auth par membre, voir Cloudflare Access (Zero Trust, gratuit jusqu'à 50 users).

---

## Dépannage rapide

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| `/api/submissions` renvoie 500 | Env vars pas set | Vérifier les 3 variables + retry deploy |
| Toujours "Passcode invalide" | Faute de frappe ou env var pas appliquée | Retry deploy après modif env var |
| `Tally API injoignable` | Clé révoquée / quota | Regénérer la clé sur Tally |
| Page commission blanche | Function pas déployée | Vérifier que `hub/functions/api/submissions.js` est bien dans le repo |
| Le 8 du QR ne s'affiche pas | SVG corrompu | Relancer `node docs/qr-tools/generate-qr.js` |

---

## Récap des fichiers à NE PAS commiter

Déjà couverts par `.gitignore` :
- `docs/qr-tools/node_modules/`
- `.dev.vars`
- Tout fichier `.env`

Vérifier avec `git status` avant chaque push.
