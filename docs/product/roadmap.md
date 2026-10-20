# Ordre de réalisation retenu

L’utilisateur a validé la progression suivante pour compléter l’application. L’état ci-dessous distingue code livré et services externes restant à configurer.

## 1. Comptes et notifications — implémenté localement

- Gestion de comptes administrateur/agent, activation/désactivation.
- Affectation nominative des biens et demandes, restrictions d’accès côté API.
- Changement de mot de passe et récupération par lien expirant à usage unique.
- File persistante d’alertes agence/agent et d’accusés de réception prospect.
- Suivi des envois et reprise après panne SMTP.
- Migration des données existantes, tests et image Docker mis à jour.

À configurer avant utilisation réelle : l’adresse professionnelle et le service SMTP. L’utilisateur a indiqué ne pas en avoir pour le moment. Aucun vrai e-mail envoyé ; la récupération par e-mail est explicitement indisponible tant que le service n’est pas configuré. Les SMS et messages WhatsApp automatiques restent à traiter séparément.

## 2. Parcours métier manquants — prochaine étape

Planning des visites : date confirmée, report, annulation et vue calendrier, liés aux agents et aux demandes. Puis gestion des clients/propriétaires et enrichissement du suivi des réservations sans paiement. Préserver la distinction entre demande du prospect et confirmation de l’agence.

## 3. Compléter le périmètre fonctionnel

Gestion éditoriale des pages, conseils/articles, FAQ et témoignages ; médiathèque et documents/plans/vidéos ; prévisualisation et ordre des photos ; fiche PDF, statistiques et exports ; anglais/arabe avec interface RTL. Les arbitrages fonctionnels encore ouverts sont consignés dans la conception initiale.

## 4. Contenus et référencement

Coordonnées et textes officiels, vraies annonces et photos autorisées ; URLs publiques sans #, métadonnées par annonce, partage et sitemap. Vérifications sur ordinateur et mobile des parcours complets.

## 5. Services et mise en ligne

Configurer Cloudinary si retenu, SMTP et le projet Railway ; volume persistant, domaine, sauvegardes externes et restauration testée, suivi des erreurs/disponibilité. Recette en environnement public de test avant ouverture réelle. Docker Desktop est validé localement, mais ne remplace pas cette recette sur Railway.
