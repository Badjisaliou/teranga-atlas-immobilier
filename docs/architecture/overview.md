# Architecture applicative

Le navigateur affiche le site public (`apps/web`) ou les écrans administratifs (`apps/backoffice`) dans une application React compilée avec Vite. Le backend (`apps/api`) sert les fichiers compilés, l’API et les anciens médias locaux sur une même origine. L’administration reste accessible à `/#/admin` ; le déplacement des fichiers ne change pas les liens existants.

L’API contrôle les sessions administrateur et les autorisations. Les secrets Cloudinary et les accès SQLite restent exclusivement côté serveur. Le code frontend partage uniquement le client HTTP et les valeurs publiques du module `packages/shared`.

`packages/database` gère les connexions et migrations. `packages/media` fournit le stockage local et Cloudinary. L’API conserve les validations métier et inscrit les résultats d’import dans le registre `media_assets`.

Railway héberge un conteneur Node avec une seule réplique et un volume persistant. Cloudinary, lorsqu’il est activé, héberge les nouvelles photos et les diffuse par son CDN. Le volume demeure nécessaire pour SQLite et les médias locaux historiques. La séparation des répertoires permet une évolution ultérieure vers d’autres services, sans prétendre que le backend métier actuel est déjà divisé en services indépendants.

## Réorganisation du 20 octobre 2026

Le code actif a quitté le dossier prototype. Les documents de conception et les captures ont été rangés dans docs/. Une sauvegarde SQLite cohérente et les photos locales ont été conservées avant déplacement ; les lignes métier et les empreintes des photos ont été comparées après copie. La copie historique privée est rangée sous var/legacy-prototype ; seule var/data est active.

Les commandes npm s’exécutent désormais à la racine. Sur Railway, remplacer l’ancien dossier racine prototype par la racine du dépôt. Le Dockerfile copie apps/ et packages/ ; les répertoires privés sont exclus des contextes Docker, Railway et Git.
