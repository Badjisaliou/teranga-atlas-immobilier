# Base de données

SQLite reste le moteur actuel pour conserver les données déjà saisies et le fonctionnement validé. Son fichier est privé, sur volume persistant en production. Une migration PostgreSQL pourra être menée séparément si plusieurs répliques ou davantage d’écritures simultanées deviennent nécessaires ; elle n’a pas été effectuée pendant cette réorganisation.

| Table | Rôle |
| --- | --- |
| users | Comptes administrateurs et mots de passe hachés |
| sessions | Empreintes des jetons et expirations |
| properties | Identité, statut et contenu des annonces |
| inquiries | Coordonnées des prospects, bien associé et suivi interne |
| settings | Paramètres publics de l’agence et état d’initialisation |
| media_assets | Fournisseur photo, identifiant distant/local, URL, format et taille |
| schema_migrations | Versions SQL appliquées |

Les biens conservent leur contenu détaillé dans un payload JSON pour rester compatibles avec les données existantes. Les photos des galeries sont référencées par leur URL ou identifiant historique dans ce contenu. Cette version ne remplace pas encore ces galeries par une table relationnelle ordonnée ; le registre des médias suit les nouveaux imports.

## Migrations

`packages/database/migrations/001_initial.sql` reprend le schéma existant sans supprimer les tables ou données. `002_media_assets.sql` ajoute le registre des photos. L’ouverture de la base applique chaque fichier une seule fois, dans une transaction, puis inscrit sa version. Ne pas modifier une migration déjà appliquée : ajouter un nouveau fichier numéroté.

Sauvegarder avant toute évolution de schéma. La commande de sauvegarde produit un instantané SQLite cohérent et copie les photos locales immuables. Tester la restauration en environnement isolé. Aucun script ne réinitialise la base utilisateur.
