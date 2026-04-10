# OpsFleet — Cheat Sheet (1 página)

## El Pitch en 3 minutos

```
OneTerminal + Paperclip = OpsFleet

Qué es:
  Control plane (Paperclip/MIT) + 7 agentes IA ejecutando operaciones cloud 24/7

Para quién:
  PYMEs 10-500 empleados que usan cloud sin gobernanza

Qué hace:
  🟢 FinOps:    Detecta 30-35% ahorro en gastos cloud
  🔴 Security:  Auditoría IAM, detecta credenciales expuestas  
  🔵 Infra:     Monitoreo, alertas, incident response
  🟣 CI/CD:     Pipeline optimization
  ⚪ Compliance: Verificación ISO/SOC2
  🟡 Knowledge: Q&A del equipo
  ⚫ CEO:        Síntesis semanal ejecutiva

Costo cliente/mes:
  ~$1.300 USD (plan Professional)

Tu costo real/mes:
  $400-500 USD (tokens + infra)

Tu margen:
  60-65%
```

---

## Arquitectura en 1 Imagen

```
┌─────────────────────────────────────────────────┐
│                PAPERCLIP (MIT)                  │
│         Control Plane + Dashboard UI             │
│  (Node.js + React, corre en EC2 t3.small)       │
└────┬────────────────────────────────┬───────────┘
     │                                 │
     ├─ Issues & Comments (async)      │
     ├─ Org Chart / Budgets            │
     ├─ Heartbeat Scheduler             │
     └─ Audit Log                       │
     │
     │ Dispara heartbeats cada N horas
     │
┌────▼────────────────────────────────▼───────────┐
│         CLAUDE CODE CLI (en el mismo server)    │
│         Adapter: claude_local                   │
└────┬────────────────────────────────┬───────────┘
     │                                 │
┌────▼──────┐  ┌──────────┐  ┌─────────▼──┐
│  FinOps   │  │ Security │  │  Infra Ops │
│  Agent    │  │  Agent   │  │   Agent    │
└────┬──────┘  └──────────┘  └─────────┬──┘
     │                                 │
     │ Usan MCP Servers:               │
     │                                 │
     ├─ awslabs.aws-api-mcp-server    │
     │   (Cost Explorer, IAM, etc)     │
     │                                 │
     ├─ awslabs.aws-knowledge-mcp     │
     │   (Best practices)              │
     │                                 │
     └─ Tu custom SKILL.md            │
        (Lógica específica del cliente)
        
Cada agente:
  • Corre ~10-20 min / heartbeat
  • Consume ~10-20K tokens (Claude Sonnet)
  • Cuesta ~$0.50-1.00 USD / run
  • Crea issues → CEO Agent procesa → Issue resuelto
```

---

## Los 7 Agentes en 30 Segundos

| Agente | Horario | Tarea | Hallazgo típico |
|--------|---------|-------|-----------------|
| **FinOps** | c/8h | Costos AWS/Azure | $3K/mes ahorro (cliente $10K/mes) |
| **Security** | c/12h | IAM, GuardDuty, S3 | Credencial ex-empleado activa |
| **Infra Ops** | c/4h | CPU, memoria, disco | EC2 idle costando $340/mes |
| **CI/CD** | c/6h | Pipeline health | Build 3× más lento, step culpable |
| **Compliance** | c/24h | ISO, SOC2 | 7 hallazgos de configuración |
| **Knowledge** | on-demand | Q&A + docs | Responde preguntas del equipo |
| **CEO** | diario | Síntesis | Reporte ejecutivo semanal |

**Total costo/agente/mes**: $67-108 USD (Claude Sonnet)  
**Total costo/mes cliente**: $349-445 USD  

---

## Diferenciador vs Competencia (Verdad Incómoda)

| Aspecto | OpsFleet | Datadog | Consultoría |
|--------|----------|---------|-------------|
| **Costo** | $1.300/mes | $8.000-15K/mes | $5-20K/proyecto |
| **Agencia** | Agentes TOMAN decisiones | Solo alerta | Humano solo → lento |
| **Gobernanza** | Org chart, budgets, board approvals | ❌ | ✅ pero caro |
| **Audit log** | Completo | Parcial | Ninguno |
| **24/7** | ✅ | ✅ | ❌ |
| **Latencia respuesta** | 3-8 min (webhook) o 2-10 min (polling) | Segundos | Días |

**La verdad**: OpsFleet NO es "Datadog en casa". Es orquestación de agentes con gobernanza + costos. Para PYME es game-changer.

---

## Implementación: Timeline Real

```
┌─────────────────────────────────────────────┐
│ PRIMER CLIENTE: 24-36 HORAS                │
├─────────────────────────────────────────────┤
│ 2-4h   │ Instalar Paperclip en VPS         │
│ 8-12h  │ Escribir 6 SKILL.md (reutilizable)│
│ 3-5h   │ IAM roles por agente (templates)  │
│ 2-3h   │ Setup empresa/agentes en UI       │
│ 3-4h   │ Ajuste SKILL.md contexto cliente  │
│ 4-6h   │ Pruebas y tuning heartbeats       │
│ 2h     │ Entrega y capacitación            │
└─────────────────────────────────────────────┘

CLIENTES 2+: ~10 HORAS CADA UNO

Reutiliza: SKILL.md base del cliente 1
Varía: Solo contexto específico new customer
```

---

## Económico: Break-Even y Scaling

```
AÑO 1 — 3 CLIENTES
├─ Ingresos: 3 × $15.600/año = $46.800
├─ Costos: ~$21.300 (tokens, infra, tiempo)
└─ Margen: $25.500 (54%)

AÑO 1 — 10 CLIENTES
├─ Ingresos: 10 × $15.600 = $156.000
├─ Costos: ~$60.000 (scale sublineales)
└─ Margen: $96.000 (62%)

AÑO 1-2 — 30 CLIENTES
├─ Ingresos: 30 × $15.600 = $468.000
├─ Costos: ~$140.000 (agregar staff)
└─ Margen: $328.000 (70%)

Punto de equilibrio: ~1-2 clientes
```

---

## Limiting Factors (Sé Honesto)

❌ **Paperclip corre agentes en el MISMO VPS** — no es distribuido  
  → Si falla VPS, todos fallan. Solución: HA con 2+ regiones (futuro)

❌ **Comunicación entre agentes es asíncrona** — not real-time  
  → FinOps detecta hallazgo 8am → CEO procesa next morning si es daily heartbeat  
  → Solución: Webhook receiver dispara heartbeats urgentes (Brecha 1)

❌ **Sin notificaciones proactivas** — Slack/email no viene built-in  
  → Solución: 2-3 horas de desarrollo (webhook simple)

❌ **Branding es Paperclip** — UI no es branded OneTerminal  
  → No es bloqueador para PYME. Bloqueador para enterprise.  
  → Solución: Fork (1-2 días)

✅ **LO QUE SÍ funciona**: Org charts, budgets, audit logs, multi-empresa, SKILL.md, heartbeats, issue system — TODO.

---

## Skill.md = Tu Secret Sauce

```markdown
---
name: finops-aws-cliente-x
description: Análisis de costos AWS...
---

# FinOps AWS — Cliente X

## Herramientas
- awslabs.aws-api-mcp-server
- awslabs.aws-knowledge-mcp-server

## Protocolo (en orden cada vez)
1. Cost Explorer org-wide (últimos 7 days vs semana anterior)
2. Detectar servicios con variación > 20%
3. EC2 idle: CPU < 5% por más de 72h
4. RI/Savings Plans: expiración < 30 dias
5. Recursos sin tags

## Formato del reporte
### Resumen ejecutivo (3 lineas max)
### Hallazgos críticos (requieren acción)
### Oportunidades de ahorro ($ estimado)
### Sin novedad
```

**Este SKILL.md es:**
- Reutilizable entre clientes (base)
- Customizable por cliente (umbrales, tags, etc)
- Tu IP — lo que hace OpsFleet diferente a "Paperclip vanilla"

---

## Roadmap Recomendado

```
Fase 0 (NOW)
├─ Validar: Instala Paperclip demo
├─ Escribe: 6 SKILL.md base
├─ Implementa: Webhook receiver (Brecha 1)
└─ Timeline: 4 semanas

Fase 1 (Semana 5-8)
├─ Primer cliente piloto
├─ Valida modelo económico
├─ Captura feedback
└─ Timeline: 1 cliente, 36h

Fase 2 (Semana 9-12)
├─ 2-3 clientes más
├─ Validar PMF
├─ LinkedIn + landing page
└─ Timeline: 3+ clientes

Fase 3 (Mes 4+)
├─ Fork Paperclip + branding OneTerminal
├─ Dashboard propio
├─ Escala a 10+ clientes
└─ Timeline: 2-3 semanas
```

---

## Elevator Pitch (60 segundos)

```
"OpsFleet es una plataforma que automatiza operaciones cloud 24/7
usando 7 agentes IA coordin ados en Paperclip.

Nuestros clientes ven 30-35% de ahorro en costos AWS,
detección automática de vulnerabilidades de seguridad,
y un audit log completo de quién hace qué.

Todo esto por $1.300 USD/mes — 3-10× menos que Datadog + consultor.

Nos enfocamos en PYMEs 10-500 empleados que usan cloud
sin gobernanza formal. Es nuestro ICP.

¿Interesado?"
```

---

## El Cuadro Mágico

Si un CTO te pregunta cualquier cosa, responde:

```
❓ Pregunta                          → 📄 Respuesta Rápida                    → 📖 Lee Documento

"¿Cuánto ahorro?"                   → 30-35% gasto cloud típico             → OPSFLEET-AGENTES
"¿Cuánto cuesta?"                   → $1.300 USD/mes                        → OPSFLEET-IMPLEMENTACION
"¿Es seguro? ¿Acceso a IAM?"       → Read-only por default, audit log     → OPSFLEET-AGENTES (Security)
"¿24/7?"                            → Sí, agentes corren cada N horas       → OPSFLEET-IMPLEMENTACION
"¿Necesito cambiar nada?"           → No, Paperclip es MIT out-of-box      → OPSFLEET-IMPLEMENTACION
"¿Qué pasa si un agente falla?"     → Se reintenta next heartbeat + alerta → README (Limitaciones)
"¿Vs Datadog?"                      → Somos gobierno + agencia, ellos alerta → README (Ventajas)
"¿Implementación?"                  → 36h primer cliente, 10h siguientes    → OPSFLEET-IMPLEMENTACION
```

---

## Links de Referencia

| Necesidad | Archivo |
|-----------|---------|
| Entender valor | OPSFLEET-AGENTES-DETALLES.md |
| Pitch comercial | ONETERM-BUSINESS-MODEL.md |
| Argumentar técnica | OPSFLEET-CERRAR-BRECHAS.md |
| Implementar | OPSFLEET-IMPLEMENTACION-REAL.md |
| Navegar todo | GUIA-LECTURA-RAPIDA.md |
| Esta hoja | CHEAT-SHEET.md (aquí) |

---

**Última actualización**: April 9, 2026  
**Estado**: Arquitectura validada, comercial pendiente, mercado por conquistar.  
**Siguiente paso**: Vender al primer cliente y validar PMF.
