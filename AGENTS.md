# Project Instructions

## Choix approuvés — 14 octobre 2026

- Hébergement choisi : Railway. Aucun domaine personnalisé choisi. Préserver le volume SQLite et les photos ; utiliser une seule réplique avec cette architecture.

- Maquette d'accueil option 2 et logo concept 5 paysage.
- Les quatre visuels de `docs/design/maquettes-v1/` ont été approuvés pour passer au prototype interactif.
- Respecter la palette crème / vert profond / ocre et le parcours recherche → fiche → demande.
- Les décisions fonctionnelles ouvertes dans `docs/product/conception-fonctionnelle-v1.md` ne sont pas implicitement validées par l'approbation visuelle.
- L'utilisateur a ensuite demandé l'administration et l'enregistrement réel des biens et des demandes. L'application utilise désormais une API Node et SQLite locale dans `var/data/`, une authentification administrateur et des photos dans `var/data/uploads/`.
- Ne jamais remettre les formulaires en mode simulation ni réinitialiser la base pour rétablir une maquette. Les tests de navigateur doivent employer `TAI_DATA_DIR=var/test-data`, séparé de la base de l'utilisateur.
- Les équipements publics doivent provenir des données saisies ; aucune caractéristique d'un bien réel ne doit être déduite de son type ou de sa photo.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build public UI in `apps/web/src/`, backoffice in `apps/backoffice/src/`, API in `apps/api/src/`, and shared modules in `packages/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

- Réorganisation approuvée le 20 octobre 2026 : dépôt applicatif à la racine. Cloudinary optionnel ; préserver SQLite et les médias locaux existants.
- Étape suivante autorisée : comptes administrateur/agent, accès aux seuls dossiers affectés pour les agents, mots de passe et notifications. L’utilisateur n’a pas encore de service e-mail : préparer SMTP sans envoyer de vrais messages. Configuration exclusivement privée ; conserver les demandes même si un e-mail échoue. Voir docs/architecture/accounts-notifications.md.
- Déploiement Docker préparé : Dockerfile à plusieurs étapes, compose.yaml avec proxy HTTPS Caddy et volume app_data. Configuration privée dans .env.docker, modèle .env.docker.example. Ne pas exécuter down -v ni remplacer des données existantes. Docker Desktop est désormais disponible : construction et pile de test HTTPS validées, y compris persistance après redémarrage (docs/qa/docker-validation.md). Cela ne constitue pas un déploiement public. Le script docker-smoke est réservé aux volumes de test neufs.
