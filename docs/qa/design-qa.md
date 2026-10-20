# Vérification du prototype — 14 octobre 2026

## Extension : administration et enregistrement réel

L'application a été étendue à la demande de l'utilisateur : API Node, SQLite persistante et administration. Les paragraphes historiques ci-dessous décrivent le prototype antérieur ; les formulaires de la version actuelle ne sont plus simulés.

- Tests API : `npm run test:api` — trois groupes réussis, couvrant authentification, expiration, contrôle d'origine, confidentialité, création/publication, suivi des demandes, masquage, photos et réouverture de la base.
- Compilation : `npm run build` réussie. Application compilée démarrée avec `npm start` sur le port de test 4175, API et frontend vérifiés ensemble ; console sans erreur dans cet onglet neuf.
- Parcours navigateur : compte créé uniquement dans `qa/runtime-test`, création et publication de QA-LOCAL-001, consultation dans le catalogue, envoi public de DEM-00001, affectation automatique à l'agent du bien, statut « Prise en charge », modification de l'agent et des notes, rechargement et contrôle de la conservation.
- Équipements : une terrasse renseignée apparaît ; climatisation/piscine ne sont pas ajoutées automatiquement au bien testé.
- Accès direct anonyme aux demandes : 401. Accès HTTP aux fichiers SQLite et au code du serveur via Vite : 403. Les noms internes des agents sont retirés du JSON du catalogue public.
- Sauvegarde testée sur la base isolée avec `npm run backup` : instantané SQLite produit, sans modification de la base utilisateur.
- Captures : `qa/admin-biens-ordinateur.png`, `qa/admin-edition-ordinateur.png`, `qa/admin-demandes-ordinateur.png`, `qa/admin-demandes-mobile.png`. Contrôles à 1440 × 1000 et 390 × 844, sans débordement horizontal de la page mobile observée. Le tableau des biens possède son propre défilement horizontal aux petites largeurs.
- Palette, logo, fontes et contrôles réutilisent le site validé. Les écrans administratifs sont nouveaux ; il n'existe pas de référence bitmap approuvée pour une comparaison pixel par pixel de ces écrans. Ils ont été examinés directement dans le navigateur.
- Les erreurs HMR observées pendant les écritures de fichiers ne se reproduisent pas dans la version compilée.
- Aucun compte de test n'a été créé dans `data/`. L'administration utilisateur reste à initialiser par son propriétaire. Le serveur de développement existant du site est conservé sur 4173.

Résultat de cette extension : parcours vérifiés et compilation réussie. Limites : version locale, un compte administrateur initial, agents affectés par leur nom, sans comptes agents séparés ni notifications externes automatiques.

final result: passed

Contrôle final effectué sur les captures navigateur après intégration du visuel villa et corrections. Aucun défaut P0/P1/P2 restant dans le périmètre du prototype ; les écarts explicitement décrits ci-dessous concernent les données de démonstration, les contrôles natifs et les dimensions tactiles.

## Sources et normalisation

- Sources : `../maquettes-v1/accueil-ordinateur.png` (1435 × 1096), `accueil-mobile.png` (924 × 1703), `recherche-ordinateur.png` (1435 × 1096), `fiche-bien-ordinateur.png` (1347 × 1168).
- Navigateur : navigateur intégré Codex, captures réelles dans `qa/`, densité 1.
- Accueil et recherche : viewport CSS 1435 × 1096, largeur utile 1420 avec barre de défilement. Fiche : 1347 × 1168, largeur utile 1332. Mobile : 390 × 844, largeur utile entre 375 et 390 selon défilement. Tablette : 834 × 1194.
- Les captures pleine page incluent les contenus sous le viewport et le pied de page absent des références. Comparaisons : `qa/home-comparison.jpg`, `mobile-comparison.jpg`, `search-comparison.jpg`, `detail-comparison.jpg`, référence à gauche et rendu à droite.
- Le fichier mobile généré ne respecte pas le ratio 390 × 1100 demandé à l'origine : il mesure 924 × 1703. La comparaison normalise la largeur à 390 ; le prototype conserve des contrôles tactiles réels d'au moins 44 px, donc une page plus longue. Ce choix d'accessibilité est explicite, sans prétention de reproduction pixel par pixel.

## Historique des corrections

1. Comparaison initiale : `qa/comparison-before.jpg`, source et rendu réunis. [P2] Titres trop fins, logo trop petit en raison des marges du fichier source. Correction : Georgia gras, échelles adaptées et version transparente du logo sans les grandes marges.
2. [P2] Galerie mobile débordant horizontalement. Correction : pistes `minmax(0,1fr)`, `min-width:0`, tailles d'images contraintes. Capture après correction : `qa/detail-mobile.png` ; aucun contrôle masqué et aucune barre horizontale utile.
3. [P2] Sur tablette, titre desktop avec retours forcés chevauchant le moteur de recherche. Correction : suppression des retours forcés et taille 36 px entre 601 et 950 px. Capture après correction : `qa/home-tablet.png`, titre et moteur séparés.
4. [P2] Accueil mobile trop long et trop différent de la référence. Correction : titre court sur deux lignes, image plus compacte, réassurance sur trois colonnes, une annonce mise en avant, suppression du bloc éditorial desktop sur mobile. Capture après correction : `qa/home-mobile.png`.
5. [P2] Cases et boutons radio étirés par la hauteur minimum des champs texte. Correction : minimum 17 px pour l'icône et ligne compacte sur ordinateur ; libellés de filtres mobiles conservés à 44 px. Capture après correction : `qa/search-desktop.png` et comparaison réunie `qa/search-comparison.jpg`.

## Surfaces vérifiées

- **Typographie** : titres Georgia gras, interface DM Sans / Arial. Hiérarchie, retours du titre, libellés et montants lisibles. Georgia constitue une approximation éditoriale de la fonte non spécifiée du rendu généré.
- **Espacements et composition** : accueil à deux colonnes, recherche superposée, trois éléments de réassurance, sélection de biens. Recherche à filtres latéraux et grille ; fiche à galerie et panneau de contact. Mobile en colonne, filtres en fenêtre, contact fixe sur fiche. Le pied de page de démonstration et les contrôles natifs augmentent la hauteur totale.
- **Couleurs** : fond crème `#fbf9f5`, texte vert `#183c30`, actions vertes `#194b36`, ocre `#ad6b18`, séparateurs `#e5e0d8`. États sélectionnés et focus visibles.
- **Images et icônes** : images raster générées à partir des références, photos compressées WebP ; logo nettoyé par ImageGen, source originale conservée. Icônes Phosphor, sans dessin CSS/SVG artisanal. Les scènes sont des illustrations, pas les photographies de biens réels.
- **Textes** : cohérents avec les références, annonces de démonstration signalées, réservation sans paiement et sans confirmation contractuelle. « Biens vérifiés » remplacé par « Une sélection attentive » pour éviter une affirmation non vérifiée. Le nombre de résultats correspond aux données filtrées.
- **Régions ciblées** : en-tête/logo, titre, moteur de recherche, cartes et bloc contact examinés dans les captures navigateur à taille native, en complément des comparaisons pleine page.

## Interactions vérifiées dans le navigateur

- Recherche Marrakech : résultats exclusivement Marrakech à la vente.
- Surface minimum 200 : deux résultats dans le jeu initial ; surface minimum 9999 : état vide ; réinitialiser rétablit la liste.
- Tri par surface : villa 350 m², riad 220 m², riad 180 m², appartement 110 m², appartement 95 m² dans le jeu initial.
- Navigation vers une fiche ; galerie, photo suivante et fermeture Échap.
- Formulaire visite : nom, téléphone, date future, case d'information ; confirmation de simulation affichée ; aucune transmission ni réservation réelle.
- Navigation mobile vers Louer : deux annonces avec prix mensuels.
- Filtres mobiles : surface minimum 100 réduit les locations à un riad ; appliquer ferme la fenêtre.
- Fermeture Échap des filtres : focus rendu au bouton Filtres.
- Console de l'onglet final neuf : aucune erreur lors du parcours observé. Une erreur HMR transitoire pendant une écriture antérieure a disparu après rechargement et n'est pas reproduite.
- Compilation finale `npm run build` réussie après les modifications.
- Jeu final : six biens à vendre à Marrakech ; ajout d'une villa de 420 m². Les essais initiaux de filtre et de tri ci-dessus décrivent le jeu avant cet ajout. L'intégration finale vérifie le nouveau décompte et le chargement de toutes les images.

## Limites et finitions

- Pas d'audit complet de lecteur d'écran ni de mesure Lighthouse. Le test tablette concerne principalement l'accueil.
- Les versions anglaise et arabe, le backend, l'administration, l'export PDF et les communications WhatsApp/SMS restent hors de ce prototype.
- [P3] Ajuster ultérieurement les détails de fonte, les photos originales et certains espacements lorsque la charte et les contenus définitifs seront disponibles.
- [P3] Les biens de démonstration peuvent partager certaines images ; les fichiers réels devront être propres à chaque annonce.
# Extension préparation Railway — 14 octobre 2026

Les paramètres publics de l’agence ont été vérifiés sur la version compilée, port 4174, avec la base isolée `qa/runtime-test`. Connexion, affichage des points à compléter, saisie de coordonnées fictives et sauvegarde confirmée ; aucune erreur navigateur constatée. Capture : `qa/admin-parametres-ordinateur.png`. Aucune donnée de test ajoutée à la base de l’utilisateur.

Validation : 3 tests API, 2 tests production/sauvegarde et 4 tests de packaging passent ; compilation Vite réussie. Les tests production couvrent l’origine, le contrôle de santé, le code d’installation, le cookie Secure, les paramètres persistants et l’absence d’annonces de démonstration. La sauvegarde est contrôlée avec une vraie photo, lecture de la base sauvegardée et détection d’altération. Vérification React : chargements indépendants en parallèle, nettoyage des écouteurs, champs associés à leurs libellés, états de chargement/enregistrement et messages accessibles.

Limite : ni Docker ni Railway CLI ne sont installés localement. L’image Docker et le fonctionnement derrière le domaine/volume Railway doivent être validés au premier déploiement. Le contrôle local des prérequis ne remplace pas cette validation. Les contenus officiels restent à saisir par l’agence ; le tableau de préparation indique leur présence sans certifier leur exactitude.
