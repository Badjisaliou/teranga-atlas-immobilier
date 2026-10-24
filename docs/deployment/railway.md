# Mise en ligne sur Railway

L’application est déployée depuis le 24 octobre 2026 : https://web-production-88df.up.railway.app. Administration : https://web-production-88df.up.railway.app/#/admin. Aucun domaine personnalisé n’est configuré.

Le déploiement initial `9187d3df-b6c7-4f19-a96c-d518e72200df` a réussi depuis le commit `1733fc0`, envoyé par CLI. L’intégration GitHub Railway n’a pas accès au dépôt privé : les déploiements automatiques restent à activer. Projet `teranga-atlas-immobilier`, service `web`, environnement `production`, volume `web-volume` monté sur `/data`, une réplique. Aucune donnée locale ni donnée de test n’a été importée.

Les contrôles HTTPS ont confirmé : accueil et `/healthz` HTTP 200, catalogue vide, configuration du premier compte protégée par code, demandes administratives HTTP 401 sans connexion et base SQLite inaccessible publiquement (HTTP 404). Le formulaire du premier compte a aussi été vérifié dans le navigateur. Le code privé est conservé uniquement dans `var/railway-production/admin-setup.txt`, exclu de Git. Aucun compte administrateur n’a été créé automatiquement.

Les sauvegardes planifiées du volume n’ont pas pu être activées : l’API Railway les réserve au forfait Pro de l’espace de travail. Aucun changement d’abonnement n’a été effectué. Prévoir une sauvegarde externe avant de saisir des données importantes. SMTP et Cloudinary ne sont pas configurés ; les médias utilisent le volume local.

## Service et stockage

1. Envoyer le projet dans un dépôt privé puis créer un service Railway à partir de ce dépôt. Utiliser la racine du dépôt comme dossier racine du service (ne plus sélectionner `prototype`).
2. Railway construit le `Dockerfile` présent dans ce dossier. Le conteneur sert le site et l’API ensemble ; aucun hébergement statique séparé n’est nécessaire.
3. Attacher un volume au service, monté sur `/data`. Garder **une seule réplique** pour cette version SQLite. La base, les photos et les sauvegardes locales se trouvent dans ce volume. Les volumes sont montés au démarrage, pas pendant la construction : [documentation Railway](https://docs.railway.com/volumes).
4. Dans les variables du service, définir `NODE_ENV=production`, `HOST=0.0.0.0`, `TAI_DATA_DIR=/data`, `TRUST_RAILWAY_PROXY=true`. Railway fournit `PORT` et `RAILWAY_VOLUME_MOUNT_PATH`.
5. Générer un domaine dans Networking. L’application utilise automatiquement `RAILWAY_PUBLIC_DOMAIN`. Pour un domaine personnalisé, définir `PUBLIC_ORIGIN=https://votre-domaine` après sa configuration DNS. L’origine doit correspondre exactement à l’adresse publique : [domaines Railway](https://docs.railway.com/networking/domains/working-with-domains).
6. Générer localement un secret aléatoire d’au moins 32 caractères et le placer dans la variable secrète `ADMIN_SETUP_TOKEN`. Ne pas l’ajouter au dépôt ni le communiquer dans une demande publique.
7. Configurer le chemin de contrôle de santé `/healthz` dans les paramètres de déploiement. Ce contrôle valide la connexion SQLite ; Railway l’utilise au déploiement, pas comme surveillance continue : [contrôles de santé](https://docs.railway.com/deployments/healthchecks).

Le démarrage refuse une origine HTTP ou un stockage Railway sans volume. Les annonces de démonstration ne sont ni initialisées ni exposées en production. Les cookies administrateur utilisent HTTPS. Les en-têtes du proxy ne sont utilisés que lorsque `TRUST_RAILWAY_PROXY=true` ; réserver ce réglage au service derrière le proxy Railway.

Aucun `railway.json` n’est ajouté. Les paramètres de santé, Dockerfile et réplique unique ont été appliqués par l’API Railway ; ils sont également visibles dans le tableau de bord.

## Premier accès

Ouvrir `/#/admin`, saisir le code `ADMIN_SETUP_TOKEN` et créer son propre compte avec un mot de passe long. Aucun compte par défaut n’est créé. Retirer ensuite le code des variables et redéployer : le compte existant continue de fonctionner.

Dans **Paramètres**, compléter les coordonnées officielles, le numéro WhatsApp au format international sans espaces, la présentation, les services, les mentions légales et la confidentialité. Le tableau de préparation indique les informations manquantes. Ces textes doivent être adaptés à l’activité réelle de l’agence avant ouverture au public.

Ajouter les vraies annonces avec leurs photos et équipements puis vérifier sur mobile : recherche → fiche → demande → réception et traitement dans l’administration. Le lien WhatsApp ouvre une conversation ; il n’envoie aucun message automatiquement. L’agence doit consulter les demandes dans l’administration.

## Sauvegarde et restauration

Activer les sauvegardes planifiées du volume dans Railway : elles couvrent SQLite et les photos locales ensemble. Les photos Cloudinary nécessitent une politique de sauvegarde distincte chez le fournisseur. Vérifier régulièrement une restauration dans un environnement séparé : [sauvegardes de volume](https://docs.railway.com/volumes/backups).

Depuis un terminal du **conteneur exécuté avec son volume monté**, `npm run backup` crée `/data/backups/teranga-…/`, contenant la base, les photos et un manifeste SHA-256. `npm run backup:verify -- /data/backups/teranga-…` contrôle les fichiers et SQLite. Une copie sur le même volume ne protège pas de la perte du volume : exporter le dossier complet vers un stockage privé distinct. Ne jamais exposer ce dossier sur le site public.

Pour restaurer : arrêter le service, conserver une copie des données actuelles, vérifier le dossier sauvegardé, remettre `teranga.sqlite` et `uploads/` dans un volume propre, puis redémarrer. Ne pas mélanger une base restaurée avec d’anciens fichiers `teranga.sqlite-wal` ou `teranga.sqlite-shm`. Vérifier les annonces, photos, connexions et demandes avant réouverture.

## Vérifications et limites

`npm run test:api`, `npm run test:production` et `npm run build` vérifient les parcours et le paquet. `npm run check:production`, exécuté dans le conteneur avec les variables et le volume, contrôle les prérequis techniques avant ouverture. Après réorganisation, le Dockerfile utilise apps/ et packages/. Sa construction et le fonctionnement Compose ont été validés avec Docker Desktop. Le domaine HTTPS et le volume ont été vérifiés au déploiement initial du 24 octobre 2026.

À compléter selon le périmètre de lancement : activation SMTP pour les notifications et la récupération de mot de passe, validation métier des droits agents, traductions anglais/arabe, export PDF et référencement des fiches avec de vraies URL (les routes actuelles utilisent `#`). Une réservation reste une demande à traiter ; aucun paiement ou engagement contractuel automatique n’est réalisé.

## Stockage photo Cloudinary (optionnel)

Définir `MEDIA_STORAGE=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` et `CLOUDINARY_API_SECRET` dans les variables privées du service. Aucun préfixe VITE_ ne doit être utilisé pour ces valeurs. Les nouvelles photos passent alors par Cloudinary ; les anciens fichiers /media/ restent servis depuis le volume. Voir [stockage des photos](../architecture/media.md).

## Comptes internes et notifications

La migration 003 ajoute les rôles et les affectations nominatives tout en préservant les comptes existants. Pour activer SMTP, définir SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD et MAIL_FROM dans les variables privées du service. Sans configuration, aucun envoi réel n’a lieu. L’API utilise une file persistante et traite les échecs indépendamment des demandes. Voir [les règles et la configuration](../architecture/accounts-notifications.md).
