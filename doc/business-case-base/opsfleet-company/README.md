# OpsFleet

**Equipo de agentes IA para operaciones cloud automatizadas.**

```
                    ┌─────────────┐
                    │     CEO     │
                    │   (daily)   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│    FinOps     │  │   Security    │  │   Infra Ops   │
│  (every 8h)   │  │  (every 12h)  │  │  (every 4h)   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Knowledge   │  │    CI/CD      │  │  Compliance   │
│  (on-demand)  │  │  (every 6h)   │  │   (daily)     │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Quick Start

```bash
# 1. Importar la company en Paperclip
cd /path/to/paperclip
npx paperclip import doc/business-case-base/opsfleet-company

# 2. Configurar credenciales de cloud
export AWS_PROFILE=your-profile  # o configurar en la UI

# 3. Los agentes empiezan a correr según su schedule
```

## Configuración

Toda la configuración está en [`.paperclip.yaml`](.paperclip.yaml).

### Activar/Desactivar Agentes

```yaml
agents:
  finops:
    enabled: true   # ✅ Activo
  
  cicd:
    enabled: false  # ❌ Inactivo
```

### Presupuesto por Agente

```yaml
agents:
  finops:
    budget:
      monthlyLimitCents: 8000    # $80 USD/mes
      warnAtPercent: 80          # Alerta al 80%
```

### Permisos (Read vs Write)

Por defecto todos empiezan en modo **read** (solo reportan).

```yaml
agents:
  finops:
    permissions:
      mode: "read"   # Solo reportes y recomendaciones
      # mode: "write"  # Puede ejecutar acciones (apagar instancias, etc)
```

⚠️ **Para habilitar modo write**, el board debe aprobar primero.

### Frecuencias Disponibles

| Frecuencia | Descripción |
|------------|-------------|
| `daily` | Una vez al día (especificar `time: "08:00"`) |
| `every_4_hours` | Cada 4 horas |
| `every_6_hours` | Cada 6 horas |
| `every_8_hours` | Cada 8 horas |
| `every_12_hours` | Cada 12 horas |
| `on_demand` | Solo cuando lo invocan |

## Agentes

| Agente | Descripción | Schedule | Presupuesto | MCPs |
|--------|-------------|----------|-------------|------|
| **CEO** | Síntesis ejecutiva diaria | Daily 8am | $100/mes | slack |
| **FinOps** | Optimización de costos cloud | Cada 8h | $80/mes | aws, azure, slack |
| **Security** | Postura de seguridad continua | Cada 12h | $80/mes | aws, azure, sentry, slack |
| **Infra Ops** | Monitoreo y respuesta a incidentes | Cada 4h | $80/mes | aws, cloudwatch, datadog, pagerduty, slack |
| **Knowledge** | Q&A técnico on-demand | On-demand | $50/mes | *(ninguno)* |
| **CI/CD** | Monitoreo de pipelines | Cada 6h | $50/mes | github, slack |
| **Compliance** | Verificación de cumplimiento | Daily 6am | $60/mes | aws, azure, slack |

## MCP Servers

Cada agente se conecta a los MCP servers que necesita según su perfil.

### Catálogo de MCPs Disponibles

| MCP | Descripción | Autenticación |
|-----|-------------|---------------|
| **aws** | Cost Explorer, EC2, IAM, S3, CloudWatch | `AWS_PROFILE` o Access Key |
| **azure** | Resource Manager, Cost Management, Security Center | Service Principal |
| **slack** | Mensajes, canales, notificaciones | Bot OAuth Token (`xoxb-`) |
| **sentry** | Error tracking, performance monitoring | Auth Token |
| **datadog** | Métricas, logs, APM, dashboards | API Key + App Key |
| **pagerduty** | Incident management, on-call | API Token v2 |
| **github** | Repos, PRs, Actions workflows | Personal Access Token |
| **cloudwatch** | Logs, metrics, alarms | *(hereda de aws)* |

### Configurar MCPs por Agente

```yaml
agents:
  finops:
    mcpServers:
      - aws      # Cost Explorer, EC2
      - azure    # Cost Management
      - slack    # Alertas
```

### Agregar/Quitar MCPs

Edita la lista `mcpServers` de cada agente en `.paperclip.yaml`.

### Registrar un Nuevo MCP

```yaml
mcpServers:
  mi-mcp:
    name: "Mi Custom MCP"
    command: "npx @mi-org/mi-mcp-server"
    lifecycle: shared
    auth:
      env:
        MI_API_KEY:
          kind: secret
          secretRef: "mi-api-key"
```

## Configuración por Defecto

```
ACTIVOS:
  ✅ CEO, FinOps, Security, Infra Ops, Knowledge

INACTIVOS:
  ❌ CI/CD — activar cuando tengas pipelines
  ❌ Compliance — activar si tienes requisitos regulatorios

PRESUPUESTO:
  Total disponible: $500/mes
  Con activos por defecto: ~$390/mes
```

## Credenciales (Secrets)

Configura en **Paperclip UI > Company > Secrets**.

### Mínimos para Arrancar

| Secret | MCP | Descripción |
|--------|-----|-------------|
| `slack-bot-token` | slack | Bot OAuth Token (`xoxb-...`) — **requerido** |
| `aws-access-key-id` | aws | O usa `AWS_PROFILE` local |
| `aws-secret-access-key` | aws | Par con access key ID |

### Todos los Secrets Disponibles

| Secret | MCP | Requerido | Descripción |
|--------|-----|-----------|-------------|
| `slack-bot-token` | slack | ✅ Sí | Bot User OAuth Token |
| `aws-access-key-id` | aws | ⚠️ Si usas AWS | AWS IAM Access Key |
| `aws-secret-access-key` | aws | ⚠️ Si usas AWS | AWS IAM Secret |
| `azure-client-id` | azure | ⚠️ Si usas Azure | Service Principal Client ID |
| `azure-client-secret` | azure | ⚠️ Si usas Azure | Service Principal Secret |
| `sentry-auth-token` | sentry | ❌ Opcional | Sentry Auth Token |
| `datadog-api-key` | datadog | ❌ Opcional | Datadog API Key |
| `datadog-app-key` | datadog | ❌ Opcional | Datadog Application Key |
| `pagerduty-api-token` | pagerduty | ❌ Opcional | PagerDuty API Token v2 |
| `github-token` | github | ❌ Opcional | GitHub PAT o App Token |

## Flujo de Trabajo

1. **Agentes especializados** corren según su schedule y reportan issues
2. **CEO** consolida todos los reportes cada mañana
3. **Board (tú)** revisa el resumen ejecutivo y aprueba acciones
4. **Agentes con modo write** ejecutan lo aprobado

## Ejemplo de Escalación

```
FinOps detecta instancia costosa idle
         ↓
Crea issue: "ec2 i-xxx idle 72h, $89/día"
         ↓
CEO lo incluye en síntesis diaria
         ↓
Board aprueba "terminate"
         ↓
FinOps (modo write) termina la instancia
```

## Personalización

### Agregar un Nuevo Agente

1. Crear directorio `agents/mi-agente/`
2. Crear `agents/mi-agente/AGENTS.md` con las instrucciones
3. Agregar configuración en `.paperclip.yaml`

### Cambiar Modelo de IA

```yaml
agents:
  finops:
    adapter:
      type: claude_local
      config:
        model: claude-sonnet-4-20250514  # Cambiar a opus, etc
```

## Soporte

Para información adicional sobre la configuración de Paperclip, ver la [documentación oficial](https://github.com/paperclipai/paperclip).
