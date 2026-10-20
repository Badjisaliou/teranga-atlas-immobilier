# Validation de la réorganisation — 20 octobre 2026

- Sauvegarde cohérente SQLite avant déplacement, copie des photos locales et comparaison des lignes des tables settings/users/sessions/properties/inquiries : identiques. Empreintes des photos identiques ; PRAGMA quick_check = ok.
- Base active : var/data. Ancien dossier prototype rangé dans var/legacy-prototype, hors code actif et exclu de Git. Sauvegarde préalable privée dans backups/before-reorganization-2026-10-20.
- Compilation à la racine : npm run build réussie ; site et écran de connexion du backoffice vérifiés dans le navigateur sur le port 4173. Le compte utilisateur existant n’a pas été modifié et aucun compte de test n’y a été ajouté.
- Développement à la racine : npm run dev sur 4174 avec TAI_DATA_DIR=var/test-data, affichage correct et aucune erreur console observée. Serveur de test arrêté après vérification.
- Confidentialité en développement : API administrative non authentifiée = 401 ; requêtes directes vers le module de stockage serveur et SQLite via /@fs/ = 403. Données, sauvegardes et ancienne base confirmées exclues par git check-ignore.
- 11 tests passent : API (3), production/sauvegarde (2), Cloudinary/migrations (2), packaging (4). Le test API photos vérifie aussi le refus des URLs distantes non enregistrées et l’acceptation d’un média Cloudinary connu.
- Cloudinary : requête signée, secret absent du formulaire d’import, validation de l’URL de livraison et traitement des erreurs vérifiés avec un fournisseur simulé. Aucun compte réel configuré, aucun fichier envoyé à Cloudinary.
- Limites conservées : Docker/Railway non déployés ou testés sur leur plateforme ; SQLite reste le moteur actif ; site et backoffice partagent encore une compilation frontend. Les routes en # et les autres fonctionnalités différées ne sont pas modifiées par cette réorganisation.
