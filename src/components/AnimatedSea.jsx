import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import './AnimatedSea.css';

/**
 * Composant pour afficher une mer animée avec Pixi.js et GSAP
 * Utilise DisplacementFilter pour créer des ondulations réalistes
 */
export default function AnimatedSea({ width = 2000, height = 2000, className = '' }) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const rippleSpriteRef = useRef(null);
  const filterRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let app;
    let isMounted = true;

    const initSea = async () => {
      // Créer l'application Pixi
      app = new PIXI.Application({
        width: width,
        height: height,
        backgroundColor: 0x1565c0, // Bleu océan de base
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        autoStart: true, // Démarrer le rendu automatiquement
      });

      if (!isMounted || !containerRef.current) {
        app.destroy(true);
        return;
      }

      containerRef.current.appendChild(app.view);
      appRef.current = app;

    // Charger les textures depuis les images (ou générer si elles n'existent pas)
    const loadTextures = async () => {
      try {
        // Pixi.js v8 - Utiliser Assets.load()
        const rippleTexture = await PIXI.Assets.load('/textures/ripple.png');
        const bgTexture = await PIXI.Assets.load('/textures/ocean-bg.png');
        console.log('✅ Textures HD chargées depuis /textures/');
        return { rippleTexture, bgTexture };
      } catch (error) {
        console.warn('⚠️ Textures non trouvées, génération programmatique...', error);
        // Fallback: générer les textures si les images n'existent pas
        return {
          rippleTexture: createRippleTextureFallback(),
          bgTexture: createBackgroundTextureFallback(),
        };
      }
    };

    // Fonction fallback pour créer ripple si l'image n'existe pas
    const createRippleTextureFallback = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512; // HD
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cercles concentriques HD
      for (let i = 0; i < 10; i++) {
        const radius = (canvas.width / 10) * (i + 1);
        const alpha = 0.5 - (i * 0.05);
        
        const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius);
        gradient.addColorStop(0, `rgba(128, 180, 255, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(128, 180, 255, ${alpha * 0.6})`);
        gradient.addColorStop(1, 'rgba(128, 180, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      return PIXI.Texture.from(canvas);
    };

    // Fonction fallback pour créer le fond si l'image n'existe pas
    const createBackgroundTextureFallback = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#1565c0');
      gradient.addColorStop(0.25, '#0d47a1');
      gradient.addColorStop(0.5, '#1a237e');
      gradient.addColorStop(0.75, '#0d47a1');
      gradient.addColorStop(1, '#1565c0');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Variations de profondeur
      for (let i = 0; i < 12; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 300 + Math.random() * 400;
        const alpha = 0.12 + Math.random() * 0.08;

        const radialGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        if (Math.random() > 0.5) {
          radialGradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
          radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          radialGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          radialGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.fillStyle = radialGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      return PIXI.Texture.from(canvas);
    };

      // Charger les textures
      const { rippleTexture, bgTexture } = await loadTextures();

      if (!isMounted || !containerRef.current) {
        app.destroy(true);
        return;
      }

      const bg = new PIXI.Sprite(bgTexture);
      
      // Créer plusieurs ripples pour un effet plus naturel
      const ripples = [];
      const filters = [];
      
      // Créer un container pour les ripples
      const rippleContainer = new PIXI.Container();
      
      // Créer 5 ripples à différentes positions pour un effet plus dynamique
      for (let i = 0; i < 5; i++) {
        const ripple = new PIXI.Sprite(rippleTexture);
        ripple.anchor.set(0.5);
        
        // Positionner les ripples à différents endroits
        ripple.x = (width / 6) + (i * width / 5);
        ripple.y = (height / 6) + (i * height / 6);
        ripple.scale.set(0.5);
        ripple.alpha = 0.8;
        
        // Créer un filtre pour chaque ripple
        const filter = new PIXI.DisplacementFilter(ripple);
        filter.scale.set(50 + i * 20); // Intensité variable et plus forte
        
        ripples.push(ripple);
        filters.push(filter);
        
        rippleContainer.addChild(ripple);
      }

      // Appliquer tous les filtres au background
      bg.filters = filters;

      // Ajouter le background au stage (en premier pour qu'il soit en arrière-plan)
      app.stage.addChildAt(bg, 0);
      app.stage.addChild(rippleContainer);

      rippleSpriteRef.current = ripples;
      filterRef.current = filters;

      // Animer avec GSAP - animation continue et fluide
      const timeline = gsap.timeline({ repeat: -1 });
      
      // Animer chaque ripple indépendamment avec des délais différents
      ripples.forEach((ripple, index) => {
        const filter = filters[index];
        const delay = index * 1.0; // Décalage pour chaque ripple
        const duration = 6; // Durée fixe pour tous
        
        // Animation de l'échelle du ripple (expansion)
        timeline.to(ripple.scale, {
          x: 2.5,
          y: 2.5,
          duration: duration,
          ease: 'none',
        }, delay);

        // Animation de l'intensité du filtre (diminution progressive)
        timeline.to(filter.scale, {
          x: 0,
          y: 0,
          duration: duration,
          ease: 'none',
        }, delay);

        // Réinitialiser pour boucle infinie
        timeline.set(ripple.scale, { 
          x: 0.5, 
          y: 0.5 
        }, delay + duration);
        timeline.set(filter.scale, { 
          x: 50 + index * 20, 
          y: 50 + index * 20 
        }, delay + duration);
      });

      animationRef.current = timeline;
      
      // Démarrer le rendu si ce n'est pas déjà fait
      if (!app.ticker.started) {
        app.start();
      }
      
      // Ajouter un ticker pour s'assurer que l'animation se met à jour
      app.ticker.add(() => {
        // Le ticker de Pixi.js met à jour automatiquement le rendu
      });
      
      console.log('🌊 Animation de la mer démarrée avec', ripples.length, 'ripples');
      console.log('📊 Filtres appliqués:', filters.length);
      console.log('🎨 Background sprite:', bg.width, 'x', bg.height);
      console.log('🌀 Ripples positions:', ripples.map(r => ({ x: r.x, y: r.y })));
    };

    initSea();

    // Cleanup
    return () => {
      isMounted = false;
      if (animationRef.current) {
        animationRef.current.kill();
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
      }
    };
  }, [width, height]);

  return (
    <div ref={containerRef} className={`animated-sea-container ${className}`} />
  );
}

