# OpsFleet — Cerrar Brechas vs Soluciones Nativas

## Visión General

Paperclip + Claude Code es más lenta que plataformas nativas (Datadog, New Relic, AWS native tools). Pero con las soluciones correctas, cerramos el 90% de la brecha con arquitectura abierta y configurable.

---

## BRECHA 1: Respuesta Reactiva en Tiempo Real

**Problema**: OpsFleet actúa en el próximo heartbeat (hasta 4h). Los nativos actúan en segundos.

### Solución 1: Webhook Receiver (RECOMENDADA)

**Impacto**: Cambio más impactante con menos código

**Arquitectura**:
```
CloudWatch Alarm → SNS Topic → HTTP POST
    ↓
OpsFleet Alert Router (microservicio Python/Node)
    ↓
Paperclip API POST /api/agents/{id}/heartbeat
    ↓
Agente despierta (Claude Code corre inmediatamente)
```

**Código** (~80 líneas):
```python
# alert_router.py
from fastapi import FastAPI
import httpx, os

app = FastAPI()
PAPERCLIP_URL = os.getenv("PAPERCLIP_URL")
PAPERCLIP_TOKEN = os.getenv("PAPERCLIP_TOKEN")

ALERT_ROUTING = {
    "CPUUtilization":    "infra-ops-agent-id",
    "CostAnomaly":       "finops-agent-id",
    "SecurityFinding":   "security-agent-id",
    "PipelineFailed":    "cicd-agent-id",
}

@app.post("/webhook/cloudwatch")
async def cloudwatch_alert(payload: dict):
    alarm_name = payload.get("AlarmName", "")
    agent_id = route_alert(alarm_name)
    
    # Crear issue urgente en Paperclip
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{PAPERCLIP_URL}/api/companies/{COMPANY_ID}/issues",
            json={
                "title": f"ALERTA: {alarm_name}",
                "priority": "urgent",
                "assigneeAgentId": agent_id,
                "description": str(payload)
            },
            headers={"Authorization": f"Bearer {PAPERCLIP_TOKEN}"}
        )
    return {"status": "dispatched"}
```

**Resultado**: 
- Tiempo de respuesta: **4 horas → 3-8 minutos** (tiempo que tarda Claude Code en iniciar)
- No es "segundos" como nativos, pero razonable para 90% de incidentes en PYMEs
- **Esfuerzo**: ~2 dias de desarrollo
- **Requisitos**: Python FastAPI + ~80 líneas código

### Solución 2: Process Adapter con Polling (SIN CÓDIGO EXTRA)

**Funcionalidad**: Usa el adapter `process` de Paperclip para ejecutar un script que hace polling de CloudWatch cada 2 minutos

**Ventajas**:
- Cero infraestructura adicional
- Menos elegante pero funcional
- No requiere desarrollo web

**Script**:
```bash
#!/bin/bash
# cloudwatch_poller.sh — script que corre via Process adapter cada 2 min

ALARMS=$(aws cloudwatch describe-alarms \
  --state-value ALARM \
  --query 'MetricAlarms[].AlarmName' \
  --output json)

if [ "$ALARMS" != "[]" ]; then
  # Llamar API de Paperclip para crear issue urgente
  curl -X POST "$PAPERCLIP_URL/api/companies/$COMPANY_ID/issues" \
    -H "Authorization: Bearer $PAPERCLIP_TOKEN" \
    -d "{\"title\": \"ALARMA ACTIVA: $ALARMS\", \"priority\": \"urgent\"}"
fi
```

**Resultado**:
- Tiempo de respuesta: **2-10 minutos**
- **Esfuerzo**: Mínimo — script bash + 1 agente Paperclip

---

## BRECHA 2: Root Cause Analysis Automático

**Problema**: Los nativos correlacionan automáticamente deploys, logs, métricas e historial.
OpsFleet solo analiza lo que el agente consulta explícitamente.

### Solución: SKILL.md de RCA Estructurado (SIN CÓDIGO)

**Principio**: La brecha no es solo tecnológica — es de protocolo.

Un buen SKILL.md que le diga al agente **QUÉ consultar, EN QUÉ ORDEN, CÓMO CORRELACIONARLO** cierra el 70% de la brecha con los nativos.

**Ejemplo SKILL.md**:

```markdown
# Protocolo de RCA para OpsFleet

## Cuando se activa una alerta, seguir SIEMPRE este orden:

### 1. Contexto temporal (últimos 30 min)
- CloudWatch: métricas del servicio afectado
- CloudTrail: cambios de infraestructura en las últimas 2h
- GitHub/ADO: deploys en las últimas 4h

### 2. Correlación de eventos
- Cruzar: timestamp del primer error vs timestamp del último deploy
- Cruzar: aumento de latencia vs cambios de configuración
- Buscar: pattern de error en logs similar al historial

### 3. Hipótesis en orden de probabilidad
1. Deploy reciente cambió algo ← Verificar primero
2. Recurso saturado (CPU/memoria/disco/conexiones)
3. Dependencia externa falló (API, BD, CDN)
4. Problema de red/DNS/certificado

### 4. Evidencia requerida antes de concluir
- Screenshot de métrica antes/durante/después
- Commit o PR relacionado si aplica
- Confirmación de que el patrón de error es nuevo
```

**Resultado**:
- Claude Code es capaz del razonamiento; le falta la guía
- **Esfuerzo**: 8-12 horas escribir SKILLs para los 6 agentes (uno solo)
- **Impacto**: RCA estructurado comparable a Datadog Professional

---

## BRECHA 3: Memoria Persistente / Historial Agregado

**Problema**: OpsFleet no recuerda patrones históricos entre heartbeats.

### Solución: Knowledge Base + Vector DB (MCP Server)

Crear un MCP server que:
1. Almacena todos los hallazgos previos en un vector DB (Pinecone o local pgvector)
2. En cada heartbeat, el agente hace búsqueda: "¿He visto este patrón antes?"
3. Devuelve contexto histórico (soluciones previas, tiempo de resolución)

**Implementación**:
- PostgreSQL + pgvector extension (vector similarity search)
- MCP server Python que expone operaciones: embed_finding, search_similar, store_resolution
- Costo: ~$10-30 USD/mes en infraestructura

**Resultado**:
- Los agentes aprenden del historial
- Tiempo de RCA se reduce 40-60%

---

## BRECHA 4: Integraciones a Slack/Email/Teams

**Problema**: OpsFleet crea issues pero no notifica proactivamente.

### Solución: Webhooks Simple hacia Slack/Teams

```python
# Dentro del SKILL.md del agente o en post-heartbeat hook
# Crear una notificación en Slack

import aiohttp

SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK_URL")

async def notify_slack(title, severity, details):
    color = {"critical": "#E24B4A", "warning": "#EF9F27"}[severity]
    await aiohttp.post(SLACK_WEBHOOK, json={
        "attachments": [{
            "color": color,
            "title": title,
            "text": details,
            "ts": int(time.time())
        }]
    })
```

**Resultado**:
- Notificaciones en tiempo real para el equipo
- **Esfuerzo**: 2-3 horas

---

## BRECHA 5: Continuidad / High Availability

**Problema**: Si el servidor Paperclip cae, todos los agentes se detienen.

### Soluciones

#### Opción A: Multi-región con Failover
- Despliega Paperclip en 2+ VPS en diferentes regiones
- PostgreSQL replicado
- Paperclip descubre cuál es el "leader" en startup
- **Costo**: +$20-40 USD/mes por replica
- **Complejidad**: Media

#### Opción B: Kubernetes / Managed Container Service
- Despliega Paperclip en AKS (Azure) o EKS (AWS)
- Auto-scaling, health checks automáticos
- **Costo**: +$50-100 USD/mes mínimo
- **Complejidad**: Alta

#### Opción C: "Bueno es mejor que perfecto"
- Single VPS con backups diarios
- Si falla, RTO = 15-30 min (tiempo de restauración)
- **Costo**: Mínimo
- **Risk**: Aceptable para PYME

**Recomendación V1**: Opción C. Escala a Opción A cuando tengas 5+ clientes.

---

## Roadmap de Cierre de Brechas

| Brecha | Solución | Timeline | Costo | Prioridad |
|--------|----------|----------|-------|-----------|
| Tiempo real | Webhook receiver | 2 semanas | ~1.5 dias dev |  🔴 ALTA |
| RCA | SKILL.md | 4 semanas | ~1-2 dias dev | 🟢 ALTA |
| Memoria | Vector DB + MCP | 6 semanas | $15/mes + 3 dias dev | 🟡 MEDIA |
| Integraciones | Slack webhooks | 1 semana | 2 horas dev | 🟡 MEDIA |
| HA | KubernETES | 8 semanas | $60+/mes + 5 dias dev | 🟡 MEDIA (después v2) |

**Recomendación para Launch**: Implementar Brecha 1 + Brecha 2 antes de vender al primer cliente ("OpsFleet v0.9"). Brechas 3-5 son v1.1+.
