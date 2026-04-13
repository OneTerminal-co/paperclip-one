# OpsFleet Company — Arquitectura de Agentes Especializados

## 🎯 Visión General

OpsFleet es un sistema de **7 agentes especializados** que automatizan operaciones cloud 24/7. Cada agente tiene:

1. **Skills modulares** — Instrucciones específicas de su dominio
2. **MCP tools centralizados** — Herramientas compartidas a nivel de compañía
3. **Secrets compartidos** — Credenciales configuradas una sola vez

---

## 📁 Estructura Creada

```
workspaces/opsfleet/
├── README.md                      # ← Estás aquí
├── company-secrets.yaml           # Secrets centralizados (AWS, Azure, etc.)
├── agents-config.yaml             # Definición de 7 agentes especializados
├── setup-opsfleet.sh              # Script de instalación automatizado
│
└── skills/                        # Biblioteca de skills
    └── finops/
        └── skill.md               # Ejemplo completo de FinOps skill
```

---

## 🚀 Próximos Pasos

### 1. Revisar los archivos creados

- `company-secrets.yaml` — Configuración centralizada de AWS/Azure credentials
- `agents-config.yaml` — Definición de los 7 agentes con skills y schedules
- `setup-opsfleet.sh` — Script para crear todos los agentes automáticamente
- `skills/finops/skill.md` — Ejemplo completo de skill modular

### 2. Configurar variables de entorno

```bash
# AWS
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"

# Azure
export AZURE_SUBSCRIPTION_ID="..."
export AZURE_TENANT_ID="..."
export AZURE_CLIENT_ID="..."
export AZURE_CLIENT_SECRET="..."

# Paperclip
export PAPERCLIP_API_URL="http://localhost:3100"
export PAPERCLIP_API_KEY="pcp_..."
export PAPERCLIP_COMPANY_ID="..."
```

### 3. Ejecutar setup

```bash
chmod +x setup-opsfleet.sh
./setup-opsfleet.sh
```

---

## 🏗️ Arquitectura Explicada

### Capa 1: Secrets Centralizados

Los **secrets** (AWS credentials, Azure tokens, etc.) se configuran **UNA VEZ** a nivel de compañía en `company-secrets.yaml`.

**Ventaja:** No necesitas copiar las mismas credentials en cada agente.

### Capa 2: MCP Servers Compartidos

Los **MCP servers** (aws-cost-explorer, aws-security, etc.) se configuran a nivel de compañía.

Cada agente **activa solo los MCPs que necesita**:
- FinOps Agent → `aws-cost-explorer`, `azure-cost-management`
- Security Agent → `aws-security`, `azure-defender`
- Infra Ops → `aws-cloudwatch`

### Capa 3: Skills Modulares

Los **skills** son módulos de conocimiento:
- `finops` skill → Instrucciones de optimización de costos
- `security` skill → Instrucciones de auditoría de seguridad
- `infra-ops` skill → Instrucciones de monitoreo

Cada agente solo carga los skills de su dominio.

### Capa 4: Agentes Especializados

7 agentes con roles específicos:

| Agente | Frecuencia | Skills | MCPs |
|--------|-----------|--------|------|
| **FinOps** | Cada 8h | `finops` | `aws-cost`, `azure-cost` |
| **Security** | Cada 12h | `security`, `incident-response` | `aws-security`, `azure-defender` |
| **Infra Ops** | Cada 4h | `infra-ops`, `monitoring` | `aws-cloudwatch` |
| **Knowledge** | On-demand | `knowledge` | `aws-knowledge-base` |
| **CI/CD** | Cada 6h | `cicd` | `github-actions` |
| **Compliance** | Cada 24h | `compliance` | `aws-security` |
| **CEO** | Diario | `executive-summary` | `paperclip` |

---

## ✅ Ventajas de esta Arquitectura

### 1. DRY (Don't Repeat Yourself)
- AWS credentials configuradas **una vez**
- Skills reutilizables entre agentes
- MCPs compartidos

### 2. Seguridad
- Secrets centralizados (fácil rotación)
- Least privilege (cada agente solo tiene los tools que necesita)
- Audit trail completo

### 3. Mantenibilidad
- Agregar nuevo skill = crear un archivo `.md`
- Agregar nuevo agente = asignar skills existentes
- Actualizar credentials = un solo lugar

### 4. Modularidad
- Activar/desactivar skills por agente
- Activar/desactivar MCPs por agente
- Cambiar schedules sin tocar código

---

## 📚 Ejemplo Completo: FinOps Agent

Ver `skills/finops/skill.md` para un ejemplo completo que incluye:

- ✅ Responsabilidades específicas (cost analysis, idle detection, rightsizing)
- ✅ Criterios de escalación (cuándo alertar al CEO)
- ✅ Herramientas disponibles (MCP tools)
- ✅ Formato de output esperado
- ✅ Referencias a best practices

Este mismo patrón se repite para cada agente.

---

## 🔄 Flujo de Trabajo Típico

```
FinOps Agent (8am)
  ↓ Detecta: EC2 spend +60%
  ↓ Crea: Issue CRITICAL
  ↓ Asigna: Infra Ops Agent
  
Infra Ops Agent (heartbeat)
  ↓ Analiza: CloudWatch metrics
  ↓ Root cause: ASG mal configurado
  ↓ Escala: CEO Agent
  
CEO Agent (8am)
  ↓ Sintetiza: Reporte ejecutivo
  ↓ Decisión: Requiere board approval
  ↓ Crea: Approval request
```

---

## 🛠️ Mantenimiento

### Agregar un nuevo skill

```bash
# 1. Crear archivo
mkdir -p skills/new-skill
cat > skills/new-skill/skill.md <<EOF
---
name: new-skill
description: New skill description
---
# Content...
EOF

# 2. Importar
POST /api/companies/{companyId}/skills/scan-projects

# 3. Asignar a agente
POST /api/agents/{agentId}/skills/sync
{ "desiredSkills": ["paperclip", "new-skill"] }
```

### Agregar un nuevo MCP server

Editar `company-secrets.yaml`:

```yaml
mcpServers:
  new-service:
    package: "@opsfleet/mcp-new-service"
    env:
      API_KEY: "{{secrets.new_service_api_key}}"
```

Asignar al agente en `agents-config.yaml`:

```yaml
agentMcpMapping:
  target-agent:
    - "paperclip"
    - "new-service"
```

---

## 🎯 Beneficios para OpsFleet

1. **Escalabilidad** — Agregar nuevo agente = configuración, no código
2. **Multi-tenant** — Misma arquitectura para múltiples clientes
3. **Costos** — Skills compartidos = menos duplicación
4. **Velocidad** — Setup de nuevo cliente en minutos con `setup-opsfleet.sh`
5. **Auditoría** — Todo centralizado en Paperclip

---

## 📞 Referencias

- **Paperclip Skills**: `/workspaces/opsfleet/skills/`
- **Company Secrets**: `company-secrets.yaml`
- **Agents Config**: `agents-config.yaml`
- **Setup Script**: `setup-opsfleet.sh`
- **Dashboard**: `http://localhost:3100/OPSFLEET/agents`

---

**¡Listo para crear tu equipo de agentes OpsFleet!** 🚀
