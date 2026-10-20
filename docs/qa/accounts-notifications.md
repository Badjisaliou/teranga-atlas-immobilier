# Validation — comptes et notifications

La migration 003 est additive : elle conserve les utilisateurs existants comme administrateurs et les anciennes affectations par libellé. Une sauvegarde complète du volume de validation Docker a été créée avant mise à jour. Aucun changement dans la base utilisateur var/data.

Les tests API couvrent deux clients de rôles distincts, les affectations par identifiant, le refus des accès aux autres dossiers, l’absence de droits attachés à un simple nom, l’interdiction de créer/publier/modifier une annonce pour un agent, le contrôle de complétude lors d’un changement de statut, la protection des comptes et paramètres, la désactivation des sessions et le maintien des droits de l’administrateur courant.

Les tests de mots de passe vérifient le mot de passe actuel, la longueur, la fermeture des anciennes sessions, la réponse générique de récupération, le hachage des jetons, l’usage unique et l’expiration. Les liens et corps de récupération sont absents de l’API de suivi des e-mails.

Les tests d’envoi utilisent un transport simulé : panne SMTP sans perte de demande, erreurs expurgées de détails techniques, reprise avec délai, cinq tentatives maximum, relance, conservation de la file après fermeture/réouverture de SQLite, expiration des liens avant envoi et comportement sans SMTP. Aucun message réel transmis.

Les 17 tests automatisés passent. Compilation et image Docker actualisées, démarrage healthy avec le volume de test existant. Vérification navigateur sur localhost:4180 : équipe et rôles, formulaire Mon compte, choix du compte responsable sur une annonce et écran E-mails indiquant SMTP non configuré. Aucune erreur console constatée. Captures : comptes-equipe-docker.png et notifications-smtp-docker.png. Revue React : composants séparés, requêtes indépendantes en parallèle, écouteur de navigation nettoyé, champs étiquetés et états de chargement/enregistrement annoncés.

Les tests automatisés ne prouvent pas la réception dans une véritable boîte e-mail. La configuration du fournisseur et un essai réel de récupération restent à faire avec les paramètres privés de l’agence. La suite fonctionnelle est suivie dans docs/product/roadmap.md.
