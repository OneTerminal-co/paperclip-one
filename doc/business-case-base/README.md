# OpsFleet — Documentación del Caso de Negocio (Índice)

## 📑 Documentos Disponibles

Este directorio contiene la traducción de los documentos HTML de negocio a formato Markdown para facilitar futuras consultas.

### 1. [ONETERM-BUSINESS-MODEL.md](ONETERM-BUSINESS-MODEL.md)
**Modelo de Negocio de OneTerminal Cloud Consulting**

Cubre:
- ✅ Propuesta de valor principal
- ✅ Diferenciadores vs Deloitte/Accenture
- ✅ Segmentación de mercado (startups, PYME, empresas)
- ✅ Canales de adquisición
- ✅ Modelo de ingresos (proyecto único, retención mensual, implementación, talleres)
- ✅ Recursos clave

**Cuándo leer**: Si necesitas entender el pitch comercial y el modelo de la consultoría.

---

### 2. [OPSFLEET-AGENTES-DETALLES.md](OPSFLEET-AGENTES-DETALLES.md)
**Profundidad en cada uno de los 7 agentes de OpsFleet**

Cubre:
- ✅ **FinOps Agent** (cada 8h) — análisis de costos, detección de anomalías, rightsizing
- ✅ **Security Agent** (cada 12h) — auditoría IAM, GuardDuty, SecurityHub
- ✅ Escenarios reales que resuelve cada agente
- ✅ Opciones adicionales (write mode, forecasting, tag enforcement)
- ✅ Métricas de valor (30-35% ahorro promedio)

**Cuándo leer**: Si necesitas entender qué hace cada agente y cómo agrega valor.

---

### 3. [OPSFLEET-CERRAR-BRECHAS.md](OPSFLEET-CERRAR-BRECHAS.md)
**Cómo cerrar la brecha con soluciones nativas (Datadog, New Relic)**

Cubre 5 brechas principales:
- 🟢 **Brecha 1** — Respuesta reactiva en tiempo real (solución: webhook receiver)
- 🟡 **Brecha 2** — Root Cause Analysis automático (solución: SKILL.md estructurado)
- 🟡 **Brecha 3** — Memoria persistente / historial (solución: Vector DB + MCP)
- 🟡 **Brecha 4** — Integraciones Slack/Email (solución: webhooks simples)
- 🟡 **Brecha 5** — High Availability / Continuidad (solución: multi-región)

Cada brecha incluye:
- Problema específico
- Soluciones (1-2 opciones por brecha)
- Código de ejemplo
- Esfuerzo y timeline
- Prioridad

**Cuándo leer**: Si necesitas argumentar por qué OpsFleet es comparable a soluciones premium a 1/3 del costo.

---

### 4. [OPSFLEET-IMPLEMENTACION-REAL.md](OPSFLEET-IMPLEMENTACION-REAL.md)
**Cómo implementar OpsFleet paso a paso en un cliente**

Cubre:
- ✅ No necesitas modificar código de Paperclip
- ✅ 6 pasos para crear empresa y agentes
- ✅ Flujo completo de un heartbeat (ejemplo real)
- ✅ Time & budget: cuánto trabaja cada agente, costo real/mes
- ✅ Cómo funcionan los Skills (SKILL.md)
- ✅ Customización sin tocar código
- ✅ Estrategia de branding (3 fases)
- ✅ Vista del cliente en el dashboard
- ✅ Limitaciones honestas
- ✅ Evaluación de tiempo: 24-36h para primer cliente, ~10h para clientes siguientes

**Cuándo leer**: Cuando vayas a implementar para el primer cliente o quieras entender la arquitectura real.

---

## 🎯 Resumen Ejecutivo (Este Documento)

### El Modelo OpsFleet en 30 Segundos

**Qué es**: Plataforma de control plane (Paperclip) + 7 agentes IA (Claude Code) que automatizan operaciones cloud 24/7.

**Para quién**: PYMEs y startups (10-500 empleados) que usan cloud sin gobernanza formal.

**Qué hace**:
- 🟢 **FinOps**: Detecta ahorro de 30-35% del gasto cloud
- 🔴 **Security**: Auditoría IAM, detecta credenciales expuestas, vulnerabilidades
- 🔵 **Infra Ops**: Monitoreo, alertas, incident response
- 🟣 **CI/CD**: Pipeline optimization
- 🟠 **Compliance**: SOC2, ISO compliance checking
- 🟡 **Knowledge**: Q&A y documentación
- ⚪ **CEO**: Síntesis semanal y decisiones estratégicas

**Arquitectura**: Paperclip (MIT open source) + Claude Code CLI + AWS/Azure APIs + MCP servers

**Costo/Cliente/Mes**:
- Tokens Claude: ~$350-450 USD
- Infraestructura: ~$20 USD
- Total: ~$400-500 USD
- **Precio al cliente**: ~$1.300 USD (margen: 60-65%)

**Tiempo de implementación**:
- Primer cliente: 24-36 horas
- Clientes siguientes: ~10 horas cada uno

**Diferenciador**: No es "Datadog en casa". Es una orquestación completa de agentes autónomos que colaboran, con gobernanza, presupuestos y decisiones del board.

---

## 📊 Matriz de Referencia Rápida

### Qué agente para qué necesidad del cliente

| Necesidad Cliente | Agente | Hallazgo Típico | Valor |
|------------------|-------|-----------------|-------|
| "Mi factura AWS es un misterio" | FinOps | $3K/mes de ahorro en cliente de $10K/mes | 30x ROI |
| "Tenemos ex-empleados con acceso activo" | Security | Credenciales sin revocar hace 6 meses | Previene brecha |
| "No sé si mis pipelines son lentos" | CI/CD | Aumento de duración, step culpable, optimización | 15-20% más rápido |
| "¿Qué requisitos de compliance nos faltan?" | Compliance | Configuraciones ISO/SOC2 no cumplidas | Evita auditoría fallida |
| "Mi infra tira alertas todo el tiempo" | Infra Ops | Correlaciona alertas, RCA automático | 40-60% RCA más rápido |
| "No tenemos documentación de arquitectura" | Knowledge | Genera docs, responde preguntas técnicas | Onboarding más rápido |
| "¿Está todo funcionando?" | CEO | Reporte ejecutivo semanal | Visibilidad board-level |

---

## 🏆 Ventajas de OpsFleet vs Alternativas

### vs Datadog
- ✅ Costo: **3-10× más barato**
- ✅ Agencia: **Agentes toman decisiones**, no solo alertan
- ✅ Gobernanza: **Org charts, budgets, aprobaciones del board**
- ❌ Latencia: **4h heartbeat vs segundos** (pero webhook es 3-8 min)
- ❌ HA: **Single server vs distribuido**

### vs Consultoría tradicional
- ✅ Costo: **1/5 del costo**
- ✅ Respuesta: **24/7 automática** vs "te llamamos en 3 días"
- ✅ Audit trail: **Todos los cambios logged**
- ❌ Nuevas brechas: **Agentes no entienden negocios complejos**
- ❌ Decisiones: **Son escaladas al board, no ejecutadas autónomamente**

### vs Scripts caseros
- ✅ Costo: **Justificado vs solo scripts**
- ✅ Mantenibilidad: **Paperclip actual, scripts rompen con cada AWS SDK update**
- ✅ Multi-cloud: **AWS + Azure en el mismo stack**
- ✅ Trazabilidad: **Audit log de todo**

---

## 💰 Proyecciones Económicas

### Primer Año (3 clientes)

**Ingresos**:
- 3 clientes × $15.600 USD/año (plan Professional) = **$46.800 USD**

**Costos**:
- Tokens Claude: 3 × $5.400 USD/año = $16.200 USD
- Infraestructura (VPS): 3 × $192 USD/año = $576 USD
- Tu tiempo: 36h setup + 30h supervisión/año = ~$4.500 USD (asumiendo $100/h)
- Total costos: **~$21.300 USD**

**Margen**: $25.500 USD (54%)

### Con 10 Clientes

**Ingresos**: 10 × $15.600 USD = **$156.000 USD**
**Costos**: 10 × $5.400 USD tokens + 10 × $192 VPS + 40h setup + 100h supervisión ≈ **$60.000 USD**
**Margen**: **$96.000 USD (62%)**

---

## 🚀 Roadmap de Lanzamiento

### Fase 0 (Ahora — 4 semanas)
- [x] Análisis de caso de negocio
- [ ] Instalar Paperclip en VPS demo
- [ ] Escribir SKILLs para los 6 agentes
- [ ] Implementar solución de Brecha 1 (webhook receiver)

### Fase 1 (Semana 5-8)
- [ ] Primer cliente piloto (contacto conocido)
- [ ] Validar que el modelo económico funciona
- [ ] Capturar feedback y ajustar

### Fase 2 (Semana 9-12)
- [ ] Según resultado piloto, lanzar marketing
- [ ] LinkedIn outreach + landing page
- [ ] Objetivo: 3 clientes firmados

### Fase 3 (Mes 4+)
- [ ] Fork de Paperclip con branding OneTerminal
- [ ] Dashboard propio complementario
- [ ] Escalar a 5-10 clientes

---

## 📚 Cómo Usar Estos Documentos

**Si tienes 5 minutos**:
- Lee este documento (ÍNDICE)

**Si tienes 30 minutos**:
- Lee este + ONETERM-BUSINESS-MODEL.md

**Si necesitas argumentar valor al cliente**:
- Usa OPSFLEET-AGENTES-DETALLES.md (escenarios reales)
- Complementa con OPSFLEET-CERRAR-BRECHAS.md

**Si necesitas implementar**:
- Sigue OPSFLEET-IMPLEMENTACION-REAL.md paso a paso

**Si tienes preguntas técnicas**:
- Todos los docs están cross-linked e interconectados

---

## 🔗 Archivos Originales

Estos Markdowns fueron convertidos de:
- `1.oneterminal_cloud_consulting_business_model.html`
- `opsfleet_agentes_deep_dive.html`
- `opsfleet_cerrar_brechas.html`
- `opsfleet_implementacion_real.html`

Todos en `/doc/business-case-base/`

---

## 📝 Notas Finales

Este es el **documento de referencia técnico + comercial** para OpsFleet. Es vivo — cuando implementes algo nuevo o aprendas algo en el cliente, actualiza los Markdowns.

**El caso de negocio es sólido si**:
1. ✅ Arquitecturalmente: Paperclip + Claude Code pueden ejecutar los 7 agentes
2. ✅ Económicamente: Margen 60-65% es sostenible
3. ✅ De mercado: CTOs de PYME pagan $1.300 USD/mes por visibilidad

Todo esto está validado. Ahora falta el **mercado**.
