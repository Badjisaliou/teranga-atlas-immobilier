# Validation réelle Docker Desktop

Le moteur Linux Docker Desktop a construit l’image `teranga-atlas:validation` avec succès. Docker Compose a validé le fichier et lancé l’application et Caddy dans le projet isolé `teranga-validation`. Les ports de cette pile de test n’ont pas été publiés sur la machine hôte.

## Contrôles effectués

- Construction multi-stage avec installation des dépendances et compilation Vite dans Docker.
- Application exécutée avec UID 1000, fichiers applicatifs en lecture seule et /data accessible en écriture.
- Contrôle de santé Docker : healthy ; proxy Caddy démarré après disponibilité de l’application.
- Requêtes HTTPS à travers Caddy avec validation du certificat localhost par sa CA locale, fournie uniquement au client de test. Aucun contournement de validation TLS, aucune installation de certificat dans le système de l’utilisateur.
- Site compilé accessible ; API administrative non authentifiée refusée ; fichier SQLite inaccessible par HTTP.
- Base de production de test initialement vide, sans annonces de démonstration.
- Création d’un administrateur fictif, cookie Secure, import d’une photo, publication d’un bien, envoi d’une demande et enregistrement de notes internes.
- Sauvegarde SQLite et photo, vérification du manifeste.
- Redémarrage du conteneur, puis connexion et vérification du compte, du bien, de la photo, de la demande, des notes et de la sauvegarde : conservés.

Le script `scripts/docker-smoke.mjs` exécute les assertions dans le conteneur applicatif. Il est réservé à une pile de test neuve utilisant PUBLIC_ORIGIN=https://localhost, un service proxy joignable par son nom et la CA de test dans /tmp/docker-validation-ca.crt. Il crée des données fictives ; ne jamais le lancer sur un environnement réel. Le mode `--after-restart` vérifie la persistance.

L’image et les volumes de test sont conservés ; les services de test sont arrêtés après validation. Aucun changement dans var/data ni dans un compte Cloudinary réel. Les ports publics, le DNS et un certificat délivré pour le futur domaine restent à valider lors du déploiement sur le serveur cible.
