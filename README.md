# Teranga Atlas Immobilier

Application immobilière avec site public, backoffice authentifié, API Node et stockage persistant. Identité visuelle approuvée : maquette 2, logo 5. Hébergement cible : Railway ; domaine personnalisé encore à choisir.

## Organisation

```text
apps/
  web/                  Site public React, point d’entrée HTML et médias graphiques
  backoffice/src/       Gestion des biens, demandes et paramètres de l’agence
  api/src/              Serveur HTTP, authentification et API métier
packages/
  database/             Connexion SQLite et migrations SQL versionnées
  media/                Stockage des photos : local ou Cloudinary
  shared/src/           Client API, résolution des médias et données partagées
tests/                  Tests API, production, migrations, médias et packaging
docs/
  architecture/         Architecture, données et stockage des photos
  deployment/           Procédure Railway
  product/              Conception fonctionnelle
  design/               Maquettes approuvées
  qa/                   Captures et rapports de validation
  archive/              Documents historiques du prototype
tools/documents/        Outils de génération documentaire
var/                    Données privées locales, exclues de Git et du déploiement
backups/                Sauvegarde privée préalable à la réorganisation
```

Le site et le backoffice sont des modules de code distincts et partagent actuellement une compilation frontend et un domaine. L’accès aux données et aux actions du backoffice est contrôlé par l’API. Cette séparation n’implique pas deux services frontend indépendants. Les modules sont gérés par un seul package npm à la racine.

## Développement

Node.js 24 ou supérieur, puis depuis la racine du dépôt :

```sh
npm ci
npm run dev -- --port 4173 --strictPort
```

Site : `http://127.0.0.1:4173/`. Backoffice : `http://127.0.0.1:4173/#/admin`.
Le premier compte est créé depuis l’écran d’administration ; aucun mot de passe par défaut. Les données existantes ont été conservées. Un fichier `.env` facultatif est chargé par les commandes de développement, démarrage et sauvegarde ; utiliser `.env.example` comme modèle local.

```sh
npm run build
npm start
npm test
```

Arrêter le serveur de développement avant de démarrer la version compilée sur le même port. Les tests emploient des bases temporaires ; les essais navigateur doivent utiliser `TAI_DATA_DIR=var/test-data`.

## Données et photos

La base active est `var/data/teranga.sqlite`, les photos locales sont dans `var/data/uploads/`. Le dossier est remplacé par un volume `/data` sur Railway. Les migrations s’appliquent au démarrage et préservent les tables existantes. Consulter [le modèle de données](docs/architecture/database.md).

Cloudinary est intégré comme fournisseur optionnel, activé par `MEDIA_STORAGE=cloudinary` et ses variables privées. Sans configuration, les photos restent locales. Le registre des médias conserve fournisseur, identifiant distant et URL ; il ne stocke pas les fichiers binaires dans SQLite. Les anciennes photos locales restent compatibles. Aucun envoi vers un compte Cloudinary réel n’a encore été effectué. Voir [le stockage des photos](docs/architecture/media.md).

`npm run backup` sauvegarde SQLite, les photos locales et un manifeste de contrôle. Vérifier avec `npm run backup:verify -- CHEMIN`. Les images Cloudinary ne sont pas téléchargées par cette commande et nécessitent une sauvegarde distincte.

## Mise en ligne et périmètre

[Guide Docker / Compose](docs/deployment/docker.md) · [Guide Railway](docs/deployment/railway.md) · [Architecture](docs/architecture/overview.md) · [Conception fonctionnelle](docs/product/conception-fonctionnelle-v1.md).

Le site n’est pas encore déployé. Les fonctionnalités existantes comprennent catalogue, recherche, fiches, demandes enregistrées, suivi administratif, photos et paramètres publics. Les comptes administrateur/agent, les affectations nominatives, le changement/récupération de mot de passe et la file de notifications SMTP sont disponibles : voir [comptes et notifications](docs/architecture/accounts-notifications.md). SMTP n’est pas encore configuré et aucun e-mail réel n’est envoyé. Restent notamment le planning des visites et les autres modules métier, les contenus officiels, la configuration de Cloudinary et de SMTP, les traductions, le référencement et la validation du déploiement public. La réorganisation du dépôt ne constitue pas une validation de mise en production de toutes ces fonctionnalités.
