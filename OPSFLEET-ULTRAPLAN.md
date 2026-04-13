# 🚀 OpsFleet ULTRA-PLAN

**Master Plan para Implementación Completa de OpsFleet on Paperclip**

**Versión:** 1.0  
**Fecha:** 13 de Abril, 2026  
**Status:** 🟢 En Progreso (Fase 1-2 completadas)

---

## 📊 ESTADO ACTUAL

### ✅ COMPLETADO (Fases 1-2)

#### Fase 1: Arquitectura & Setup (100%)
- ✅ Estructura de workspace en `workspaces/opsfleet/`
- ✅ 7 agentes definidos en `agents-config.yaml`
- ✅ Skills modulares: `skills/finops/skill.md` (ejemplo completo)
- ✅ Secrets centralizados en `company-secrets.yaml`
- ✅ Script de setup automatizado: `setup-opsfleet.sh`
- ✅ Documentación completa (README, COMPANY.md)

#### Fase 2: UI Controls (100%)
- ✅ Toggle switch para pause/resume en lista de agentes
- ✅ Botón Play para trigger manual de heartbeat
- ✅ Auto-refresh de estado
- ✅ Responsive (desktop + mobile)
- ✅ Type-safe (TypeScript ✓)

### 🔄 PENDIENTE (Fases 3-8)

```
Fase 3: MCP Servers        ⏳ 0%   [Crítico]
Fase 4: Skills Completos   ⏳ 14%  [1/7 completado]
Fase 5: Testing E2E        ⏳ 0%   [Importante]
Fase 6: AWS Integration    ⏳ 0%   [Crítico]
Fase 7: UI Avanzada        ⏳ 0%   [Nice-to-have]
Fase 8: Production Ready   ⏳ 0%   [Crítico]
```

---

## 🎯 ROADMAP COMPLETO

### 📅 **SEMANA 1: Foundations** (Días 1-7)

#### Día 1-2: Setup & Validación ✅ COMPLETADO
- [x] Workspace estructurado
- [x] UI controls implementados
- [x] Documentación base

#### Día 3-4: MCP Servers Core 🔴 CRÍTICO
**Objetivo:** Implementar los 3 MCPs críticos para que los agentes puedan trabajar.

##### MCP 1: AWS Cost Explorer (`@opsfleet/mcp-aws-cost`)
**Prioridad:** 🔴 CRÍTICA (FinOps Agent lo necesita)

**Ubicación:**
```
packages/mcp-aws-cost/
├── package.json
├── src/
│   ├── index.ts           # Server MCP
│   ├── tools.ts           # Tool definitions
│   ├── cost-explorer.ts   # AWS SDK wrapper
│   └── compute-optimizer.ts
└── tsconfig.json
```

**Tools a implementar:**
```typescript
// 1. Get cost and usage
getCostAndUsage(params: {
  start: string;           // "2026-04-01"
  end: string;             // "2026-04-13"
  granularity: "DAILY" | "MONTHLY";
  groupBy?: string[];      // ["SERVICE", "ACCOUNT"]
  filter?: AWSCostFilter;
})

// 2. Get rightsizing recommendations
getRightsizingRecommendations(params: {
  service: "EC2" | "RDS" | "Lambda";
  accountId?: string;
})

// 3. Get Reserved Instances
listReservedInstances(params: {
  expiringSoon?: boolean;  // < 30 days
  utilization?: "low";     // < 80%
})

// 4. Get Savings Plans
listSavingsPlans(params: {
  status: "active" | "expiring";
})
```

**AWS SDK Setup:**
```typescript
import { CostExplorerClient } from "@aws-sdk/client-cost-explorer";
import { ComputeOptimizerClient } from "@aws-sdk/client-compute-optimizer";

const costClient = new CostExplorerClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

**Testing:**
```bash
# Test local
npx @opsfleet/mcp-aws-cost

# Test con Claude Code
# Agregar a mcp.json y probar getCostAndUsage()
```

**Tiempo estimado:** 6-8 horas

---

##### MCP 2: AWS Security (`@opsfleet/mcp-aws-security`)
**Prioridad:** 🔴 CRÍTICA (Security Agent lo necesita)

**Tools a implementar:**
```typescript
// 1. SecurityHub findings
getSecurityHubFindings(params: {
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "ACTIVE" | "ARCHIVED";
  limit?: number;
})

// 2. IAM audit
auditIAMUsers(params: {
  checkMFA?: boolean;
  checkOldAccessKeys?: boolean;  // > 90 days
  checkUnusedCredentials?: boolean;
})

// 3. Security Groups audit
auditSecurityGroups(params: {
  checkPublicAccess?: boolean;   // 0.0.0.0/0
  dangerousPorts?: number[];     // [22, 3389, 5432, 3306]
})

// 4. S3 public buckets
listPublicS3Buckets()

// 5. GuardDuty findings
getGuardDutyFindings(params: {
  severity: "HIGH" | "MEDIUM" | "LOW";
  limit?: number;
})
```

**Tiempo estimado:** 8-10 horas

---

##### MCP 3: AWS CloudWatch (`@opsfleet/mcp-aws-cloudwatch`)
**Prioridad:** 🟡 ALTA (Infra Ops Agent lo necesita)

**Tools a implementar:**
```typescript
// 1. Get metrics
getMetricStatistics(params: {
  namespace: string;       // "AWS/EC2"
  metricName: string;      // "CPUUtilization"
  instanceId?: string;
  startTime: Date;
  endTime: Date;
  period: number;          // 300 (5 min)
  statistics: string[];    // ["Average", "Maximum"]
})

// 2. List alarms
listAlarms(params: {
  stateValue?: "ALARM" | "OK" | "INSUFFICIENT_DATA";
  actionPrefix?: string;
})

// 3. Logs Insights query
queryLogsInsights(params: {
  logGroupName: string;
  query: string;
  startTime: Date;
  endTime: Date;
  limit?: number;
})
```

**Tiempo estimado:** 6-8 horas

---

#### Día 5-7: Skills Completos 🟡 IMPORTANTE

**Objetivo:** Completar los 6 skills restantes.

##### Prioridad 1: Security Skill (Día 5)
**Basado en:** `workspaces/opsfleet/skills/finops/skill.md`

```markdown
# Security Skill

## Core Responsibilities (Every 12 hours)

1. SecurityHub Findings Review
2. IAM Audit
3. Security Groups Audit
4. S3 Public Access Check
5. GuardDuty Threat Detection

## Tools & MCP Servers Available
- `aws-security` MCP Server
- `paperclip` MCP Server

## Escalation Rules
- CRITICAL finding → CEO Agent
- Credential compromise → Board + immediate action
```

**Contenido:**
- [ ] Definir criterios de severidad
- [ ] Escalation matrix
- [ ] SOPs para remediación común
- [ ] Output format examples
- [ ] Best practices referencias

**Tiempo estimado:** 3-4 horas

---

##### Prioridad 2: Infra Ops Skill (Día 5-6)
```markdown
# Infra Ops Skill

## Core Responsibilities (Every 4 hours)

1. CloudWatch Metrics Review
2. Alarm Status Check
3. Instance Health Checks
4. Auto Scaling Group Review
5. Log Analysis (Critical Errors)

## Tools Available
- `aws-cloudwatch` MCP Server
```

**Tiempo estimado:** 3-4 horas

---

##### Prioridad 3-6: Resto de Skills (Día 6-7)
- [ ] CI/CD Skill (2-3h)
- [ ] Compliance Skill (3-4h)
- [ ] Knowledge Skill (2h)
- [ ] Executive Summary Skill (2h)

**Total:** ~12 horas

---

### 📅 **SEMANA 2: Integration & Testing** (Días 8-14)

#### Día 8-9: AWS Integration Real 🔴 CRÍTICO

**Objetivo:** Conectar con AWS real y verificar que todo funciona.

##### Setup de AWS Credentials
```bash
# 1. Crear IAM Role con permisos mínimos
aws iam create-role --role-name OpsFleetReadOnly

# 2. Attach policies
aws iam attach-role-policy \
  --role-name OpsFleetReadOnly \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess

aws iam attach-role-policy \
  --role-name OpsFleetReadOnly \
  --policy-arn arn:aws:iam::aws:policy/AWSSupportAccess

# 3. Crear access key para testing
aws iam create-access-key --user-name opsfleet-service
```

##### Testing Flow
```bash
# Test 1: FinOps Agent
cd workspaces/opsfleet
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export PAPERCLIP_API_URL="http://localhost:3100"
export PAPERCLIP_API_KEY="pcp_..."
export PAPERCLIP_COMPANY_ID="..."

# Crear agente
./setup-opsfleet.sh

# Trigger manual desde UI
# Abrir http://localhost:3100/OPSFLEET/agents
# Click en Play (▶️) en FinOps Agent
# Verificar que:
# - Se ejecuta el heartbeat
# - Llama a aws-cost-explorer MCP
# - Obtiene datos reales de Cost Explorer
# - Crea issue en Paperclip con hallazgos
```

##### Validación
- [ ] FinOps Agent obtiene costos reales
- [ ] Security Agent detecta findings reales
- [ ] Infra Ops Agent lee métricas reales
- [ ] Issues creados correctamente en Paperclip
- [ ] Formato de output es legible

**Tiempo estimado:** 8-10 horas

---

#### Día 10-11: Testing E2E 🟡 IMPORTANTE

**Escenarios a probar:**

##### Escenario 1: Detección de Anomalía de Costo
```
1. FinOps Agent ejecuta heartbeat (cada 8h)
2. Detecta: Gasto EC2 +60% vs baseline
3. Crea issue: CRITICAL priority
4. Asigna a: Infra Ops Agent
5. Infra Ops revisa CloudWatch
6. Root cause: ASG mal configurado
7. Escala a: CEO Agent
8. CEO genera reporte ejecutivo
```

**Validación:**
- [ ] Detección funciona
- [ ] Issue se crea correctamente
- [ ] Reasignación funciona
- [ ] Escalación al CEO funciona
- [ ] Reporte final es útil

---

##### Escenario 2: Vulnerabilidad de Seguridad
```
1. Security Agent ejecuta (cada 12h)
2. Detecta: Security Group con 0.0.0.0/0 en puerto 22
3. Severidad: CRITICAL
4. Crea issue con SOPs
5. Escala a: CEO + Board
```

**Validación:**
- [ ] Detección funciona
- [ ] Severidad correcta
- [ ] SOPs incluidas
- [ ] Escalación correcta

---

##### Escenario 3: Incident Response
```
1. GuardDuty alerta: Comportamiento anómalo
2. Security Agent lo detecta
3. Issue CRITICAL creado inmediatamente
4. CEO notificado
5. Board recibe approval request para acción
```

**Tiempo estimado:** 8-12 horas

---

#### Día 12-14: Refinamiento

##### Mejoras de UX
- [ ] Agregar "Next run in: Xh Xm" en lista
- [ ] Mostrar % de budget usado
- [ ] Filtros avanzados (por skill, por MCP)
- [ ] Timeline de próximos runs

##### Mejoras de Skills
- [ ] Agregar más ejemplos en cada skill
- [ ] Mejorar criterios de escalación
- [ ] Agregar troubleshooting sections

##### Documentación
- [ ] Screenshots de la UI
- [ ] Video demo (5 min)
- [ ] Troubleshooting guide
- [ ] FAQ

**Tiempo estimado:** 12-16 horas

---

### 📅 **SEMANA 3: Azure & Advanced Features** (Días 15-21)

#### Día 15-17: Azure Support 🟡 ALTA

##### MCP 4: Azure Cost Management
```typescript
// @opsfleet/mcp-azure-cost
queryCosts(params: {
  scope: string;           // Subscription ID
  timeframe: "MonthToDate" | "Custom";
  groupBy?: string[];      // ["ServiceName", "Location"]
})

getAdvisorRecommendations(params: {
  category: "Cost" | "HighAvailability" | "Security";
})
```

##### MCP 5: Azure Defender
```typescript
// @opsfleet/mcp-azure-security
getDefenderForCloudScore()
getSecurityAlerts(params: {
  severity: "High" | "Medium" | "Low";
})
```

**Tiempo estimado:** 12-16 horas

---

#### Día 18-19: Multi-Cloud Support

**Objetivo:** FinOps Agent puede analizar AWS + Azure simultáneamente.

##### Modificar FinOps Skill
```markdown
## Multi-Cloud Cost Analysis

1. Query AWS Cost Explorer
2. Query Azure Cost Management
3. Normalize costs to USD
4. Aggregate by:
   - Cloud provider
   - Service category
   - Environment (dev/prod)
5. Generate consolidated report
```

##### Testing
- [ ] Ejecutar contra AWS + Azure
- [ ] Reporte consolidado correcto
- [ ] Anomalías detectadas en ambos clouds

**Tiempo estimado:** 8-10 horas

---

#### Día 20-21: Advanced Features 🔵 NICE-TO-HAVE

##### Feature 1: Budget Forecasting
```
FinOps Agent:
- Analiza primeros 10 días del mes
- Proyecta gasto total del mes
- Alerta si proyección > budget aprobado
```

##### Feature 2: Chargeback Reports
```
FinOps Agent:
- Tag enforcement check
- Genera reporte de chargeback por equipo
- Identifica recursos sin tags
```

##### Feature 3: Automated Remediation (Opt-in)
```
⚠️ Requiere permisos write
FinOps Agent:
- Detecta instancia idle
- Solicita approval al board
- Si aprobado: apaga instancia
- Genera reporte de ahorro real
```

**Tiempo estimado:** 16-20 horas

---

### 📅 **SEMANA 4: Production Readiness** (Días 22-28)

#### Día 22-23: Seguridad & Compliance 🔴 CRÍTICO

##### Security Hardening
- [ ] Rotate secrets cada 90 días
- [ ] Audit logs habilitados
- [ ] Rate limiting en APIs
- [ ] Secrets en AWS Secrets Manager (no .env)
- [ ] IAM roles con least privilege
- [ ] MFA obligatorio para board

##### Compliance
- [ ] SOC2 compliance check
- [ ] GDPR compliance (si aplica)
- [ ] Data retention policies
- [ ] Audit trail completo

**Tiempo estimado:** 12-16 horas

---

#### Día 24-25: Monitoring & Alerting

##### Setup de Observability
```yaml
# Paperclip metrics
- agent_heartbeat_duration_seconds
- agent_heartbeat_errors_total
- agent_budget_spent_percentage
- mcp_call_duration_seconds
- issue_creation_rate

# Alerting rules
alerts:
  - name: AgentBudgetExceeded
    expr: agent_budget_spent_percentage > 80
    for: 5m
    severity: warning
  
  - name: HeartbeatFailing
    expr: rate(agent_heartbeat_errors_total[5m]) > 0.5
    for: 10m
    severity: critical
```

##### Dashboards
- [ ] Grafana dashboard para OpsFleet
- [ ] Real-time agent status
- [ ] Budget consumption por agente
- [ ] Issues created por día
- [ ] MCP call latency

**Tiempo estimado:** 8-12 horas

---

#### Día 26-27: Performance Optimization

##### Backend Optimization
- [ ] Query optimization (agents list)
- [ ] Caching de heartbeat context
- [ ] Batch issue creation
- [ ] Connection pooling

##### Frontend Optimization
- [ ] Lazy loading de agent list
- [ ] Virtual scrolling (si >100 agentes)
- [ ] Optimistic updates
- [ ] Service worker para offline

##### MCP Optimization
- [ ] Connection reuse
- [ ] Response caching (5 min TTL)
- [ ] Batch requests
- [ ] Timeout handling

**Tiempo estimado:** 12-16 horas

---

#### Día 28: Launch Preparation

##### Pre-Launch Checklist
- [ ] Todas las tests E2E pasan
- [ ] Documentación completa
- [ ] Video demo grabado
- [ ] Pricing calculado
- [ ] Support plan definido
- [ ] Onboarding flow testeado

##### Launch Day Tasks
```bash
# 1. Backup de la DB
pg_dump paperclip > backup-pre-launch.sql

# 2. Deploy a producción
git tag v1.0.0
git push origin v1.0.0

# 3. Smoke tests en prod
curl -X POST $PROD_URL/api/agents/me

# 4. Monitor por 4 horas
watch -n 60 'curl $PROD_URL/health'
```

**Tiempo estimado:** 8 horas

---

## 📐 ARQUITECTURA END-TO-END

### Stack Completo

```
┌─────────────────────────────────────────────────────────┐
│ CAPA 1: User Interface                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  React UI (Vite + TypeScript)                          │
│  ├── Agents.tsx          → Lista con toggle/play       │
│  ├── AgentDetail.tsx     → Detalles + config          │
│  └── Dashboard.tsx       → Métricas agregadas          │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│ CAPA 2: Paperclip Control Plane                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Express API Server                                     │
│  ├── /api/agents         → CRUD agentes                │
│  ├── /api/agents/:id/pause → Pausar agente            │
│  ├── /api/agents/:id/resume → Reanudar agente         │
│  ├── /api/agents/:id/heartbeat/invoke → Trigger       │
│  ├── /api/issues         → CRUD issues                 │
│  └── /api/heartbeats     → Run history                 │
│                                                         │
│  Scheduler                                              │
│  └── Cron jobs por agente (intervalSec)               │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            ↓ Invoke
┌─────────────────────────────────────────────────────────┐
│ CAPA 3: Agent Runtime (Bedrock Gateway Adapter)        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Bedrock Gateway                                        │
│  ├── Load AGENTS.md       → Instrucciones base        │
│  ├── Load skills          → Skills modulares           │
│  ├── Init MCP clients     → Conectar a MCPs           │
│  ├── Execute heartbeat    → LLM reasoning loop        │
│  └── Report results       → Update issue status       │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            ↓ MCP Protocol
┌─────────────────────────────────────────────────────────┐
│ CAPA 4: MCP Servers (Tools)                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  @opsfleet/mcp-aws-cost                                │
│  ├── getCostAndUsage()                                 │
│  ├── getRightsizingRecommendations()                   │
│  └── listReservedInstances()                           │
│                                                         │
│  @opsfleet/mcp-aws-security                            │
│  ├── getSecurityHubFindings()                          │
│  ├── auditIAMUsers()                                   │
│  └── auditSecurityGroups()                             │
│                                                         │
│  @opsfleet/mcp-aws-cloudwatch                          │
│  ├── getMetricStatistics()                             │
│  ├── listAlarms()                                      │
│  └── queryLogsInsights()                               │
│                                                         │
│  @paperclipai/mcp-server                               │
│  ├── paperclipCreateIssue()                            │
│  ├── paperclipUpdateIssue()                            │
│  └── paperclipAddComment()                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            ↓ AWS SDK
┌─────────────────────────────────────────────────────────┐
│ CAPA 5: Cloud Providers                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  AWS                                                    │
│  ├── Cost Explorer                                     │
│  ├── SecurityHub                                       │
│  ├── GuardDuty                                         │
│  ├── CloudWatch                                        │
│  └── IAM                                               │
│                                                         │
│  Azure (Fase 3)                                        │
│  ├── Cost Management                                   │
│  ├── Defender for Cloud                                │
│  └── Monitor                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔢 ESTIMACIONES DE TIEMPO

### Total por Fase

| Fase | Descripción | Horas | Días | Status |
|------|-------------|-------|------|--------|
| 1 | Arquitectura & Setup | 16h | 2d | ✅ DONE |
| 2 | UI Controls | 8h | 1d | ✅ DONE |
| 3 | MCP Servers Core | 24h | 3d | ⏳ TODO |
| 4 | Skills Completos | 20h | 2-3d | ⏳ 14% |
| 5 | Testing E2E | 20h | 2-3d | ⏳ TODO |
| 6 | AWS Integration | 12h | 1-2d | ⏳ TODO |
| 7 | Azure Support | 24h | 3d | ⏳ TODO |
| 8 | Production Ready | 32h | 4d | ⏳ TODO |
| **TOTAL** | | **156h** | **~20 días** | **13% done** |

### Desglose Semanal

```
Semana 1: Foundations        ━━━━━━━━━━ 40h  [Días 1-7]   ✅ 50% done
Semana 2: Integration        ━━━━━━━━━━ 40h  [Días 8-14]  ⏳ 0% done
Semana 3: Multi-Cloud        ━━━━━━━━━━ 40h  [Días 15-21] ⏳ 0% done
Semana 4: Production         ━━━━━━━━━━ 36h  [Días 22-28] ⏳ 0% done
```

---

## 🎯 OBJETIVOS POR MILESTONE

### Milestone 1: MVP Funcional (Semana 1-2) 🎯
**Objetivo:** FinOps + Security Agents funcionando con AWS real.

**Criterios de Éxito:**
- [x] UI permite pausar/reanudar agentes
- [ ] FinOps Agent detecta anomalías de costo reales
- [ ] Security Agent detecta vulnerabilidades reales
- [ ] Issues creados automáticamente en Paperclip
- [ ] CEO Agent genera reporte ejecutivo

**Demo:**
```
1. Mostrar lista de agentes en UI
2. Pausar Security Agent (toggle OFF)
3. Trigger manual de FinOps Agent (Play ▶️)
4. Ver heartbeat ejecutándose
5. Ver issue creado con hallazgos reales de AWS
6. Reanudar Security Agent
```

---

### Milestone 2: Multi-Cloud (Semana 3) 🌐
**Objetivo:** Soporte completo para AWS + Azure.

**Criterios de Éxito:**
- [ ] FinOps Agent analiza AWS + Azure
- [ ] Security Agent audita ambos clouds
- [ ] Reporte consolidado multi-cloud
- [ ] Detección de anomalías cross-cloud

---

### Milestone 3: Production (Semana 4) 🚀
**Objetivo:** Listo para clientes reales.

**Criterios de Éxito:**
- [ ] Security hardening completo
- [ ] Monitoring & alerting configurado
- [ ] Performance optimizado (<2s response time)
- [ ] Documentación completa
- [ ] Video demo publicado
- [ ] 5 clientes beta testeando

---

## 💰 PRICING MODEL

### Estructura de Costos

#### Costos por Agente (AWS/mes)
```
Bedrock Claude Sonnet:
- Input:  $3.00 / 1M tokens
- Output: $15.00 / 1M tokens

FinOps Agent (cada 8h, 3 runs/día):
- Prompt: ~5,000 tokens/run × 3 × 30 = 450K tokens/mes
- Output: ~2,000 tokens/run × 3 × 30 = 180K tokens/mes
- Costo: (450K × $3) + (180K × $15) = $1.35 + $2.70 = $4.05/mes

7 Agentes × $4.05 = ~$28/mes en Bedrock
+ AWS API calls = ~$2/mes
+ Paperclip hosting = ~$10/mes
─────────────────────────────────
TOTAL COSTO: ~$40/mes
```

#### Pricing para Clientes
```
Tier 1: Starter
- 3 agentes activos (FinOps, Security, CEO)
- AWS only
- Email support
- $99/mes

Tier 2: Professional ⭐ RECOMENDADO
- 7 agentes activos
- AWS + Azure
- Slack support
- Custom schedules
- $349/mes

Tier 3: Enterprise
- Unlimited agentes
- Multi-cloud (AWS, Azure, GCP)
- Dedicated support
- Custom MCPs
- SLA 99.9%
- $999/mes

Margen: 60-70%
```

---

## 🚨 RIESGOS & MITIGACIÓN

### Riesgo 1: Bedrock Latency 🟡 MEDIO
**Problema:** Bedrock puede tardar 30-60s por heartbeat.

**Mitigación:**
- Implementar timeout de 2 min
- Usar prompt caching (reduce tokens en 50%)
- Ejecutar agentes en paralelo (no secuencial)
- Considerar Claude 3 Haiku para tareas simples

---

### Riesgo 2: AWS Rate Limits 🟡 MEDIO
**Problema:** SecurityHub/GuardDuty tienen rate limits.

**Mitigación:**
- Implementar exponential backoff
- Cachear findings por 15 min
- Batching de requests
- Alert cuando se acerca al límite

---

### Riesgo 3: False Positives 🟡 MEDIO
**Problema:** Agente detecta "anomalías" que son normales.

**Mitigación:**
- Refinar criterios en skills
- Agregar "known good" patterns
- Learning period de 7 días
- Board puede marcar como false positive

---

### Riesgo 4: Budget Overrun 🔴 ALTO
**Problema:** Agente gasta más budget del aprobado.

**Mitigación:**
- Hard limit en Paperclip (rechaza run si >100% budget)
- Alert cuando >80% budget
- Auto-pause cuando alcanza 100%
- Budget por agente + budget global

---

## ✅ DEFINITION OF DONE

### Por Fase

#### Fase 3: MCP Servers ✅
- [ ] 3 MCPs implementados (aws-cost, aws-security, cloudwatch)
- [ ] Unit tests (coverage >80%)
- [ ] Integration tests con AWS real
- [ ] Documentación de cada tool
- [ ] Publicado en npm (@opsfleet scope)

#### Fase 4: Skills ✅
- [ ] 7 skills completos
- [ ] Cada skill con ejemplos
- [ ] Escalation matrix definida
- [ ] References actualizadas
- [ ] Peer review completado

#### Fase 5: Testing E2E ✅
- [ ] 3 escenarios principales testeados
- [ ] Issues creados correctamente
- [ ] Escalación funciona
- [ ] No false positives en test run
- [ ] Performance aceptable (<2 min por heartbeat)

#### Fase 8: Production ✅
- [ ] Security audit pasado
- [ ] Load testing (100 agentes concurrentes)
- [ ] Monitoring configurado
- [ ] Runbook de incident response
- [ ] 3 clientes beta testeando por 1 semana

---

## 📋 QUICK START (Próximos Pasos Inmediatos)

### HOY (Día 3) - MCP AWS Cost

```bash
# 1. Crear package
mkdir -p packages/mcp-aws-cost
cd packages/mcp-aws-cost

# 2. Init
pnpm init

# 3. Install deps
pnpm add @aws-sdk/client-cost-explorer @aws-sdk/client-compute-optimizer
pnpm add -D @types/node typescript

# 4. Create src/
mkdir src
touch src/index.ts src/tools.ts src/cost-explorer.ts

# 5. Implement getCostAndUsage tool
# Ver detalles en Día 3-4 arriba

# 6. Test local
pnpm build
node dist/index.js

# 7. Test con agente
# Agregar a company-secrets.yaml
# Trigger FinOps Agent
# Verificar que llama al MCP
```

### MAÑANA (Día 4) - MCP AWS Security

Similar flow para aws-security MCP.

### PRÓXIMA SEMANA - Testing E2E

Probar escenarios reales con AWS.

---

## 📞 REFERENCIAS

- **Docs Actuales:**
  - [Workspace README](./workspaces/README.md)
  - [OpsFleet README](./workspaces/opsfleet/README.md)
  - [Implementation Summary](./OPSFLEET-IMPLEMENTATION-SUMMARY.md)
  - [Architecture Proposal](./OPSFLEET-ARCHITECTURE-PROPOSAL.md)

- **Paperclip Docs:**
  - [Skills Reference](./docs/skills.md)
  - [MCP Integration](./docs/mcp.md)
  - [Agent Adapters](./adapter-plugin.md)

- **AWS Docs:**
  - [Cost Explorer API](https://docs.aws.amazon.com/cost-management/latest/APIReference/)
  - [SecurityHub API](https://docs.aws.amazon.com/securityhub/latest/APIReference/)
  - [CloudWatch API](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/)

---

## 🎬 CONCLUSION

**Status:** 🟢 13% Completado (Fases 1-2 ✅)

**Próximo Paso Crítico:** Implementar MCP AWS Cost (Día 3-4)

**ETA MVP:** ~10 días laborables

**ETA Production:** ~20 días laborables

---

**Este es tu ULTRA-PLAN maestro para OpsFleet.** 🚀

Cada sección es accionable, con tiempos estimados, criterios de éxito claros, y mitigación de riesgos.

**¿Por dónde empezamos?**
