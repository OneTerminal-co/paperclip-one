#!/bin/bash
# OpsFleet Company Setup Script
# Configura todos los agentes especializados con skills y MCPs centralizados

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validar variables de entorno requeridas
if [ -z "$PAPERCLIP_API_URL" ]; then
  echo -e "${RED}Error: PAPERCLIP_API_URL no está configurada${NC}"
  exit 1
fi

if [ -z "$PAPERCLIP_API_KEY" ]; then
  echo -e "${RED}Error: PAPERCLIP_API_KEY no está configurada${NC}"
  exit 1
fi

if [ -z "$PAPERCLIP_COMPANY_ID" ]; then
  echo -e "${RED}Error: PAPERCLIP_COMPANY_ID no está configurada${NC}"
  exit 1
fi

API_URL="${PAPERCLIP_API_URL}/api"
AUTH_HEADER="Authorization: Bearer ${PAPERCLIP_API_KEY}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  OpsFleet Company Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================================
# PASO 1: Escanear y importar skills desde el proyecto
# ============================================================================
echo -e "${YELLOW}[1/3] Escaneando skills del proyecto...${NC}"

SCAN_RESULT=$(curl -sS -X POST "$API_URL/companies/$PAPERCLIP_COMPANY_ID/skills/scan-projects" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{}')

SKILLS_FOUND=$(echo "$SCAN_RESULT" | jq -r '.imported | length')
echo -e "${GREEN}✓ Skills importados: $SKILLS_FOUND${NC}"
echo "$SCAN_RESULT" | jq -r '.imported[] | "  - \(.slug)"'
echo ""

# ============================================================================
# PASO 2: Crear agentes especializados
# ============================================================================
echo -e "${YELLOW}[2/3] Creando agentes especializados...${NC}"

# Función auxiliar para crear agente
create_agent() {
  local NAME="$1"
  local ROLE="$2"
  local SKILLS="$3"
  local SCHEDULE="$4"

  echo -e "  ${BLUE}→ Creando: $NAME${NC}"

  AGENT_DATA=$(cat <<EOF
{
  "name": "$NAME",
  "role": "$ROLE",
  "adapterType": "bedrock_gateway",
  "adapterConfig": {
    "modelId": "${BEDROCK_MODEL:-arn:aws:bedrock:us-east-1:545642978142:application-inference-profile/jp3upemwe214}",
    "awsRegion": "${AWS_REGION:-us-east-1}",
    "maxTokens": 4096,
    "temperature": 0.3
  },
  "runtimeConfig": {
    "heartbeat": {
      "enabled": true,
      "intervalSec": $SCHEDULE,
      "wakeOnDemand": true,
      "maxConcurrentRuns": 1
    }
  },
  "desiredSkills": $SKILLS,
  "budgetMonthlyCents": 2000
}
EOF
)

  RESPONSE=$(curl -sS -X POST "$API_URL/companies/$PAPERCLIP_COMPANY_ID/agents" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "$AGENT_DATA")

  AGENT_ID=$(echo "$RESPONSE" | jq -r '.id')

  if [ "$AGENT_ID" != "null" ] && [ -n "$AGENT_ID" ]; then
    echo -e "  ${GREEN}✓ Creado: $NAME (ID: $AGENT_ID)${NC}"
    echo "$AGENT_ID"
  else
    echo -e "  ${RED}✗ Error creando $NAME${NC}"
    echo "$RESPONSE" | jq '.'
    return 1
  fi
}

# 1. FinOps Agent - Cada 8 horas (28800 segundos)
FINOPS_SKILLS='["paperclip", "finops"]'
FINOPS_ID=$(create_agent "FinOps Agent" "finops" "$FINOPS_SKILLS" 28800)
echo ""

# 2. Security Agent - Cada 12 horas (43200 segundos)
SECURITY_SKILLS='["paperclip", "security", "incident-response"]'
SECURITY_ID=$(create_agent "Security Agent" "security" "$SECURITY_SKILLS" 43200)
echo ""

# 3. Infra Ops Agent - Cada 4 horas (14400 segundos)
INFRA_SKILLS='["paperclip", "infra-ops", "monitoring"]'
INFRA_ID=$(create_agent "Infra Ops Agent" "sre" "$INFRA_SKILLS" 14400)
echo ""

# 4. Knowledge Agent - On-demand (no schedule, solo wakeOnDemand)
KNOWLEDGE_SKILLS='["paperclip", "knowledge"]'
KNOWLEDGE_ID=$(create_agent "Knowledge Agent" "support" "$KNOWLEDGE_SKILLS" 86400)
echo ""

# 5. CI/CD Agent - Cada 6 horas (21600 segundos)
CICD_SKILLS='["paperclip", "cicd"]'
CICD_ID=$(create_agent "CI/CD Agent" "devops" "$CICD_SKILLS" 21600)
echo ""

# 6. Compliance Agent - Cada 24 horas (86400 segundos)
COMPLIANCE_SKILLS='["paperclip", "compliance"]'
COMPLIANCE_ID=$(create_agent "Compliance Agent" "compliance" "$COMPLIANCE_SKILLS" 86400)
echo ""

# 7. CEO Agent - Diario (86400 segundos)
CEO_SKILLS='["paperclip", "executive-summary"]'
CEO_ID=$(create_agent "CEO Agent" "ceo" "$CEO_SKILLS" 86400)
echo ""

# ============================================================================
# PASO 3: Configurar relaciones de reporte
# ============================================================================
echo -e "${YELLOW}[3/3] Configurando cadena de mando...${NC}"

# Todos los agentes reportan al CEO
for AGENT_ID in "$FINOPS_ID" "$SECURITY_ID" "$INFRA_ID" "$KNOWLEDGE_ID" "$CICD_ID" "$COMPLIANCE_ID"; do
  if [ -n "$AGENT_ID" ] && [ "$AGENT_ID" != "null" ]; then
    curl -sS -X PATCH "$API_URL/agents/$AGENT_ID" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -d "{\"reportsTo\": \"$CEO_ID\"}" > /dev/null
  fi
done

echo -e "${GREEN}✓ Cadena de mando configurada${NC}"
echo ""

# ============================================================================
# Resumen Final
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ OpsFleet Company configurada exitosamente${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Agentes creados:"
echo "  1. FinOps Agent      → Cada 8 horas"
echo "  2. Security Agent    → Cada 12 horas"
echo "  3. Infra Ops Agent   → Cada 4 horas"
echo "  4. Knowledge Agent   → On-demand"
echo "  5. CI/CD Agent       → Cada 6 horas"
echo "  6. Compliance Agent  → Cada 24 horas"
echo "  7. CEO Agent         → Diario (8am)"
echo ""
echo -e "Dashboard: ${BLUE}http://localhost:3100/OPSFLEET/agents${NC}"
echo ""
