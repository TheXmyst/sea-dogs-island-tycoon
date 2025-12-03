#!/usr/bin/env python3
"""
Script pour extraire les sprites d'une spritesheet de bâtiment
et créer un système de skins basé sur le niveau
"""

from PIL import Image
import os
import sys
import json

def extract_sprites(spritesheet_path, sprite_width, sprite_height, output_dir, building_id):
    """
    Extrait les sprites d'une spritesheet
    
    Args:
        spritesheet_path: Chemin vers l'image spritesheet
        sprite_width: Largeur d'un sprite
        sprite_height: Hauteur d'un sprite
        output_dir: Dossier de sortie pour les sprites
        building_id: ID du bâtiment (ex: 'town_hall')
    """
    # Créer le dossier de sortie
    building_dir = os.path.join(output_dir, building_id)
    os.makedirs(building_dir, exist_ok=True)
    
    # Ouvrir l'image
    img = Image.open(spritesheet_path)
    img_width, img_height = img.size
    
    # Calculer le nombre de sprites par ligne et colonne
    sprites_per_row = img_width // sprite_width
    sprites_per_col = img_height // sprite_height
    total_sprites = sprites_per_row * sprites_per_col
    
    print(f"Spritesheet: {spritesheet_path}")
    print(f"Taille image: {img_width}x{img_height}")
    print(f"Taille sprite: {sprite_width}x{sprite_height}")
    print(f"Sprites par ligne: {sprites_per_row}")
    print(f"Sprites par colonne: {sprites_per_col}")
    print(f"Total sprites: {total_sprites}")
    
    # Extraire chaque sprite
    sprites_info = []
    sprite_index = 0
    
    for row in range(sprites_per_col):
        for col in range(sprites_per_row):
            # Calculer la position du sprite
            x = col * sprite_width
            y = row * sprite_height
            
            # Extraire le sprite
            sprite = img.crop((x, y, x + sprite_width, y + sprite_height))
            
            # Déterminer le niveau (peut être ajusté selon votre système)
            # Par défaut, on assume que chaque sprite correspond à un niveau
            level = sprite_index + 1
            
            # Nom du fichier
            filename = f"{building_id}_level_{level:02d}.png"
            filepath = os.path.join(building_dir, filename)
            
            # Sauvegarder le sprite
            sprite.save(filepath, "PNG")
            
            sprites_info.append({
                "level": level,
                "filename": filename,
                "path": f"buildings/{building_id}/{filename}"
            })
            
            sprite_index += 1
            print(f"Extrait: {filename} (niveau {level})")
    
    # Sauvegarder les métadonnées
    metadata = {
        "building_id": building_id,
        "total_levels": total_sprites,
        "sprite_width": sprite_width,
        "sprite_height": sprite_height,
        "sprites": sprites_info
    }
    
    metadata_path = os.path.join(building_dir, "metadata.json")
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Extraction terminée!")
    print(f"📁 Sprites sauvegardés dans: {building_dir}")
    print(f"📄 Métadonnées: {metadata_path}")
    
    return metadata

def auto_detect_sprite_size(img_path):
    """
    Tente de détecter automatiquement la taille des sprites
    en analysant l'image
    """
    img = Image.open(img_path)
    width, height = img.size
    
    # Chercher des patterns communs
    # Par exemple, si l'image fait 800x600, on peut avoir:
    # - 4 sprites de 200x150
    # - 8 sprites de 100x150
    # etc.
    
    print("⚠️  Détection automatique non implémentée")
    print("Veuillez spécifier manuellement la taille des sprites")
    return None, None

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python extract_building_sprites.py <spritesheet_path> <sprite_width> <sprite_height> <output_dir> [building_id]")
        print("\nExemple:")
        print("  python extract_building_sprites.py town_hall_sprites.png 128 128 ./public/buildings town_hall")
        sys.exit(1)
    
    spritesheet_path = sys.argv[1]
    sprite_width = int(sys.argv[2])
    sprite_height = int(sys.argv[3])
    output_dir = sys.argv[4]
    building_id = sys.argv[5] if len(sys.argv) > 5 else "town_hall"
    
    if not os.path.exists(spritesheet_path):
        print(f"❌ Erreur: Le fichier {spritesheet_path} n'existe pas")
        sys.exit(1)
    
    extract_sprites(spritesheet_path, sprite_width, sprite_height, output_dir, building_id)

