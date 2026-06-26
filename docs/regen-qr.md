# Régénérer le QR code

Le QR code de `hub/assets/qr-code.svg` pointe par défaut vers `https://72h-ecss-unite8.pages.dev/`.

Si l'URL Cloudflare Pages finale est **différente** (sous-domaine custom, autre nom de projet, etc.), il faut régénérer le QR.

## Une seule commande

Depuis la racine du projet :

```bash
cd "docs/qr-tools"
node generate-qr.js https://nouvelle-url.pages.dev/
```

Le fichier `hub/assets/qr-code.svg` est écrasé avec le nouveau QR.

## Vérification

1. Ouvrir `hub/assets/qr-code.svg` dans Chrome/Edge → le QR doit s'afficher.
2. Le scanner avec l'application appareil photo de ton téléphone Android.
3. Confirmer que l'URL ouverte est bien la bonne.

## Impression A3/A4

Le SVG est vectoriel — il s'imprime sans perte à n'importe quelle taille.

Pour une **affiche A3** : ouvrir le SVG dans Chrome, `Ctrl+P`, format A3, marges minimales, sans en-tête.

Pour une **affiche A4** : idem, format A4.

## Niveau de correction d'erreur

Le QR utilise **niveau H (30%)** : il reste lisible même si le "8" central couvre une partie du code, et tolère taches, plis ou photo floue. Aucune intervention nécessaire.

## Dépannage

| Problème | Solution |
| --- | --- |
| `Cannot find module 'qrcode'` | Réinstaller : `cd docs/qr-tools && npm install` |
| QR illisible | Vérifier que l'URL ne contient pas d'espace ; relancer le script |
| Couleurs cassées | Ne pas éditer le SVG à la main, toujours passer par le script |
