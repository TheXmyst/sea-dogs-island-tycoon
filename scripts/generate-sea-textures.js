/**
 * Script pour générer les textures de mer (ripple et background)
 * Exécuter avec: node scripts/generate-sea-textures.js
 */

import { writeFileSync } from 'fs';
import { createCanvas } from 'canvas';

// Note: Si canvas n'est pas installé, on peut utiliser une version simplifiée
// ou générer les images via le navigateur

function createRippleTexture() {
  const size = 512; // HD texture
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const centerX = size / 2;
  const centerY = size / 2;

  // Fond transparent
  ctx.clearRect(0, 0, size, size);

  // Créer des cercles concentriques pour l'effet de ripple
  for (let i = 0; i < 8; i++) {
    const radius = (size / 8) * (i + 1);
    const alpha = 0.4 - (i * 0.05);
    
    // Gradient radial pour chaque cercle
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.7,
      centerX, centerY, radius
    );
    
    gradient.addColorStop(0, `rgba(128, 180, 255, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(128, 180, 255, ${alpha * 0.6})`);
    gradient.addColorStop(1, 'rgba(128, 180, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ajouter des détails supplémentaires pour un effet plus réaliste
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i;
    const distance = size * 0.3;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const radius = 20 + Math.random() * 15;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toBuffer('image/png');
}

function createOceanBackgroundTexture() {
  const width = 2048; // HD large texture
  const height = 2048;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fond de base avec gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1565c0');
  gradient.addColorStop(0.25, '#0d47a1');
  gradient.addColorStop(0.5, '#1a237e');
  gradient.addColorStop(0.75, '#0d47a1');
  gradient.addColorStop(1, '#1565c0');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Ajouter des variations de profondeur (zones plus profondes - plus sombres)
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 300 + Math.random() * 400;
    const alpha = 0.12 + Math.random() * 0.08;

    const radialGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    radialGradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
    radialGradient.addColorStop(0.7, `rgba(0, 0, 0, ${alpha * 0.5})`);
    radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = radialGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ajouter des zones moins profondes (plus claires - hauts-fonds)
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 200 + Math.random() * 250;
    const alpha = 0.1 + Math.random() * 0.08;

    const radialGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    radialGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    radialGradient.addColorStop(0.7, `rgba(255, 255, 255, ${alpha * 0.5})`);
    radialGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = radialGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ajouter des motifs de vagues subtils (vue du dessus)
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 150 + Math.random() * 100;
    const alpha = 0.03 + Math.random() * 0.02;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  return canvas.toBuffer('image/png');
}

// Générer et sauvegarder les textures
try {
  console.log('Génération de la texture de ripple...');
  const rippleBuffer = createRippleTexture();
  writeFileSync('public/textures/ripple.png', rippleBuffer);
  console.log('✅ ripple.png créé');

  console.log('Génération de la texture de fond océan...');
  const oceanBuffer = createOceanBackgroundTexture();
  writeFileSync('public/textures/ocean-bg.png', oceanBuffer);
  console.log('✅ ocean-bg.png créé');

  console.log('\n✅ Toutes les textures ont été générées avec succès!');
} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.log('\n💡 Note: Le package "canvas" est nécessaire pour ce script.');
  console.log('   Installez-le avec: npm install canvas');
  console.log('\n   Ou utilisez la version navigateur (voir generate-sea-textures-browser.html)');
}

