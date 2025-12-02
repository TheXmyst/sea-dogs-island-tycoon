#!/bin/bash

echo "🧪 Test de Déploiement - Vercel + Railway"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Demander les URLs
read -p "🔗 URL de votre backend Railway (ex: https://xxx.railway.app): " RAILWAY_URL
read -p "🔗 URL de votre frontend Vercel (ex: https://xxx.vercel.app): " VERCEL_URL

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Backend accessible
echo "📡 Test 1: Vérification du backend Railway..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/health" 2>/dev/null)

if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend accessible (HTTP $BACKEND_RESPONSE)${NC}"
    
    # Afficher les détails
    echo "   Détails du backend:"
    curl -s "$RAILWAY_URL/api/health" | python3 -m json.tool 2>/dev/null | head -20 || echo "   (Réponse reçue mais format non-JSON)"
else
    echo -e "${RED}❌ Backend non accessible (HTTP $BACKEND_RESPONSE)${NC}"
    echo "   Vérifiez que:"
    echo "   - Le backend est bien déployé sur Railway"
    echo "   - L'URL est correcte"
    echo "   - Les variables d'environnement sont configurées"
fi

echo ""

# Test 2: Frontend accessible
echo "🌐 Test 2: Vérification du frontend Vercel..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL" 2>/dev/null)

if [ "$FRONTEND_RESPONSE" = "200" ] || [ "$FRONTEND_RESPONSE" = "304" ]; then
    echo -e "${GREEN}✅ Frontend accessible (HTTP $FRONTEND_RESPONSE)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend retourne HTTP $FRONTEND_RESPONSE${NC}"
    echo "   (Cela peut être normal selon la configuration Vercel)"
fi

echo ""

# Test 3: CORS
echo "🔒 Test 3: Vérification CORS..."
CORS_HEADERS=$(curl -s -I -H "Origin: $VERCEL_URL" "$RAILWAY_URL/api/health" 2>/dev/null | grep -i "access-control")

if [ -n "$CORS_HEADERS" ]; then
    echo -e "${GREEN}✅ Headers CORS présents${NC}"
    echo "   $CORS_HEADERS"
else
    echo -e "${YELLOW}⚠️  Headers CORS non détectés${NC}"
    echo "   (Cela peut être normal si le backend n'a pas encore reçu de requête CORS)"
fi

echo ""

# Test 4: Configuration recommandée
echo "📋 Test 4: Vérification de la configuration..."
echo ""
echo "Vérifiez manuellement:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "RAILWAY:"
echo "  [ ] JWT_SECRET est configuré"
echo "  [ ] FRONTEND_URL = $VERCEL_URL"
echo "  [ ] NODE_ENV = production"
echo "  [ ] PostgreSQL est connecté"
echo ""
echo "VERCEL:"
echo "  [ ] VITE_API_URL = $RAILWAY_URL"
echo "  [ ] Variables redéployées"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 5: Test d'authentification
echo "🔐 Test 5: Test d'authentification..."
echo "   Ouvrez votre site Vercel dans le navigateur:"
echo "   $VERCEL_URL"
echo ""
echo "   Dans la console du navigateur (F12), vérifiez:"
echo "   1. localStorage.getItem('authToken') après inscription/connexion"
echo "   2. Pas d'erreurs CORS dans la console"
echo "   3. Les requêtes incluent 'Authorization: Bearer <token>'"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Tests terminés !"
echo ""
echo "Si tout est vert, votre configuration est correcte ! 🎉"

