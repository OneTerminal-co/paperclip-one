#!/bin/bash
# Script para actualizar credenciales temporales de Bedrock

echo "🔐 Actualizador de Credenciales AWS Bedrock"
echo "==========================================="
echo ""
echo "Este script actualiza las credenciales temporales en .env.local"
echo ""

# Solicitar las nuevas credenciales
read -p "Ingresa tu nuevo AWS_ACCESS_KEY_ID: " access_key
read -sp "Ingresa tu nuevo AWS_SECRET_ACCESS_KEY: " secret_key
echo ""
read -p "Ingresa AWS_REGION [us-east-1]: " region

region=${region:-us-east-1}

# Crear .env.local con las nuevas credenciales
cat > .env.local << EOF
# AWS Bedrock - Credenciales temporales (actualizado: $(date))
AWS_ACCESS_KEY_ID=$access_key
AWS_SECRET_ACCESS_KEY=$secret_key
AWS_REGION=$region

# Bedrock Model Configuration
BEDROCK_MODEL=anthropic.claude-3-5-sonnet-20241022
BEDROCK_TEMPERATURE=0.7
BEDROCK_MAX_TOKENS=4096
BEDROCK_REQUEST_TIMEOUT_MS=300000

# Paperclip Configuration (existente)
DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip
PORT=3100
SERVE_UI=false
BETTER_AUTH_SECRET=paperclip-dev-secret
EOF

echo ""
echo "✅ Credenciales actualizadas en .env.local"
echo ""
echo "Próximos pasos:"
echo "  1. Verifica que las credenciales sean correctas:"
echo "     aws sts get-caller-identity"
echo "  2. Ejecuta el test de Bedrock:"
echo "     pnpm build"
echo "     pnpm test:bedrock"
echo ""
