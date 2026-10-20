# Teranga Atlas Immobilier — application et préparation Railway

Version du 14 octobre 2026. Le site public et l’administration utilisent désormais une API Node et une base SQLite persistante. L’identité visuelle reste celle de la maquette 2 et du logo 5.

## Utilisation

Node.js 24 ou supérieur est requis. Pour le développement :

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Pour utiliser la version compilée, arrêter d'abord le serveur de développement s'il utilise le même port :

```sh
npm run build
npm start
```

Site : http://127.0.0.1:4173/ ; administration : http://127.0.0.1:4173/#/admin.
Le premier accès à l’administration propose de créer le compte administrateur. Aucun identifiant ni mot de passe par défaut n’est fourni. Les sessions expirent après huit heures ; le mot de passe est haché avec scrypt. Les coordonnées et notes des demandes nécessitent une connexion.

## Fonctions disponibles

- Créer et modifier une annonce, sa référence, son prix ou « Prix sur demande », sa description, ses équipements, son agent et sa disponibilité.
- Importer des photos JPEG/PNG/WebP, choisir la principale et retirer une photo de la galerie. Limites : 5 Mo par photo, 20 photos par annonce. Le retrait d’une galerie ne supprime pas physiquement le fichier.
- Enregistrer un brouillon, publier, masquer, marquer vendu/loué et archiver. Les annonces incomplètes ne peuvent pas devenir publiques. Masqué et Archivé retirent le bien du catalogue sans supprimer les demandes liées.
- Rechercher les biens publics et consulter leurs fiches. Les caractéristiques et photos proviennent de la base ; les équipements ne sont plus inventés à partir du type de bien.
- Envoyer de vraies demandes d’informations, de visite, de réservation ou de contact. La confirmation affiche une référence DEM. L’agent du bien est affecté à la demande ; les contacts généraux restent à affecter.
- Consulter les demandes, rechercher un prospect, changer le statut, affecter un agent par son nom et enregistrer des notes internes.
- Les visites et réservations sont fermées pour les biens vendus ou loués. Une demande d’informations reste possible.

L’agence doit consulter son administration pour traiter les nouvelles demandes. Aucune notification SMS, e-mail ou WhatsApp automatique n’est encore envoyée. Le bouton WhatsApp ouvre une conversation lorsque le numéro est configuré dans Paramètres ; sinon il propose un formulaire de contact enregistré.

## Données et sauvegarde

La base se trouve dans `data/teranga.sqlite` et les photos importées dans `data/uploads/`. Ces données restent après actualisation du navigateur, déconnexion ou redémarrage du serveur. Elles sont exclues de Git et ne sont jamais livrées dans `dist/client`.

En développement uniquement, à la première création de la base, les neuf annonces d’illustration sont importées une seule fois et marquées « Démonstration ». Elles peuvent être archivées. Les nouvelles annonces sont des annonces ordinaires, sauf activation de la case de démonstration. Choisir une illustration fournie active cette case.

```sh
npm run backup
```

Cette commande crée un dossier complet dans `data/backups/` : instantané SQLite cohérent, photos et manifeste de contrôle SHA-256. Vérifier avec `npm run backup:verify -- CHEMIN_DU_DOSSIER`. Exporter une copie privée hors du volume ; les étapes de restauration et Railway sont décrites dans [RAILWAY.md](RAILWAY.md).

`TAI_DATA_DIR` permet de choisir un autre dossier de données ; `PORT` change le port de `npm start`. Ne pas réutiliser le dossier de tests pour vos données réelles.

## Vérifications

```sh
npm run test:api
npm run test:production
npm run build
```

Les tests couvrent l’authentification, l’expiration des sessions, les origines de requêtes, la confidentialité des demandes, le cycle publication/demande/suivi/masquage, les validations, les photos et la persistance après réouverture de SQLite. Ils utilisent des bases temporaires.

Les essais navigateur utilisent exclusivement `TAI_DATA_DIR=qa/runtime-test` sur le port 4174, avec des coordonnées fictives. Captures dans `qa/admin-*.png` ; rapport dans `design-qa.md`.

## Périmètre de cette version

L’application est accessible sur cet ordinateur via l’interface de bouclage (127.0.0.1). Elle n’est pas encore déployée sur Internet. Le serveur Node est nécessaire : un hébergement statique ou `vite preview` ne fournit pas l’API ni la persistance. Les fichiers historiques de packaging Sites sont conservés, mais leur worker statique n’héberge pas cette nouvelle API.

La configuration Railway (Docker, volume, HTTPS et contrôle de santé) est préparée dans [RAILWAY.md](RAILWAY.md), sans déploiement effectué. Les paramètres de l’agence, les textes publics et WhatsApp sont modifiables dans l’administration.

Restent notamment : configuration effective de Railway, comptes agents avec droits séparés, traductions anglaise/arabe, export PDF, confirmations externes et textes officiels de l’agence. Aucun paiement ni confirmation contractuelle de réservation n’est effectué.

## Références et médias

Références validées : `../maquettes-v1/`. React 19, Vite, icônes Phosphor ; photos d’illustration générées avec ImageGen et compressées en WebP. Titres Georgia, interface DM Sans / Arial. Le logo original reste dans le dossier parent ; sa version transparente est dans `public/assets/`.
