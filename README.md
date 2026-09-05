# TaxiBe — version corrigée et trilingue

## Nouvelles fonctionnalités

- Paramètres administrateur enregistrés en MySQL.
- Changement du nom de l'application et de la ville.
- Choix de la couleur principale et secondaire.
- Mode clair, sombre ou système.
- Changement global de langue : Français, Malagasy, English.
- Les préférences sont chargées automatiquement sur les pages de l'application.
- Les paramètres restent après redémarrage du serveur.

## Installation

```bash
cd backend
npm install
npm start
```

Puis ouvrir :

`http://localhost:3000`

## Base de données

La table `parametres` est créée automatiquement au premier appel de `/api/parametres`.

Le fichier `.env.example` est fourni comme modèle. Ne publiez jamais vos vrais identifiants `.env` sur GitHub.

## Carte améliorée

- Marqueurs d'arrêts numérotés et agrandis.
- Départ et destination clairement différenciés.
- Légende intégrée à la carte.
- Tracé complet de la ligne.
- Liste des arrêts avec zoom automatique au clic.
- Recentrage de la carte.
