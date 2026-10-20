# Maquettes V1 — Teranga Atlas Immobilier

Date : 14 octobre 2026. Statut : propositions à examiner, sans validation fonctionnelle implicite.

## Références validées

- Direction graphique : `../maquette-accueil-option-2.png`.
- Logo : `../logo-teranga-atlas-immo-concept-v5-paysage.png`.
- Fond crème, vert profond, accents ocre, titres à empattements et textes sans empattements.

## Écrans

- `accueil-ordinateur.png` : adaptation de l'accueil choisi avec le logo 5.
- `accueil-mobile.png` : accueil en colonne, menu compact, recherche et sélection de biens.
- `recherche-ordinateur.png` : recherche, filtres latéraux, grille et tri.
- `fiche-bien-ordinateur.png` : galerie, caractéristiques, localisation approximative et contact.

Ces images sont des maquettes statiques générées avec l'outil intégré ImageGen. Elles ne constituent pas un site fonctionnel. Les biens, photographies, prix et caractéristiques servent uniquement de démonstration. Les affirmations de confiance devront être vérifiées par l'agence avant publication.

## Comportements attendus lors de l'intégration

### Accueil

- Acheter/Louer sélectionne le type de transaction ; ville et type de bien alimentent la recherche.
- Le bouton de recherche ouvre les résultats avec les critères conservés.
- Sur mobile, contrôles sur toute la largeur, zones tactiles d'au moins 44 px et menu accessible.
- Les entrées de navigation et les liens de contact doivent rester accessibles sur mobile.

### Recherche

- Appliquer les filtres met à jour les résultats et leur nombre ; réinitialiser efface les critères.
- Prévoir les états chargement, aucun résultat et erreur avec une action de reprise.
- Le tri et la pagination conservent les filtres ; la pagination n'apparaît que si le nombre de résultats la justifie. La pagination du visuel est illustrative.
- Sur mobile : grille à une colonne et bouton « Filtres » ouvrant un panneau avec appliquer/effacer/fermer ; restituer le focus à sa fermeture.
- Les choix mutuellement exclusifs, comme meublé oui/non/peu importe, utilisent des boutons radio lors de l'intégration, même si le rendu suggère des cases.

### Fiche du bien

- Galerie ouvrable avec navigation et fermeture au clavier ; partage de lien et fiche PDF à prévoir dans la version fonctionnelle.
- La demande de visite ouvre un formulaire : coordonnées, date/créneau souhaité, message et information sur les données personnelles.
- Demandes d'informations et de réservation liées à la référence du bien ; confirmation de réception distincte d'une réservation confirmée.
- Sur mobile : galerie puis titre/prix et caractéristiques en colonne ; barre de contact avec visite et WhatsApp, sans masquer le contenu.
- Aucun numéro de téléphone ou nom d'agent fictif ne doit être intégré comme contact réel.

## Hypothèses conservées en attente d'arbitrage

- Aucun favori, compte client ou carte interactive dans ces propositions V1.
- Pas de filtre de budget dans ces nouvelles propositions ; décision finale encore ouverte.
- Paiement absent ; réservation soumise à confirmation de l'agence.
- Coordonnées définitives, traductions anglais/arabe, adresse exacte, visibilité des agents et canal de confirmation restent à préciser.
- Le rôle agent, l'affectation automatique et les autres décisions de la section 10 de la conception fonctionnelle restent ouverts.

## Consignes de génération

Chaque appel utilise les deux fichiers de référence visuelle et demande un écran indépendant :

1. Accueil ordinateur : préserver la composition de la maquette 2, insérer le logo 5, retirer les favoris et remplacer budget par quartier ; cible 1440 × 1100.
2. Accueil mobile : décliner la même identité en colonne, recherche Acheter/Louer, ville/type, CTA ocre et bien sélectionné ; cible 390 × 1100.
3. Recherche ordinateur : Marrakech, filtres surface/chambres/meublé/disponibilité, grille de six biens de démonstration, sans carte ni favoris ; cible 1440 × 1100.
4. Fiche ordinateur : riad de démonstration TAI-MRK-001, galerie, caractéristiques et contact visite/WhatsApp ; préciser réservation sans paiement, sans inventer de coordonnées ; cible 1440 × 1250.

Les dimensions indiquent les cibles de composition ; les rendus bitmap peuvent avoir une résolution différente. La fidélité exacte du logo et les petits textes seront assurés lors de l'intégration avec les fichiers source et du texte HTML.
