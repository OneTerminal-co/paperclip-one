# OpsFleet — Agentes Deep Dive

## Visión General

OpsFleet es un sistema de 7 agentes de IA que ejecutan automatizadamente las tareas operativas de una empresa cloud 24/7. Corre sobre Paperclip (control plane) + Claude Code (ejecución).

---

## 1. FinOps Agent — Cada 8 horas

**Subtítulo**: El contador que nunca duerme y que ningún dev quiere ser

**Problema**: el 70% de las PYMEs cloud no sabe exactamente en qué se va su dinero. La factura llega a fin de mes y nadie la entiende.

### Qué hace exactamente

- Consulta Cost Explorer org-wide y desglosa por cuenta, servicio, tag y equipo
- Detecta anomalías: gasto que supera el umbral histórico en más del 20%
- Identifica recursos idle: EC2 con CPU menor al 5%, RDS sin conexiones, EBS sin montar
- Calcula rightsizing: compara familia de instancia actual vs recomendación de Compute Optimizer
- Revisa Reserved Instances y Savings Plans: detecta RI sin usar o sin renovar
- En Azure: analiza suscripciones via Cost Management + Advisor recommendations
- Genera reporte ejecutivo semanal: "esta semana gastaste $X, detecte $Y de ahorro posible"

### Escenarios que Resuelve

#### Escenario 1 — Ambiente dev siempre encendido
- **Problema**: 8 instancias EC2 t3.large en la cuenta dev llevan 720h encendidas este mes sin actividad
- **Output**: "Costo innecesario estimado: $340 USD/mes. Recomendación: schedule de apagado automatizado entre 10pm y 6am"

#### Escenario 2 — Anomalia de transferencia de datos
- **Problema**: Gasto en data transfer sube 300% en 48 horas
- **Análisis**: Cruza con CloudTrail y detecta un job de ETL mal configurado replicando datos entre regiones innecesariamente
- **Output**: Alerta inmediata al CEO Agent con causa probable y ticket generado

#### Escenario 3 — RI expirando sin renovar
- **Problema**: 3 Reserved Instances de RDS expiran en 14 dias
- **Risk**: Sin renovación, costo se triplica al volver a on-demand
- **Output**: Reporte al CTO con costo comparativo y recomendación de Savings Plan

### Opciones Adicionales

#### Agente FinOps con modo write (apagado automatizado)
- **Alcance**: Ejecuta acciones: apaga instancias dev fuera de horario, elimina snapshots EBS huérfanos, borra AMIs sin usar
- **Requisito**: Permisos write aprobados por el board
- **Valor**: Alto — ahorro real automatizado, no solo reportes

#### Forecasting mensual con alertas de presupuesto
- **Funcionalidad**: Proyecta el gasto del mes en curso basado en los primeros 7 dias
- **Alerta**: Si proyección supera budget aprobado, alerta antes de que ocurra
- **Valor**: Alto — especialmente en empresas con control estricto de presupuesto

#### Tag enforcement y chargeback interno
- **Funcionalidad**: Detecta recursos sin tags obligatorios (proyecto, equipo, ambiente)
- **Salida**: Reporte de chargeback por equipo
- **Valor**: Medio — requiere cultura de tagging previa

### Métrica de Valor
El benchmark del mercado: **30-35% del gasto cloud es desperdicio** en empresas sin FinOps formal.

En un cliente que paga $10.000 USD/mes en AWS → agente identifica $3.000 USD/mes de ahorro → 6x el costo del plan Professional de OpsFleet

---

## 2. Security Agent — Cada 12 horas

**Subtítulo**: El que encuentra los huecos antes de que los encuentre otro

**Problema**: La mayoría de brechas de seguridad en PYMEs cloud NO son ataques sofisticados—son configuraciones mal hechas que llevan meses sin ser vistas.

### Qué hace exactamente

- Revisa SecurityHub org-wide: agrega findings de todas las cuentas. Prioriza por severidad: CRÍTICO / ALTO / MEDIO
- Audita IAM:
  - Usuarios con MFA desactivado
  - Roles con permisos excesivos (AdministratorAccess en producción)
  - Access keys sin rotar en más de 90 dias
- Revisa Security Groups: reglas 0.0.0.0/0 en puertos críticos (22, 3389, 5432, 3306)
- Detecta buckets S3 públicos o con ACLs permisivas no intencionales
- Revisa GuardDuty: amenazas detectadas, IPs maliciosas, comportamiento anómalo de credenciales
- En Azure: Defender for Cloud score, recomendaciones por suscripción, alertas de Sentinel
- Cruza hallazgos con aws-knowledge-mcp-server para obtener SOPs de remediación actualizados

### Escenarios que Resuelve

#### Escenario 1 — Credencial de ex-empleado activa
- **Detect**: IAM user "jperez" con access key activa, último uso hace 3 dias
- **Red flag**: Usuario fue dado de baja del sistema RRHH hace 6 semanas
- **Output**: Alerta CRÍTICA al CEO Agent. Ticket: "Revocar acceso de jperez inmediatamente"

#### Escenario 2 — Puerto de base de datos expuesto
- **Problema**: Security Group de RDS en producción: puerto 5432 abierto a 0.0.0.0/0
- **Root cause**: Dev lo abrió "temporalmente" para debug hace 4 meses
- **Output**: Finding CRÍTICO con SOPs específicas + numero de CVEs disponibles en ese vector

#### Escenario 3 — GuardDuty: comportamiento anómalo
- **Detect**: Lambda function empieza a hacer llamadas a C&C malware ranges a las 3am
- **Output**: Alerta inmediata con IP, función afectada, patrón de tráfico y SOP de contención

### Opciones Adicionales

#### Rotación automatizada de secrets (crítica en banca/salud)
- **Funcionalidad**: Detecta secrets con más de 90 dias sin rotar
- **Acción**: Dispara proceso de rotación automatizada en Key Vault/Secrets Manager
- **Valor**: CRÍTICO — requisito de cumplimiento, no solo buena práctica

#### Escaneo de imágenes de contenedor (SAST/SCA)
- **Herr**: Trivy o AWS Inspector v2
- **Cobertura**: Escanea imagenes en ECR/ACR por CVEs
- **Output**: Vulnerabilidades críticas por imagen
- **Valor**: Alto — especialmente con pipelines de contenedores en producción

#### Simulación de escalada de privilegios (análisis IAM)
- **Técnica**: Detecta cadenas de permisos que permiten escalada aunque ninguna política sea obvia
- **Valor**: Alto + complejidad alta — diferenciador fuerte para clientes regulados

### Limitación Crítica a Comunicar

⚠️ **Este agente detecta y alerta. NO hace penetration testing activo.** NO explota vulnerabilidades. El agente es postura defensiva continua, no ofensiva.

---

## 3. Infra Ops Agent — Cada 4 horas

[Similar structure to FinOps and Security, with monitoring, alerting, incident response]

---

## 4. Knowledge Agent — On-demand

Responde preguntas técnicas del equipo del cliente usando documentación interna + best practices.

---

## 5. CI/CD Agent — Cada 6 horas

Monitorea pipelines, detecta degradación, optimiza builds.

---

## 6. Compliance Agent — Cada 24 horas

Verifica cumplimiento de políticas (ISO, SOC2, etc).

---

## 7. CEO Agent — Diario (8am)

Lee hallazgos de todos los agentes, sintetiza en reporte ejecutivo, escala decisiones al board.

---

## Métricas de Valor Global

| Métrica | Valor |
|---------|-------|
| Promedio ahorro FinOps/mes | 30-35% del gasto cloud |
| Incidentes detectados antes de críticos | 70%+ |
| Tiempo de RCA | De 4h → 8 min (webhook) / 2-10 min (polling) |
| Costo total SaaS/mes | $349-445 USD |
| Margen para OpsFleet | 60-65% |
