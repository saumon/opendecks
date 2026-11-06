---
name: saumon-new-deck
description: Crée un nouveau deck OpenDecks (HTML autonome, thème « geek terminal ») sur un sujet donné, après recherche web. Pose les questions de cadrage (sujet, thématiques, nombre de slides, langue), propose un plan, écrit le deck dans decks/, le vérifie en navigateur headless, régénère index.html, met à jour README.md et commite sur dev. À utiliser pour « nouveau deck », « fais-moi une présentation sur… », « /saumon-new-deck ».
argument-hint: "[sujet]"
---

# saumon-new-deck

Crée un deck pour le dépôt OpenDecks (GitHub Pages, `decks/*.html`). Les règles du dépôt font foi : **relire `CLAUDE.md` et `CLAUDE.local.md` au démarrage** (ce dernier contient les termes interdits ; ne jamais les recopier dans un fichier versionné, ce skill compris).

Fichiers du skill (dans ce dossier) :
- `template.html` : squelette complet (CSP, CSS, runtime, barre de statut) avec un catalogue de patterns de slides. Dérivé de `decks/vi-vim-neovim.html`. **Partir de ce fichier, pas d'un deck existant** : `lean-tech.html` est en français et n'est donc pas un modèle valide pour la langue.
- `check-deck.cjs` : vérification automatique (débordements, clavier, mobile, impression, ressources externes).

Travailler depuis la racine du dépôt, sur la branche `dev`. Si l'arbre git n'est pas propre, le signaler avant de commencer.

## Étape 1 · Cadrage (AskUserQuestion)

Si `$ARGUMENTS` contient un sujet, ne pas le redemander. Poser en une seule fois (max 4 questions par appel, regrouper) :

1. **Sujet et angle** (si absent) : de quoi parle le deck, pour qui, pour quoi faire (présenter, convaincre, comparer, former) ? Si le sujet est vague, le dire et proposer 2-3 angles.
2. **Source** : recherche web uniquement, ou le sujet vient de notes internes (Notion, Confluence…) ? Dans le second cas, l'**anonymisation est obligatoire** (voir plus bas) et les notes sont lues avant la recherche.
3. **Nombre de slides** : proposer ~12 (court), **21 (norme du dépôt, recommandé)**, ~30 (long). Compter titre + fin dans le total.
4. **Langue** : **anglais par défaut**. Une autre langue uniquement si l'utilisateur la demande explicitement pour ce deck. Ne pas poser la question si rien ne laisse supposer autre chose ; l'annoncer dans le plan.

Ne pas poser de question dont la réponse découle du contexte ou d'une convention du dépôt.

## Étape 2 · Recherche

1. Recherche web **avant** de proposer les thématiques, pour qu'elles reflètent la réalité du sujet et pas seulement des connaissances génériques. Utiliser WebSearch (mode `extended` pour un sujet de niche, récent ou technique) puis lire les pages clés (WebFetch / agent `web-fetch`). Préférer sources primaires : docs officielles, dépôts, articles de l'auteur, benchmarks, papiers. Pour une bibliothèque, un framework ou un outil CLI, utiliser aussi Context7 (règle utilisateur globale).
2. Date du jour fournie par le contexte : privilégier les sources récentes et **indiquer les dates/versions** dans le deck quand un chiffre peut vieillir.
3. **Recouper** chaque chiffre, date, citation ou affirmation marquante avec au moins une source fiable. Ce qui n'est pas vérifié ne va pas dans le deck ; une divergence entre sources se signale (« selon X… ») plutôt que de trancher en silence. Ne jamais inventer de citation, de statistique, de version ni d'URL.
4. Tenir une liste de sources (titre, auteur/site, URL, date de consultation) pour la slide « Sources ».
5. Sujet sensible à l'identification (notes internes) : voir « Anonymisation » avant d'écrire quoi que ce soit.

## Étape 3 · Thématiques puis plan (validation obligatoire)

1. **Proposer 5 à 7 thématiques** issues de la recherche, avec une phrase chacune et une recommandation (lesquelles garder pour le nombre de slides choisi). Les faire choisir via AskUserQuestion (`multiSelect`, 4 options max par question : au-delà, découper en deux questions ou lister en texte et demander les ajustements). Inclure l'option « autre » implicite.
2. **Présenter le plan slide par slide** (tableau court) : n°, commande shell du prompt, titre, pattern de slide (voir `template.html`), message clé en une ligne, fenêtre de la barre de statut. Y faire figurer les fenêtres (4 à 7 noms courts, en minuscules, p. ex. `intro, history, tools, verdict, exit`), le nom de session `[xxx]` et le nom de fichier proposé.
3. Attendre la validation de l'utilisateur. Ne pas écrire le deck avant. Intégrer ses retours, sans re-présenter tout le plan s'ils sont mineurs.

Structure type (adaptable) : 1 titre · 2 TL;DR · corps regroupé par thématique (une fenêtre de statut par thématique) · comparaison / verdict · lundi matin / à retenir (facultatif) · **Sources** · **Questions?** (toujours en dernier).

## Étape 4 · Écriture

Copier `template.html` vers `decks/<nom-en-kebab-case>.html` (ASCII, sans espaces ni accents, nom court et parlant), puis remplacer **tous** les `{{placeholders}}`, supprimer les patterns inutilisés et dupliquer/adapter ceux dont on a besoin.

Règles non négociables (reprises de `CLAUDE.md`, à relire en cas de doute) :

- **Un seul fichier autonome**. CSS/JS/images en ligne (`data:`). Seule ressource externe tolérée : la feuille Google Fonts JetBrains Mono déjà dans le template. **Ne pas toucher à la CSP** ni au bloc CSS/JS du template (thème, canevas 1920×1080, navigation, impression, portrait).
- **`<title>` court** (carte d'accueil) et **`<meta name="description">` d'une ligne** (sous-titre). `<html lang>` cohérent avec la langue.
- **Thème geek terminal, sans variante** : palette du template uniquement (`#0e1116` / `#11161d` / `#0a1a12`, texte `#d8dee4`, vert `#3ddc84`, ambre `#f5a524`, gris `#7d8590`, rouge `#f85149`). Pas de nouvelle couleur, de nouvelle police ni de nouveau composant sans raison forte.
- **Chaque slide** : commence par une ligne de commande shell (`.prompt`, `~/dossier $ commande`, pertinente avec le contenu), puis un titre `h2` court **terminé par un point** (ou un `?`/`!` assumé). Cartes à bordure verte 3px (`.card`; `.warn` ambre pour l'élément mis en avant, `.dim` pour le secondaire). Schémas en ASCII ou blocs `pre`. Barre de statut tmux ajoutée par le JS : renseigner `wins`, le nom de session et `data-win` de chaque slide.
- **Texte dense interdit** : une slide = un message. Phrases courtes, 3 à 5 puces max, chiffres en gros (`.huge`/`.big`). Pas de paragraphes.
- **Zone utile** : padding 120/128/150, barre de statut 64px → environ 1664×810px sous le prompt. Rien ne doit déborder d'une carte ni de la zone utile ; réduire le texte ou la taille de police plutôt que de laisser déborder. Les `pre` ne font pas de retour à la ligne : les tableaux ASCII ne doivent pas dépasser la largeur de leur carte.
- **Échapper** `&`, `<`, `>` dans le HTML (`&amp;`, `&lt;`, `&gt;`).
- **Langue** : anglais par défaut. Si français demandé : espace insécable `&nbsp;` avant `? : ! ;` et à l'intérieur des guillemets « ».
- **Sources** : slide « Sources » avant la slide de fin, avec titres/domaines réels et date de consultation. Si une affirmation chiffrée est citée, la source doit y figurer.
- Les tailles de police du template (`.t` 34px, `.ts` 30px, `.label` 28px…) existent pour rester lisibles en salle ; ne pas descendre sous ~26px de texte courant.

## Anonymisation (si la source est interne : obligatoire)

Reprendre intégralement la section « Anonymisation » de `CLAUDE.md` : aucune mention de l'employeur, de ses marques, clients/membres, collègues, outils/projets/produits internes, acronymes d'équipe ; reformuler en termes génériques ; supprimer les remarques sur l'entreprise ou des personnes ; noms publics (auteurs de livres, entreprises citées dans une source publique) autorisés, **en cas de doute, retirer**. Établir la liste des termes sensibles à partir des sources **et** de `CLAUDE.local.md`, sans jamais les écrire dans un fichier versionné.

Même pour un deck 100 % web, appliquer les mêmes vérifications finales (ci-dessous) : c'est peu coûteux et le dépôt est public.

## Étape 5 · Vérifications (toutes obligatoires, corriger puis relancer)

1. `node .claude/skills/saumon-new-deck/check-deck.cjs decks/<nom>.html` : doit afficher `OK`. Il contrôle les débordements (cartes, `pre`, zone utile à 930px), la navigation clavier et l'ancre `#n`, la barre de statut sur chaque slide, l'absence de ressource externe hors Google Fonts, l'absence de défilement horizontal à 390px, le saut de page à l'impression et les erreurs JS. Si Playwright est introuvable, le script l'indique ; en dernier recours utiliser un autre navigateur headless disponible et faire les mêmes contrôles à la main.
2. **Contrôle visuel** : faire 3-4 captures (1920×1080) des slides les plus denses (comparaison, ASCII, chiffres) avec Playwright et les regarder (Read sur l'image). Corriger tout ce qui est coupé, illisible ou déséquilibré. Le script ne détecte pas la lisibilité.
3. **Contenu** : relire chaque slide contre la liste de sources (chiffres, dates, noms, versions). Vérifier qu'il ne reste aucun `{{`, `TODO`, `lorem`, ni lien/URL inventé.
4. **Anonymisation** : `grep -niE '<termes relevés>' decks/<nom>.html` doit être vide, plus la commande de vérification de `CLAUDE.local.md` (qui couvre aussi `README.md` et `CLAUDE.md`). Ne pas lister les termes dans la réponse finale si ce sont des termes interdits.

## Étape 6 · Index et README

1. `node scripts/build-index.mjs` pour régénérer `index.html` (ne jamais l'éditer à la main) et contrôler que le deck y figure avec le bon titre et le bon sous-titre.
2. `README.md` :
   - section **Decks** : ajouter **une ligne à la fin du tableau** : `| [<title>](https://saumon.github.io/opendecks/decks/<fichier>.html) | <résumé d'une phrase>. |` (le titre est identique au `<title>`; ajouter « In French. » ou la langue si ce n'est pas l'anglais) ;
   - section **Project structure** : ajouter `<fichier>.html` dans l'arborescence de `decks/`, **en ordre alphabétique**, en conservant l'alignement et les `├──`/`└──` (le dernier élément prend `└──`).
   - Ne rien changer d'autre dans le README.
3. Relire `git diff --stat` : seuls le deck, `index.html` et `README.md` doivent changer. Les dates de `index.html` viennent de git ; elles seront correctes après le commit (relancer `build-index.mjs` après le commit, et amender si `index.html` change, tant que rien n'est poussé).

## Étape 7 · Commit

- Commiter **ensemble** le deck, `index.html` et `README.md`, sur `dev`.
- Message : `Add '<Title>' deck: <ce qu'il couvre>` en anglais, impératif, une ligne (modèle : « Add 'Life after GitKraken' deck: free and open-source Git clients compared »). Pas de ligne d'attribution.
- **Ne pas pousser** sauf demande explicite de l'utilisateur.

## Étape 8 · Compte rendu

Réponse courte : chemin du deck, nombre de slides, thématiques couvertes, résultat des vérifications, URL future (`https://saumon.github.io/opendecks/decks/<fichier>.html`, active après push sur `dev`), hash du commit, et ce qui n'a pas pu être vérifié ou reste incertain (sources contradictoires, chiffres non recoupés). Proposer le push, sans l'effectuer. Pour ouvrir le deck : `python3 -m http.server 8000` puis `http://localhost:8000/decks/<fichier>.html`.
