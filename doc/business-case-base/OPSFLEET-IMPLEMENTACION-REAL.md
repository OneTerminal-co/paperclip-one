# OpsFleet — Cómo Funciona: Implementación Real

## Respuesta Directa

✅ **No necesitas modificar el código de Paperclip**

Todo lo que necesitas — adapters, skills, heartbeats, budgets, org chart — está disponible en la API y UI de Paperclip out-of-the-box.

Tu trabajo es **configurar, no programar el framework**.

---

## Paso a Paso: Cómo Implementar Cada Agente

### Paso 1: Crear la empresa en Paperclip

**Via UI o CLI**:
- Nombre: `"OpsFleet - Cliente X"`
- Goal: `"Mantener la infraestructura cloud de ClienteX operando con seguridad y costo óptimo"`
- Este es el contexto que todos los agentes ven

### Paso 2: Crear cada agente con adapter `claude_local`

**En la UI de Paperclip: "Add Agent"**
- Tipo: `claude_local`
- Working directory: `/home/opsfleet/agents/finops`
- Budget mensual: `$30 USD`
- El adapter corre Claude Code CLI localmente cuando Paperclip dispara el heartbeat

### Paso 3: Configurar el promptTemplate del agente

Este es el "sistema prompt". Ejemplo para FinOps Agent:

```
Eres el FinOps Agent de OpsFleet para {{company.name}}.
Tu objetivo: analizar costos AWS y Azure, detectar anomalías y
generar reportes accionables.

Herramientas disponibles (MCP servers activos):
- awslabs.aws-api-mcp-server: consulta Cost Explorer, Compute
  Optimizer, Budgets API
- awslabs.aws-knowledge-mcp-server: best practices FinOps

Credenciales: usa AWS_PROFILE=finops-readonly (least privilege)

Al terminar cada análisis: crea un issue con tus hallazgos y
asignalo al CEO Agent para revisión ejecutiva.
```

### Paso 4: Configurar variables de entorno del agente

En el campo `env` del adapter config:
```
AWS_PROFILE=finops-agent
AWS_REGION=us-east-1
FASTMCP_LOG_LEVEL=ERROR
```

Paperclip guarda estos valores encriptados. Cada agente tiene sus propias credenciales IAM.

### Paso 5: Configurar el heartbeat schedule

En la UI: horarios tipo cron

| Agente | Schedule | Significado |
|--------|----------|-------------|
| FinOps | `0 */8 * * *` | Cada 8 horas |
| Security | `0 */12 * * *` | Cada 12 horas |
| Infra | `0 */4 * * *` | Cada 4 horas |
| CEO | `0 8 * * *` | Diario a las 8am |

Paperclip despierta al agente, el agente corre, termina, duerme.

### Paso 6: Comunicación entre agentes

**No hay comunicación directa** — todo pasa por el sistema de issues y comments de Paperclip.

Ejemplo:
1. FinOps Agent (8am) crea issue: `"Anomalía de costo detectada: EC2 t3.large x8 idle en dev"`
2. Lo asigna al CEO Agent
3. CEO Agent (next heartbeat) lo lee y crea resumen ejecutivo

---

## Flujo Completo de un Heartbeat (Ejemplo FinOps)

```
08:00 — Paperclip dispara heartbeat
  Claude Code CLI arranca en /home/opsfleet/agents/finops
  Lee promptTemplate + SKILL.md de finops
  
  GET /api/agents/me  → obtiene identidad, budget, cadena
  GET /api/issues?assignee=finops-agent  → revisa inbox
  
  uvx awslabs.aws-api-mcp-server@latest
  → ce:GetCostAndUsage (org-wide, últimos 7 dias)
  → ce:GetAnomalyDetectors
  → compute-optimizer:GetEC2InstanceRecommendations
  
  Detecta: 3 anomalías, 8 instancias idle, 2 RI por expirar
  
  POST /api/issues  → crea issue "Reporte FinOps semana 14"
  POST /api/issues/{id}/comments  → agrega hallazgos detallados
  PATCH /api/issues/{id}/assignee → asigna a CEO Agent
  
  Claude Code CLI termina
08:12 — Heartbeat completado (12 minutos, ~$0.80 USD de tokens)
```

---

## Tiempo y Budget Real

### Cuánto tiempo trabaja cada agente / semana

| Agente | Frecuencia | Duración/run | Runs/semana | Horas activas/semana |
|--------|-----------|-------------|-----------|---------------------|
| FinOps | Cada 8h | 10-15 min | 21 runs | ~3.5h activo |
| Security | Cada 12h | 12-20 min | 14 runs | ~3h activo |
| Infra Ops | Cada 4h | 8-12 min | 42 runs | ~7h activo |
| CEO Agent | Diario | 15-25 min | 7 runs | ~2h activo |
| Knowledge | On-demand | 5-15 min | 5-20 | ~1-3h activo |
| CI/CD | Cada 6h | 8-15 min | 28 runs | ~4h activo |

**Nota**: El resto del tiempo los agentes están **DORMIDOS**. No consumen tokens, no consumen CPU significativa.

### Budget Mensual por Agente (Claude Sonnet)

| Agente | Tokens/run | Costo/run | Runs/mes | Costo total/mes | Budget recomendado |
|--------|-----------|-----------|----------|---------------|-------------------|
| FinOps | ~15K | ~$0.75 | 90 | ~$67 | $80 USD |
| Security | ~18K | ~$0.90 | 60 | ~$54 | $70 USD |
| Infra Ops | ~12K | ~$0.60 | 180 | ~$108 | $130 USD |
| CEO Agent | ~20K | ~$1.00 | 30 | ~$30 | $50 USD |
| Knowledge | ~10K | ~$0.50 | ~60 | ~$30 | $40 USD |
| CI/CD | ~10K | ~$0.50 | 120 | ~$60 | $75 USD |
| **TOTAL** | — | — | — | **~$349 USD/mes** | **~$445 USD** |

*Con claude-haiku-4-5 el costo baja ~80% pero la calidad de análisis es menor.*
*El budget recomendado tiene 25% de margen de seguridad antes del hard stop.*

### Costo de Infraestructura Adicional

| Item | Costo |
|------|-------|
| VPS para Paperclip (t3.small o equiv Azure) | ~$16 USD/mes |
| Paperclip (open source MIT) | $0 licencia |
| awslabs MCP servers (open source) | $0 licencia |
| AWS APIs consumidas | Cliente paga (su cuenta) |
| Almacenamiento de logs Paperclip | Incluido en VPS |

### Resumen Económico para OpsFleet

| Concepto | Valor |
|----------|-------|
| Tokens Claude | ~$350-450 USD/mes por cliente |
| Infraestructura | ~$16-25 USD/mes por cliente |
| Tu tiempo de supervisión | ~4h/mes por cliente |
| Total costo real | ~$400-500 USD/mes por cliente |
| Precio al cliente (plan Professional) | ~$1.300 USD (~5.5M COP) |
| Margen bruto | 60-65% |

---

## Skills en Paperclip

### Qué es un Skill

Un Skill es un archivo `SKILL.md` con frontmatter YAML. El agente:
1. Lee nombre y descripción primero
2. Si lo considera relevante para su tarea, carga el contenido completo
3. Esto mantiene el prompt base pequeño

**Estructura**:
```
skills/
└── finops-aws/
    ├── SKILL.md          ← instrucciones del agente
    └── references/
        ├── cost-thresholds.md    ← umbrales por servicio
        ├── anomaly-rules.md      ← reglas de detección
        └── report-template.md   ← formato del reporte
```

### Ejemplo Real de SKILL.md (FinOps Agent)

```markdown
---
name: finops-aws-oneterminal
description: >
  Análisis de costos AWS multi-cuenta para clientes OpsFleet.
  Usa cuando el agente tenga que revisar costos, detectar anomalías,
  evaluar rightsizing o generar reportes FinOps.
  No usar para incidentes de seguridad ni salud de infra.
---

# FinOps AWS — OpsFleet Skill

## Herramientas disponibles
- awslabs.aws-api-mcp-server: Cost Explorer, Budgets,
  Compute Optimizer
- awslabs.aws-knowledge-mcp-server: best practices FinOps

## Protocolo de análisis (en orden)
1. Cost Explorer org-wide: últimos 7 dias vs semana anterior
2. Detectar servicios con variación > 20%
3. EC2 idle: CPU < 5% por más de 72h
4. RI/Savings Plans: expiración en < 30 dias
5. Recursos sin tags obligatorios (proyecto, ambiente)

## Formato del reporte en el issue
### Resumen ejecutivo (máximo 3 líneas para el CTO)
### Hallazgos críticos (requieren acción esta semana)
### Oportunidades de ahorro (con $ estimado)
### Sin novedad (lista breve)

## Umbrales de alerta
Ver references/cost-thresholds.md para valores por cliente
```

### El SKILL.md es tu IP como OneTerminal

- **Framework** (Paperclip + awslabs/mcp): open source
- **SKILL.md**: Tu conocimiento acumulado como consultor
- **Diferenciador**: OpsFleet es mejor que un cliente instalando Paperclip por su cuenta

---

## Customización sin Tocar Código

### Lo que puedes customizar via config

✅ Logo y nombre de empresa en la UI  
✅ Colores del dashboard (variables CSS)  
✅ promptTemplate completo de cada agente  
✅ SKILL.md de cada agente — 100% tuyo  
✅ Frecuencia de heartbeats  
✅ Budgets y alertas  
✅ Org chart completo  
✅ Variables de entorno por agente (credenciales IAM)  

### Lo que requiere fork del código

⚠️ Reemplazar logo de Paperclip por OneTerminal en header  
⚠️ Dominio propio (opsfleet.oneterminal.co)  
⚠️ Dashboard adicional con métricas OpsFleet propias  
⚠️ Email de reportes automatizados con branding OneTerminal  
⚠️ Integración con Slack/Teams para notificaciones  
⚠️ Adapter custom si necesitas runtime diferente  

*Paperclip es MIT — puedes forkearlo. Es Next.js + Node.js. Un día de trabajo para rebranding básico.*

### Estrategia de Branding Recomendada

#### Fase 1 (primeros 3 clientes): Paperclip sin modificar
- El cliente ve Paperclip con tu nombre de empresa configurado
- No ideal para branding pero suficiente para validar producto
- Ahorras tiempo de desarrollo de fork

#### Fase 2 (5+ clientes): Fork ligero con branding OneTerminal
- Reemplaza logo, colores verde/negro OneTerminal
- Dominio propio
- **Esfuerzo**: 1-2 días
- Cliente ve: "OpsFleet by OneTerminal", no "Paperclip"

#### Fase 3 (10+ clientes): Dashboard propio complementario
- Portal OpsFleet simplificado (React + tu API)
- Consume API de Paperclip
- Cliente ve solo lo que necesita — no configuración interna

---

## Vista del Cliente en el Dashboard

```
╔═══════════════════════════════════════════════════════════════╗
║ OT | OpsFleet — Banco Ejemplo S.A.                           ║
║    | Dashboard · Semana del 31 mar 2026                       ║
╚═══════════════════════════════════════════════════════════════╝

Agentes activos: 6/6    Tareas: 47    Gasto: $312    Budget: $133    Ahorro: $4.2K

Estado de agentes:
[●] CEO Agent               — Último run: hace 2h, Reporte semanal generado        $28/mes
[●] FinOps Agent            — Último run: hace 6h, 3 anomalías detectadas          $71/mes
[◐] Security Agent          — En progreso, Analizando IAM policies...              $52/mes
[●] Infra Ops Agent         — Último run: hace 3h, Todo OK                         $98/mes
[○] Knowledge Agent         — Idle, Esperando tickets                              $18/mes
[●] CI/CD Agent             — Último run: hace 5h, 2 pipelines con degradación    $45/mes

Hallazgos pendientes:
🔴 CRÍTICO — Security Agent
   IAM user "deploy-legacy" con AdministratorAccess activo. Sin uso 47 dias.
   
🟡 IMPORTANTE — FinOps Agent
   3 Reserved Instances RDS expiran en 18 dias. Ahorro proyectado: $890 USD/mes
   
🔵 INFORMATIVO — CI/CD Agent
   Pipeline "api-payments" aumentó duración de 8min a 23min.
```

### Qué el cliente puede hacer

- Ver estado de cada agente en tiempo real
- Leer hallazgos y comentarios de cada agente
- Aprobar o rechazar acciones escaladas al board
- Pausar un agente si hace algo incorrecto
- Ver historial completo (audit log)
- Ver gasto de tokens vs budget
- Crear tickets manuales para consultas

---

## Limitaciones Reales a Conocer

### Limitación 1: Paperclip NO corre agentes en la nube

❌ El adapter `claude_local` corre en el **MISMO servidor** donde está Paperclip  
❌ No es sistema distribuido — todos los agentes corren en un VPS  
❌ Si el servidor cae, todos los agentes se detienen  

✅ **Solución**: VPS con uptime garantizado o servicio gestionado

### Limitación 2: Comunicación entre agentes es asíncrona

❌ Los agentes NO se hablan en tiempo real  
❌ Comunicación via issues y comments en Paperclip  
❌ Si FinOps detecta hallazgo a las 8am, CEO Agent lo procesa en su próximo heartbeat  

✅ **Solución**: Configurar heartbeats más frecuentes o disparos manuales para casos urgentes

### Limitación 3: Adapter HTTP requiere endpoint

❌ Para notificaciones a Slack/email necesitas webhook receiver o adapter HTTP hacia servicio externo  
❌ No viene integrado out-of-the-box  

✅ **Solución**: ~2-3 horas de desarrollo

### Limitación 4: Branding es Paperclip por defecto

❌ Cliente ve UI de Paperclip, no colores OneTerminal  
❌ Para venta enterprise es bloqueador  

✅ **Solución**: Fork (1-2 días de trabajo)

### Lo que SÍ funciona out-of-the-box

✅ Crear empresa, agentes, org chart  
✅ Skills, heartbeats, budgets  
✅ Audit log, aprobaciones del board  
✅ Sistema de issues y comments entre agentes  
✅ Tracking de costo por agente  
✅ Pause/Resume de agentes  
✅ Multi-empresa en un Paperclip  

**Todo vía UI o API sin escribir código del framework.**

---

## Evaluación Honesta: Tiempo de Implementación

| Actividad | Tiempo | Tipo |
|-----------|--------|------|
| Instalar Paperclip en VPS | 2-4h | Una vez/VPS |
| Escribir SKILL.md para 6 agentes | 8-12h | Una vez (reutilizable) |
| Configurar IAM roles por agente | 3-5h | Plantilla reutilizable |
| Crear empresa y agentes en UI | 2-3h | 2-3h / cliente nuevo |
| Ajustar SKILL.md con contexto cliente | 3-4h | 3-4h / cliente nuevo |
| Prueba y ajuste de heartbeats | 4-6h | 2h / cliente nuevo |
| Entrega y capacitación al CTO | 2h | 2h / cliente nuevo |
| **TOTAL primer cliente** | **24-36h** | ~10h / clientes siguientes |

**TL;DR**: Primer cliente toma ~1 semana de trabajo full-time. Siguientes clientes: ~1.5 días cada uno.
