#!/usr/bin/env python3
"""
Script pour analyser une spritesheet et détecter automatiquement la taille des sprites
"""

from PIL import Image
import sys

def analyze_spritesheet(image_path):
    """
    Analyse une spritesheet pour détecter la taille des sprites
    """
    img = Image.open(image_path)
    width, height = img.size
    
    print(f"📊 Analyse de la spritesheet: {image_path}")
    print(f"Taille de l'image: {width}x{height} pixels")
    print(f"Mode: {img.mode}")
    print()
    
    # Suggestions de tailles communes pour une image 1024x1024
    common_sizes = [
        (64, 64),   # 16x16 sprites
        (128, 128), # 8x8 sprites
        (256, 256), # 4x4 sprites
        (512, 512), # 2x2 sprites
    ]
    
    print("💡 Tailles de sprites possibles:")
    for sprite_w, sprite_h in common_sizes:
        if width % sprite_w == 0 and height % sprite_h == 0:
            sprites_per_row = width // sprite_w
            sprites_per_col = height // sprite_h
            total_sprites = sprites_per_row * sprites_per_col
            print(f"  - {sprite_w}x{sprite_h} → {sprites_per_row}x{sprites_per_col} = {total_sprites} sprites")
    
    print()
    print("🔍 Pour extraire les sprites, utilisez:")
    print(f"  python scripts/extract_building_sprites.py {image_path} <sprite_width> <sprite_height> ./public/buildings town_hall")
    print()
    print("Exemple si les sprites font 128x128:")
    print(f"  python scripts/extract_building_sprites.py {image_path} 128 128 ./public/buildings town_hall")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_spritesheet.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    analyze_spritesheet(image_path)

