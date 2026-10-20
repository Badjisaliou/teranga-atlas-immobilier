# Photos : local et Cloudinary

La base de données conserve les références et métadonnées. Les fichiers sont stockés dans un fournisseur de médias distinct. Deux modes sont disponibles :

| Mode | Fichiers | Usage |
| --- | --- | --- |
| local | var/data/uploads ou volume Railway /data/uploads | Fonctionnement existant et développement |
| cloudinary | Compte Cloudinary configuré | Nouvelles photos hébergées et diffusées à distance |

## Configuration

Variables exclusivement côté serveur :

```dotenv
MEDIA_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Ne jamais préfixer ces secrets par VITE_, les inclure dans Git ou les transmettre au navigateur. L’API authentifie l’administrateur, vérifie le format et la taille (JPEG/PNG/WebP, 5 Mo maximum), puis effectue l’import signé avec un identifiant unique et sans écrasement. L’API enregistre ensuite le public_id, l’URL HTTPS, le fournisseur et la taille dans media_assets. Seules les références connues peuvent être affectées à une annonce ; une URL distante arbitraire n’est pas acceptée.

Le protocole de signature suit la [documentation Cloudinary](https://cloudinary.com/documentation/authentication_signatures) et l’import suit son [API Upload](https://cloudinary.com/documentation/image_upload_api_reference). Les tests automatisés utilisent une réponse simulée ; le compte réel reste à configurer et à vérifier.

Changer de fournisseur ne migre pas les anciennes photos. Les URLs /media/ continuent de fonctionner à partir du volume local, même après activation de Cloudinary. Aucune photo existante n’est envoyée ou supprimée automatiquement. Retirer une photo d’une galerie ne supprime pas l’original du fournisseur ; les médias non utilisés pourront être nettoyés par un outil dédié ultérieur.

## Sauvegarde et incidents

La sauvegarde de l’application conserve la base et ses références Cloudinary, ainsi que les fichiers locaux. Elle ne copie pas les originaux Cloudinary : prévoir une politique de sauvegarde/export distincte avant le lancement. Les photos de biens publiées sont publiques par conception ; ne pas importer de documents d’identité ou de pièces confidentielles.

Si l’import Cloudinary échoue, l’API retourne une erreur sans créer de référence utilisable. Un succès distant suivi d’un échec SQLite peut laisser un fichier distant non référencé ; aucune suppression automatique n’est lancée pour éviter de retirer une photo existante. Revenir à MEDIA_STORAGE=local affecte seulement les prochains imports.
