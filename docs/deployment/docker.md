# Déploiement Docker

Le Dockerfile compile les interfaces, puis produit une image Node 24 contenant uniquement le site compilé, le serveur et ses modules. Le backend utilise les modules natifs Node et Nodemailer pour SMTP. Seul le module Nodemailer, sans dépendances transitives, est copié depuis la construction dans l’image finale. Les données, sauvegardes et fichiers .env sont exclus de la construction.

## Docker Compose sur un serveur

Pour les tests locaux sans domaine ni certificat, `compose.local.yaml` adapte l’application en HTTP sur la boucle locale uniquement (`http://localhost:4180`), sans proxy Caddy. Cette surcharge est réservée au développement ; ne pas l’utiliser pour le déploiement public. Sur cet ordinateur, le projet isolé `teranga-validation` utilise les données fictives et la configuration privée existante :

```sh
docker compose --env-file var/docker-validation/.env -p teranga-validation -f compose.yaml -f compose.local.yaml up -d --no-build --wait app
```

Le conteneur reste démarré pour les essais utilisateur. Cette commande réutilise l’image `teranga-atlas:validation` et le volume de test, sans accéder à `var/data`.

Prérequis : Docker Engine avec Compose v2, un domaine/sous-domaine pointant vers ce serveur et les ports 80/443 disponibles. Depuis la racine du dépôt :

```sh
cp .env.docker.example .env.docker
```

Renseigner DOMAIN (sans https:// ni chemin) et un ADMIN_SETUP_TOKEN aléatoire d’au moins 32 caractères. Aucun secret par défaut n’est fourni. Une commande de génération est indiquée dans le modèle. MEDIA_STORAGE=local fonctionne sans Cloudinary ; renseigner les trois variables Cloudinary uniquement pour activer ce fournisseur. Ne jamais committer .env.docker. `docker compose config` peut afficher les secrets interpolés : ne pas publier sa sortie.

```sh
docker compose --env-file .env.docker config --quiet
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs --tail=100 app proxy
```

Caddy est le seul service exposé ; il termine HTTPS et transmet les requêtes à l’application. Il obtient et renouvelle les certificats du domaine lorsque le DNS et les ports sont accessibles, selon sa [documentation HTTPS](https://caddyserver.com/docs/automatic-https). Aucun domaine n’a encore été choisi pour ce projet : cette configuration demande une valeur réelle avant déploiement. Elle ne fournit pas d’accès HTTP local à l’administration en production, car les cookies nécessitent HTTPS.

Ouvrir https://DOMAINE/#/admin, saisir le code initial et créer son compte. Le code peut ensuite être vidé dans .env.docker ; relancer `up -d` pour appliquer les variables. L’application refuse le premier démarrage sans code initial valide. Les annonces de démonstration ne sont pas chargées en production.

## Persistance et droits

Le volume nommé app_data contient /data/teranga.sqlite et /data/uploads. Les deux volumes Caddy conservent les certificats et la configuration. Compose lance l’application avec UID/GID 1000, un système de fichiers en lecture seule hors volume et un /tmp temporaire. Le dossier /data de l’image appartient à cet utilisateur ; un volume nommé neuf hérite de ces permissions. Pour un volume préexistant ou un montage de dossier, fournir les droits d’écriture à cet UID avant démarrage.

Conserver une seule instance de l’application avec SQLite. Le contrôle de santé vérifie /healthz et SQLite. Compose attend que l’application soit saine avant de démarrer le proxy ; un conteneur simplement unhealthy n’est pas automatiquement redémarré par cette configuration. Voir les [contrôles de santé et dépendances Docker](https://docs.docker.com/compose/how-tos/startup-order).

TRUST_PROXY est activé uniquement dans ce réseau privé : Caddy écrase X-Real-IP et X-Forwarded-Host. Ne pas publier directement le port de l’application avec cette option, car les en-têtes transmis doivent provenir du proxy contrôlé.

## Sauvegarder et reprendre les données existantes

```sh
docker compose --env-file .env.docker exec app npm run backup
docker compose --env-file .env.docker exec app npm run backup:verify -- /data/backups/NOM
docker compose --env-file .env.docker cp app:/data/backups/NOM ./backups/NOM
```

Le dossier exporté contient la base et les photos locales. Les photos Cloudinary demandent une sauvegarde distincte. Stocker une copie privée hors du serveur et tester la restauration séparément.

L’image ne contient pas les données locales du projet. Pour les reprendre : produire et vérifier une sauvegarde cohérente avec `npm run backup` depuis la racine, arrêter les écritures de l’ancienne application, puis importer le fichier SQLite sauvegardé et son dossier uploads dans un volume Docker propre avant le premier démarrage. Le volume doit être accessible à UID 1000. Ne pas copier une base active seule, ni mélanger sa restauration avec d’anciens fichiers -wal/-shm. Ne jamais remplacer un volume contenant déjà des données sans le sauvegarder.

## Mise à jour et arrêt

Sauvegarder avant chaque mise à jour, puis relancer `up -d --build`. `docker compose --env-file .env.docker down` arrête les services et conserve les volumes. **Ne pas ajouter -v** : cette option supprime les données persistantes et les certificats. Les migrations SQLite s’appliquent au démarrage ; revenir à une ancienne image après une évolution de schéma demande de vérifier sa compatibilité ou restaurer une sauvegarde.

## Image seule / Railway

```sh
docker build -t teranga-atlas:local .
```

Le Dockerfile reste utilisable seul derrière un proxy HTTPS existant, avec /data monté, PUBLIC_ORIGIN, PORT et ADMIN_SETUP_TOKEN au premier accès. L’utilisateur de l’image seule conserve le comportement antérieur compatible avec le volume Railway ; les restrictions de droits Compose sont propres à Compose. Sur Railway, conserver la racine du dépôt, utiliser son proxy et son volume, et ne pas déployer le service Caddy : voir [le guide Railway](railway.md).

Validation effectuée avec Docker Desktop : image construite, pile Compose démarrée, HTTPS local vérifié, parcours bien/photo/demande/sauvegarde réussi et persistance confirmée après redémarrage. Voir le [rapport de validation Docker](../qa/docker-validation.md). Le domaine public, le DNS et son certificat restent à valider sur le serveur cible ; aucun déploiement public n’a été effectué.

## E-mails et accès internes

Les nouvelles variables SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD et MAIL_FROM sont transmises au conteneur applicatif par Compose. Sans service d’envoi, les conserver vides comme dans .env.docker.example. Le port 587 nécessite STARTTLS ; le port 465 nécessite SMTP_SECURE=true. Voir [comptes et notifications](../architecture/accounts-notifications.md) avant activation. Les comptes existants deviennent administrateurs actifs et les anciennes affectations restent à relier explicitement aux comptes. Sauvegarder avant la migration 003.
