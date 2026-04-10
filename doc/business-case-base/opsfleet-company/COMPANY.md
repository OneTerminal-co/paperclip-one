---
schema: agentcompanies/v1
name: OpsFleet
description: Sistema de 7 agentes de IA que ejecutan automatizadamente las tareas operativas de una empresa cloud 24/7
brandColor: "#0ea5e9"
issuePrefix: OPS
---

# OpsFleet

OpsFleet es un sistema de agentes de IA especializados que monitorean, optimizan y aseguran infraestructura cloud de forma continua. Corre sobre Paperclip (control plane) + Claude Code (ejecución).

## Propuesta de Valor

- **FinOps**: Detecta 30-35% de desperdicio cloud en empresas sin FinOps formal
- **Security**: Postura defensiva continua, detecta configuraciones mal hechas antes de que sean explotadas
- **Infra Ops**: RCA de 4 horas → 8 minutos con webhooks
- **Compliance**: Verificación continua de ISO, SOC2, políticas internas

## Workflow

OpsFleet opera con un modelo **hub-and-spoke**:

1. Cada agente especialista corre en su frecuencia definida (4h a 24h)
2. Reporta hallazgos y acciones al CEO Agent
3. CEO Agent sintetiza diariamente a las 8am para el board humano
4. Board humano escala decisiones críticas (ej: permisos write para FinOps)

## Métricas de Valor

| Métrica | Valor |
|---------|-------|
| Promedio ahorro FinOps/mes | 30-35% del gasto cloud |
| Incidentes detectados antes de críticos | 70%+ |
| Tiempo de RCA | De 4h → 8 min (webhook) / 2-10 min (polling) |

---

*Powered by [Paperclip](https://github.com/paperclipai/paperclip) — Control plane for AI agent companies*
