# 72H ECSS · Unité 8 — Logistique Digitale

Hub digital pour les **72H ECSS** organisées par le **CCQ Unité 8 — Parcelles Assainies** les **7, 8 et 9 août 2026**.

## Structure

```
72H U8/
├── hub/                          → Site Cloudflare Pages (= build output)
│   ├── index.html                  Page d'accueil publique
│   ├── style.css
│   ├── script.js
│   ├── commission/                 Page verrouillée (accès passcode)
│   │   ├── index.html
│   │   └── app.js
│   ├── functions/                  Cloudflare Pages Functions
│   │   └── api/
│   │       └── submissions.js      Endpoint POST avec auth + fetch Tally
│   └── assets/
│       └── qr-code.svg
├── print/                        → Imprimables (HTML → PDF via navigateur)
│   ├── fiche-inscription.html      A5 recto
│   └── guide-commission.html       A4 recto
├── docs/
│   ├── deploy-cloudflare.md        Guide complet déploiement GitHub → CF Pages
│   ├── guide-tally.md              Consultation des réponses Tally (admin)
│   ├── regen-qr.md                 Régénérer le QR si URL change
│   └── qr-tools/                   Script Node de génération QR
└── README.md
```

## Liens en production

- **Formulaire Tally** : <https://tally.so/r/xXoX7r>
- **Hub** : `https://72h-ecss-unite8.pages.dev/` *(URL définitive après déploiement Cloudflare)*
- **Espace commission** : `/commission/` (lien discret dans le footer du hub, protégé par passcode)

## Déploiement

Tout est documenté dans **[docs/deploy-cloudflare.md](docs/deploy-cloudflare.md)** :

1. Récupérer la clé API Tally + l'ID du formulaire
2. Choisir un passcode (12+ caractères)
3. Créer un repo GitHub
4. `git init && git add . && git commit -m "init" && git push`
5. Cloudflare Pages → Connect to Git → output directory = `hub`
6. Configurer 3 variables d'env (`PASSCODE`, `TALLY_API_KEY`, `TALLY_FORM_ID`)
7. Tester l'accès commission avec le passcode

## Impression des fiches

Ouvrir `print/fiche-inscription.html` ou `print/guide-commission.html` dans Chrome/Edge → `Ctrl+P` → **Enregistrer en PDF** → format A5 ou A4 selon le fichier.

## Placeholders à remplacer avant impression/déploiement

- `{{WHATSAPP_CCQ}}` → numéro WhatsApp principal CCQ Unité 8 (format `221XXXXXXXXX`)
  - 2 occurrences dans `hub/index.html`
  - 1 occurrence dans `print/guide-commission.html`
- URL hub si différente de `72h-ecss-unite8.pages.dev` → relancer `node docs/qr-tools/generate-qr.js <nouvelle-url>`

