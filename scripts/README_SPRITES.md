# Extraction des Sprites de Bâtiments

Ce script permet d'extraire les sprites d'une spritesheet de bâtiment et de créer un système de skins basé sur le niveau.

## Prérequis

```bash
pip install Pillow
```

## Utilisation

### 1. Préparer votre image

Placez votre spritesheet dans le projet. L'image doit contenir tous les sprites du bâtiment organisés en grille.

### 2. Extraire les sprites

```bash
python scripts/extract_building_sprites.py <spritesheet_path> <sprite_width> <sprite_height> <output_dir> [building_id]
```

**Exemple pour Town Hall :**
```bash
python scripts/extract_building_sprites.py town_hall_sprites.png 128 128 ./public/buildings town_hall
```

**Paramètres :**
- `spritesheet_path` : Chemin vers l'image spritesheet
- `sprite_width` : Largeur d'un sprite en pixels
- `sprite_height` : Hauteur d'un sprite en pixels
- `output_dir` : Dossier de sortie (généralement `./public/buildings`)
- `building_id` : ID du bâtiment (optionnel, défaut: `town_hall`)

### 3. Structure de sortie

Le script crée :
```
public/buildings/
  └── town_hall/
      ├── town_hall_level_01.png
      ├── town_hall_level_02.png
      ├── ...
      ├── town_hall_level_30.png
      └── metadata.json
```

### 4. Format de la spritesheet

La spritesheet doit être organisée en grille :
- Les sprites sont disposés de gauche à droite, puis de haut en bas
- Chaque sprite doit avoir la même taille
- Le premier sprite correspond au niveau 1, le second au niveau 2, etc.

**Exemple :**
```
[Level 1] [Level 2] [Level 3] [Level 4]
[Level 5] [Level 6] [Level 7] [Level 8]
...
```

## Intégration dans le jeu

Une fois les sprites extraits, le système les utilisera automatiquement dans les composants `IslandView` et `BuildingCard`.

Le sprite affiché dépend du niveau du bâtiment :
- Niveau 1 → `town_hall_level_01.png`
- Niveau 2 → `town_hall_level_02.png`
- etc.

## Notes

- Si un sprite n'existe pas pour un niveau, l'icône emoji par défaut sera utilisée
- Les sprites sont chargés dynamiquement selon le niveau du bâtiment
- Le système supporte jusqu'à 30 niveaux par bâtiment

