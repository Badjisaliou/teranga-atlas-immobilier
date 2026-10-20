# Comptes internes et notifications

## Comptes et droits

La migration 003 conserve les comptes existants comme administrateurs actifs. Les annonces et demandes historiques gardent leurs libellés de responsable, sans supposer qu’un nom correspond à un utilisateur. Un administrateur doit affecter explicitement les éléments aux comptes depuis les listes de responsables.

| Action | Administrateur | Agent |
| --- | --- | --- |
| Consulter les biens et demandes | Tous | Seulement ceux affectés à son identifiant |
| Créer/modifier une annonce ou importer des photos | Oui | Non |
| Mettre à jour le statut et la disponibilité d’un bien affecté | Oui | Oui, après publication initiale |
| Suivre une demande, modifier son statut et ses notes | Oui | Oui si affectée |
| Affecter ou réaffecter | Oui | Non |
| Gérer comptes, paramètres, suivi des e-mails | Oui | Non |
| Changer son mot de passe | Oui | Oui |

Les contrôles sont appliqués à chaque requête par l’API, indépendamment des écrans masqués. Désactiver un utilisateur ou changer son rôle ferme ses sessions et invalide ses liens de récupération. Son historique reste en base. Réaffecter ses dossiers aux comptes actifs est une action distincte ; aucune suppression de données n’est effectuée.

Changer son mot de passe demande le mot de passe actuel, ferme les autres sessions et renouvelle la session courante. La récupération utilise un lien de 30 minutes à usage unique, ferme les anciennes sessions et nécessite ensuite une nouvelle connexion. Les jetons de récupération sont hachés dans password_resets. Le lien ne passe pas par les journaux HTTP, car il est dans le fragment de l’adresse du backoffice.

## SMTP à compléter

L’utilisateur n’a pas encore de service d’envoi. Aucun e-mail réel n’est donc activé. Les paramètres se définissent exclusivement dans les variables privées de Railway ou dans .env.docker :

```dotenv
SMTP_HOST=smtp.votre-service
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=adresse-expediteur@votre-domaine
```

Le port 587 utilise STARTTLS obligatoire ; pour le port 465, définir SMTP_SECURE=true. La vérification des certificats TLS reste active. Le transport utilise [Nodemailer SMTP](https://nodemailer.com/smtp). Utiliser un expéditeur autorisé par le service choisi, puis vérifier une véritable réception après sa configuration. Ne pas mettre les secrets dans les paramètres publics ou dans Git. PUBLIC_ORIGIN doit correspondre à l’adresse publique pour que les liens de récupération soient corrects.

Sans SMTP, l’écran « Mot de passe oublié » explique l’indisponibilité de l’envoi. L’API renvoie la même réponse pour les comptes inconnus, inactifs et connus. Aucun lien ou jeton n’est communiqué à l’écran.

## Notifications

Chaque nouvelle demande est enregistrée dans la même transaction que ses notifications : alerte à l’adresse de contact de l’agence et au compte responsable actif, sans doublon, et accusé de réception au prospect s’il a indiqué un e-mail. Les alertes internes invitent à consulter le backoffice sans envoyer les coordonnées du prospect dans leur contenu. Les demandes générales restent à affecter par un administrateur.

Le worker de l’API consulte la file toutes les 15 secondes, envoie un maximum de 10 messages par passage et reprend les messages en attente après redémarrage. En cas d’erreur SMTP, il retente avec délai croissant, jusqu’à 5 tentatives. Le backoffice affiche les états et permet de relancer les notifications métier en échec. L’échec d’un e-mail n’annule jamais une demande déjà enregistrée.

Les messages en attente ne sont pas envoyés tant que SMTP n’est pas configuré. L’activation ultérieure peut envoyer les notifications métier accumulées : vérifier qu’il s’agit bien de données réelles avant activation. Les liens de récupération expirés ne sont pas envoyés. Les corps et liens ne sont pas exposés par l’écran de suivi ; le corps des e-mails de récupération est effacé après acceptation SMTP.

Une acceptation SMTP ne prouve pas l’arrivée en boîte de réception. L’envoi n’est pas exactement unique en cas de crash entre acceptation du serveur et enregistrement du résultat ; une notification peut être reçue deux fois. La file est prévue pour une seule instance avec SQLite, comme le reste de l’application.

Les SMS, les messages WhatsApp automatiques et la confirmation métier des créneaux restent hors de ce lot. Le calendrier des visites, les autres modules métier, les contenus et le référencement restent les étapes suivantes.
