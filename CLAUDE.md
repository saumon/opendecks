# CLAUDE.md

OpenDecks : des decks HTML autonomes dans `decks/`, publiés sur GitHub Pages. `scripts/build-index.mjs` génère `index.html`. Ce script tourne en CI à chaque push sur `dev`, la seule branche du dépôt.

## Créer un nouveau deck

1. **Fichier** : un seul `.html` autonome, `decks/<nom-en-kebab-case>.html`, sans espaces ni accents. Seuls les fichiers à la racine de `decks/` sont indexés.
2. **Métadonnées** :
   - Un `<title>` court, qui devient le titre de la carte sur l'accueil.
   - Une `<meta name="description">` d'une ligne, qui devient le sous-titre.
3. **Tout en ligne** : CSS, JS et images (`data:` URI). Seule exception : la police Google Fonts. Pas d'autre ressource externe. La CSP en tête du deck doit rester compatible.
4. **Style** : reprendre le style « geek terminal » des decks existants. `decks/lean-tech.html` est la base la plus propre à copier.
   - Canevas 1920×1080 mis à l'échelle.
   - Police JetBrains Mono.
   - Couleurs : fonds `#0e1116` / `#11161d` / `#0a1a12`, texte `#d8dee4`, vert `#3ddc84`, ambre `#f5a524`, gris `#7d8590`, rouge `#f85149`.
   - Chaque slide commence par une ligne de commande shell (`~/dossier $ commande`), suivie d'un titre court terminé par un point.
   - Cartes à bordure verte de 3px. Schémas en ASCII ou en blocs `pre`.
   - Barre de statut façon tmux en bas de chaque slide.
5. **Navigation** :
   - Clavier : flèches, espace, Home/End, `f` pour le plein écran.
   - Clic, balayage tactile, ancre `#n` dans l'URL.
   - Impression : une page par slide.
   - Écran portrait : slides empilées, sans défilement horizontal.
6. **Langue** : celle des sources ou celle demandée par l'utilisateur. En français, mettre une espace insécable (`&nbsp;`) avant `? : ! ;` et à l'intérieur des guillemets « ».

## Anonymisation (obligatoire)

Les decks sont publics. Quand un deck vient de notes internes (Notion, Confluence, etc.), il doit être **anonymisé** :

- **Aucune mention de l'employeur ni de sa marque**, même mal orthographiée ou en abrégé. Pas non plus de terme qui l'identifie indirectement, comme le nom donné à ses clients ou à ses membres.
- **La liste des termes interdits est dans `CLAUDE.local.md`**, un fichier ignoré par git et chargé automatiquement. Ne jamais recopier ces termes dans un fichier versionné, ce fichier-ci compris : le dépôt est public.
- **Aucun nom de collègue** : prénoms, noms, auteur de la note ou personne qui l'a proposée.
- **Aucun nom d'outil, de projet ou de produit interne**, ni d'acronyme d'équipe ou de service, ni de détail de la stack interne permettant d'identifier l'entreprise.
- **Reformuler en termes génériques** les remarques du type « ce qu'on ne fait pas chez nous ». Les remarques sur l'entreprise ou sur des personnes sont supprimées.
- **Les noms publics restent autorisés** : auteurs d'un livre, entreprises citées en exemple dans une source publique (Amazon, Google…). En cas de doute, retirer.
- **Avant de commiter**, chercher dans le deck les termes sensibles relevés dans les sources (`grep -niE 'terme1|terme2|…' decks/<deck>.html`). Le résultat doit être vide.

## Après création ou modification d'un deck

1. **Vérifier le rendu** dans un navigateur headless (Playwright est disponible) :
   - Aucun élément ne déborde de sa carte ni de la zone utile (padding 120/128/150, barre de statut de 64px).
   - La navigation au clavier fonctionne.
   - Pas de défilement horizontal en vue mobile (390px).
2. **Régénérer l'index** : `node scripts/build-index.mjs`.
3. **Mettre à jour `README.md`** :
   - Une ligne par deck dans le tableau de la section **Decks** : lien vers `https://saumon.github.io/opendecks/decks/<fichier>.html` et résumé d'une phrase, avec la langue si ce n'est pas l'anglais.
   - Le deck dans l'arborescence de la section **Project structure**.
4. **Commiter ensemble** : le deck, `index.html` et `README.md`, sur `dev`. Pousser seulement si l'utilisateur le demande.

## Prévisualisation locale

```bash
node scripts/build-index.mjs
python3 -m http.server 8000   # http://localhost:8000
```
