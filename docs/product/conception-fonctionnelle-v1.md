# Conception fonctionnelle — Version 1

## Teranga Atlas Immobilier

**Statut :** première base à valider avant les wireframes\
**Date :** 21 août 2026

### Choix visuels validés le 14 octobre 2026

- **Maquette d'accueil retenue :** option 2 — `maquette-accueil-option-2.png`.
- **Logo retenu :** concept 5, paysage — `logo-teranga-atlas-immo-concept-v5-paysage.png`.
- Les prochaines maquettes et l'intégration du site prendront ces deux fichiers comme références, en utilisant le logo 5 dans la direction graphique de la maquette 2.
- Cette validation porte sur les choix visuels ; les décisions fonctionnelles de la section 10 restent à valider.

## 1. Objectif de la V1

La V1 doit permettre à une personne recherchant un bien au Maroc de trouver rapidement une offre pertinente, d'en comprendre les caractéristiques et de contacter Teranga Atlas Immobilier pour obtenir des informations, programmer une visite ou transmettre une demande de réservation sans paiement.

L'agence doit pouvoir publier ses biens et traiter les demandes depuis un espace d'administration simple.

## 2. Rôles

### Visiteur

- consulte les pages publiques ;
- recherche et filtre les biens ;
- ouvre une fiche détaillée ;
- partage une annonce ;
- demande des informations, une visite ou une réservation ;
- poursuit éventuellement l'échange sur WhatsApp.

### Agent immobilier

- se connecte à l'administration ;
- consulte les biens qui lui sont affectés ;
- traite les demandes reçues ;
- planifie les visites ;
- met à jour le statut des demandes et des biens.

### Administrateur principal

- dispose de tous les droits d'un agent ;
- crée, modifie, publie, masque et archive les annonces ;
- affecte les biens et les demandes aux agents ;
- gère les utilisateurs internes ;
- met à jour les contenus du site ;
- consulte et exporte les statistiques principales.

## 3. Arborescence publique

### 3.1 Navigation principale

1. Accueil
2. Acheter
3. Louer
4. Nos services
5. À propos
6. Conseils
7. Contact

### 3.2 Pages fonctionnelles

- Résultats de recherche
- Fiche détaillée d'un bien
- Demande d'informations
- Demande de visite
- Demande de réservation
- Confirmation de demande
- Partage et fiche PDF

### 3.3 Pages éditoriales

- Nos services
- À propos de Teranga Atlas Immobilier
- Actualités et conseils
- Témoignages
- FAQ
- Contact

### 3.4 Pages réglementaires

- Mentions légales
- Politique de confidentialité
- Politique de cookies
- Conditions d'utilisation

### 3.5 Langues

- Français, langue de référence
- Anglais
- Arabe avec interface de droite à gauche

## 4. Arborescence de l'administration

1. Tableau de bord
2. Annonces
   - Toutes les annonces
   - Ajouter une annonce
   - Brouillons
   - Biens publiés
   - Biens vendus ou loués
   - Archives
3. Demandes
   - Nouvelles
   - Affectées
   - Rendez-vous planifiés
   - Conclues
   - Abandonnées
4. Visites
5. Clients et propriétaires
6. Contenus du site
7. Médias et documents
8. Utilisateurs internes
9. Statistiques
10. Paramètres

## 5. Parcours utilisateurs prioritaires

### Parcours A — Rechercher et demander des informations

1. Le visiteur arrive sur l'accueil.
2. Il choisit « Acheter » ou « Louer ».
3. Il sélectionne la ville, le type de bien et ses critères essentiels.
4. Il consulte les résultats et ajuste les filtres.
5. Il ouvre la fiche d'un bien.
6. Il consulte les photos, les caractéristiques et la disponibilité.
7. Il sélectionne « Demander des informations ».
8. Il renseigne ses coordonnées et son message.
9. La demande est enregistrée et affectée à un agent.
10. Le visiteur reçoit une confirmation et peut poursuivre sur WhatsApp.

### Parcours B — Demander une visite

1. Le visiteur ouvre une fiche de bien.
2. Il sélectionne « Demander une visite ».
3. Il propose une date et un créneau.
4. Il renseigne ses coordonnées et accepte la politique de confidentialité.
5. L'agence reçoit la demande.
6. L'agent confirme ou propose un autre créneau par WhatsApp ou téléphone.

### Parcours C — Demander une réservation

1. Le visiteur sélectionne « Demander une réservation ».
2. Il renseigne les dates ou conditions souhaitées.
3. Le site précise qu'aucun paiement n'est demandé et que la réservation n'est pas encore confirmée.
4. La demande est transmise à l'agence.
5. Un agent vérifie la disponibilité et finalise l'échange sur WhatsApp.

### Parcours D — Publier une annonce

1. L'administrateur ouvre « Ajouter une annonce ».
2. Il renseigne les informations essentielles.
3. Il ajoute et ordonne les photographies.
4. Il choisit le prix visible ou « Prix sur demande ».
5. Il affecte le bien à un agent.
6. Il prévisualise l'annonce.
7. Le système signale les informations obligatoires manquantes.
8. L'administrateur publie l'annonce.

### Parcours E — Traiter une demande

1. Une nouvelle demande apparaît dans l'administration.
2. Elle est automatiquement affectée à un agent.
3. L'agent consulte le bien et les coordonnées du prospect.
4. Il contacte le prospect.
5. Il met à jour le statut de la demande.
6. Il programme une visite ou clôture la demande.

## 6. Informations d'une annonce

### Champs obligatoires avant publication

- Référence unique
- Titre
- Type de transaction
- Type de bien
- Ville
- Quartier ou zone
- Surface lorsque applicable
- Description
- Photographie principale
- Disponibilité
- Agent responsable
- Statut

### Champs complémentaires

- Prix ou « Prix sur demande »
- Adresse exacte ou zone approximative
- Nombre de pièces
- Nombre de chambres
- Nombre de salles de bain
- Bien meublé ou non
- Équipements
- Galerie de photos
- Vidéo ou visite virtuelle
- Plan du bien
- Documents téléchargeables
- Badge Nouveau, Exclusif ou Coup de cœur

## 7. Règles métier initiales

- Une annonce incomplète ne peut pas être publiée.
- Une annonce peut être enregistrée comme brouillon.
- Le prix peut être masqué au profit de la mention « Prix sur demande ».
- L'adresse exacte peut être masquée ; la ville et la zone restent visibles.
- Une demande doit toujours être liée à un bien lorsqu'elle provient d'une fiche.
- Toute nouvelle demande reçoit un statut, une date et un agent responsable.
- Une demande de réservation ne crée aucune obligation contractuelle et ne déclenche aucun paiement.
- Un bien vendu ou loué peut rester visible pendant une durée configurable avant archivage.
- Les médias et documents doivent respecter les formats, tailles et droits de diffusion autorisés.
- Les accès administratifs sont nominatifs et déterminés par le rôle.

## 8. Écrans à concevoir en premier

1. Accueil — ordinateur et téléphone
2. Résultats de recherche — ordinateur et téléphone
3. Fiche détaillée d'un bien — ordinateur et téléphone
4. Formulaire de demande et confirmation
5. Tableau de bord administratif
6. Liste des annonces dans l'administration
7. Création et modification d'une annonce
8. Liste et détail des demandes

## 9. Contenu nécessaire pour les wireframes

- Logo retenu : concept 5, paysage (validé le 14 octobre 2026)
- Une palette provisoire dérivée du logo
- Les coordonnées officielles de l'agence
- La liste définitive des services
- Dix à quinze annonces réalistes de démonstration
- Des photographies représentatives
- Les textes d'accueil, de présentation et de confiance
- Les questions fréquentes
- Les informations légales disponibles

## 10. Décisions à valider avant les maquettes détaillées

- Afficher ou non un filtre de prix dès la V1
- Afficher la carte uniquement sur la fiche ou la reporter entièrement en V2
- Afficher publiquement le nom et la photographie de l'agent
- Canal de confirmation initial : WhatsApp, SMS ou les deux
- Règle d'affectation automatique des demandes
- Durée d'affichage des biens vendus ou loués
- Nombre maximal de photographies par annonce
- Nécessité d'un rôle Agent distinct dès la V1

## 11. État actuel et suite

Le projet applicatif est désormais organisé à la racine : site dans apps/web, backoffice dans apps/backoffice, API dans apps/api et modules partagés dans packages. Les maquettes approuvées sont dans docs/design/maquettes-v1. Les formulaires enregistrent réellement les demandes ; l’administration gère les biens, photos, statuts et notes de suivi.

Docker Desktop a validé la construction, le démarrage, HTTPS local et la persistance. Le conteneur de test est accessible sur localhost:4180, avec un volume de données fictives séparé de var/data.

Le premier lot de complétion ajoute les comptes administrateur/agent, les affectations par identifiant et leurs contrôles d’accès, le changement/récupération de mot de passe et une file persistante de notifications SMTP. Les comptes existants sont préservés comme administrateurs. L’utilisateur n’a pas encore de service e-mail : SMTP reste non configuré et aucun message réel n’est envoyé.

La suite autorisée est décrite dans [la feuille de route](roadmap.md) : planning des visites et parcours métier manquants, autres modules du périmètre, contenus et référencement, puis configuration des services et recette sur Railway. Le déploiement public n’est pas effectué. Les arbitrages fonctionnels de la section 10 non couverts restent ouverts.
