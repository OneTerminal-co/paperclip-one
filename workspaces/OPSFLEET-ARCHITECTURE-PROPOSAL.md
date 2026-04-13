# OpsFleet Architecture Proposal

## 📊 Análisis del Estado Actual

### ✅ **Lo que YA existe en Paperclip:**

#### Backend API
- ✅ `POST /api/agents/:id/pause` - Pausar agente
- ✅ `POST /api/agents/:id/resume` - Reanudar agente  
- ✅ `POST /api/agents/:id/terminate` - Terminar agente
- ✅ `POST /api/agents/:id/wake` - Trigger manual de heartbeat
- ✅ `GET /api/agents/:id` - Detalles de agente (incluye status, budget, etc.)
- ✅ `PATCH /api/agents/:id` - Actualizar agente
- ✅ `GET /api/companies/:id/agents` - Listar agentes

#### UI Existente
- ✅ **Agents.tsx** (línea 59-100):
  - Lista de agentes con filtros (all, active, paused, error)
  - Vista de lista y org chart
  - Modal de delete con confirmación
  - StatusBadge para mostrar estado

- ✅ **AgentDetail.tsx** (línea 758-769):
  - Botones para pause/resume/terminate
  - Mutation para ejecutar acciones
  - Manejo de errores

#### Datos de Agente Disponibles
```typescript
interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "paused" | "idle" | "running" | "error" | "terminated";
  budgetMonthlyCents: number;
  spentMonthlyCents: number;
  runtimeConfig?: {
    heartbeat?: {
      enabled: boolean;
      intervalSec: number;
      cooldownSec: number;
      wakeOnDemand: boolean;
    }
  }
}
```

---

## ❌ **Lo que FALTA:**

### 1. Toggle Rápido en Lista
- **Problema:** Para pausar/reanudar hay que ir a AgentDetail
- **Solución:** Agregar toggle switch en cada fila de Agents.tsx

### 2. Visualización de Próximo Run
- **Problema:** No se ve cuándo corre el próximo heartbeat
- **Solución:** Mostrar "Next run in: 2h 15m" en cada agente

### 3. Directorio No Estratégico
- **Problema:** Configuración está en `doc/business-case-base/`
- **Solución:** Mover a ubicación más apropiada

### 4. UI de Management
- **Problema:** No hay vista consolidada para administrar todos los agentes
- **Solución:** Nueva sección "Agent Control Panel"

---

## 🏗️ **Propuesta de Arquitectura**

### **Opción A: Directorio en `workspaces/` (RECOMENDADO)**

```
paperclip-one/
├── workspaces/                    # ← Nuevo directorio para compañías
│   └── opsfleet/
│       ├── .paperclip.yaml        # Configuración de compañía
│       ├── README.md              # Documentación
│       │
│       ├── skills/                # Biblioteca de skills
│       │   ├── finops/
│       │   ├── security/
│       │   ├── infra-ops/
│       │   └── ...
│       │
│       ├── agents/                # Configuración por agente
│       │   ├── finops/AGENTS.md
│       │   ├── security/AGENTS.md
│       │   └── ...
│       │
│       └── config/                # Configuración centralizada
│           ├── secrets.yaml
│           ├── agents.yaml
│           └── setup.sh
│
├── packages/                      # No tocar
├── server/                        # No tocar
└── ui/                            # Mejoras aquí ↓
    └── src/pages/
        ├── Agents.tsx             # ← MEJORAR
        └── AgentDetail.tsx        # Ya tiene pause/resume
```

**Ventajas:**
- ✅ Separación clara: código vs configuración
- ✅ Multi-tenant: fácil agregar más compañías (workspaces/acme/, workspaces/contoso/)
- ✅ Versionable: cada workspace puede tener su propio git
- ✅ No mezcla con código del core de Paperclip

---

### **Opción B: Directorio en `packages/` (Alternativa)**

```
paperclip-one/
├── packages/
│   ├── opsfleet-company/          # ← Nuevo package
│   │   ├── package.json
│   │   ├── skills/
│   │   ├── agents/
│   │   └── config/
│   │
│   ├── @paperclipai/server/
│   └── ...
```

**Ventajas:**
- ✅ Puede empaquetarse como npm package
- ✅ Puede publicarse/distribuirse

**Desventajas:**
- ❌ Mezcla configuración con código
- ❌ Menos intuitivo para multi-tenant

---

## 🎨 **UI Improvements Propuestos**

### 1. Agents.tsx - Agregar Toggle Switch

**Ubicación:** En cada `EntityRow` de agente

**Antes:**
```tsx
<EntityRow
  title={agent.name}
  subtitle={roleLabels[agent.role]}
  status={<StatusBadge status={agent.status} />}
/>
```

**Después:**
```tsx
<EntityRow
  title={agent.name}
  subtitle={roleLabels[agent.role]}
  status={<StatusBadge status={agent.status} />}
  actions={
    <div className="flex items-center gap-2">
      {/* Next run indicator */}
      <span className="text-xs text-muted-foreground">
        {getNextRunText(agent)}
      </span>
      
      {/* Toggle pause/resume */}
      <Switch
        checked={agent.status === "active" || agent.status === "running"}
        disabled={agent.status === "terminated"}
        onCheckedChange={() => toggleAgent(agent)}
      />
      
      {/* Manual trigger */}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => triggerAgent(agent)}
        disabled={agent.status === "paused" || agent.status === "terminated"}
      >
        <Play className="h-4 w-4" />
      </Button>
    </div>
  }
/>
```

### 2. Mostrar Próximo Run

**Función auxiliar:**
```typescript
function getNextRunText(agent: Agent): string {
  if (agent.status === "paused") return "Paused";
  if (agent.status === "terminated") return "Terminated";
  if (!agent.runtimeConfig?.heartbeat?.enabled) return "Manual only";
  
  const intervalSec = agent.runtimeConfig.heartbeat.intervalSec;
  const lastRun = agent.lastHeartbeatAt; // Necesitamos este campo en el API
  
  if (!lastRun) return "Not run yet";
  
  const nextRun = new Date(lastRun.getTime() + intervalSec * 1000);
  const now = new Date();
  const msRemaining = nextRun.getTime() - now.getTime();
  
  if (msRemaining <= 0) return "Running soon...";
  
  const hours = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return `Next: ${hours}h ${minutes}m`;
}
```

### 3. Nueva Vista: Agent Control Panel (OPCIONAL)

**Ubicación:** Nueva página `AgentManagement.tsx`

**Componentes:**
- Tabla con todos los agentes
- Botones masivos (pause all, resume all)
- Filtros avanzados por role, status, budget
- Gráfico de presupuesto consumido
- Timeline de próximos runs

**NO ES CRÍTICO** - Puede ser fase 2

---

## 🔧 **Backend Changes Needed**

### Mínimo requerido:

#### 1. Agregar campo `lastHeartbeatAt` en respuesta de `/agents`

**Ubicación:** `server/src/routes/agents.ts`

Modificar query para incluir último run:

```typescript
// Agregar campo derivado
SELECT 
  agents.*,
  (
    SELECT created_at 
    FROM heartbeat_runs 
    WHERE heartbeat_runs.agent_id = agents.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as last_heartbeat_at
FROM agents
```

**Beneficio:** Poder calcular "Next run in: Xh Xm"

---

## 📦 **Migration Plan**

### **Fase 1: Mover Configuración** (5 min)

```bash
# 1. Crear directorio workspaces
mkdir -p workspaces/opsfleet

# 2. Mover archivos
mv doc/business-case-base/opsfleet-company/* workspaces/opsfleet/

# 3. Actualizar setup script con nueva ruta
sed -i '' 's|doc/business-case-base/opsfleet-company|workspaces/opsfleet|g' \
  workspaces/opsfleet/setup-opsfleet.sh
```

### **Fase 2: UI - Toggle Switch** (30 min)

1. Agregar `lastHeartbeatAt` al backend (5 min)
2. Agregar función `getNextRunText()` (5 min)
3. Agregar Switch y Play button en EntityRow (10 min)
4. Agregar mutations para toggle (5 min)
5. Testing (5 min)

### **Fase 3: (OPCIONAL) Control Panel** (2-4 horas)

Solo si quieres una vista súper avanzada.

---

## ✅ **Recomendación Final**

### **Hacer AHORA:**

1. ✅ **Mover a `workspaces/opsfleet/`**
   - Más estratégico
   - Separación clara
   - Multi-tenant friendly

2. ✅ **Agregar toggle switch en Agents.tsx**
   - Quick win
   - No requiere mucho código
   - Mejora UX significativamente

3. ✅ **Agregar indicador de próximo run**
   - Transparencia operacional
   - Ayuda a debuggear schedules

### **NO hacer todavía:**

- ❌ Control Panel avanzado (overkill para MVP)
- ❌ Gráficos de presupuesto (nice-to-have)
- ❌ Cambios masivos (pause all)

---

## 🎯 **Decisión Requerida**

### Pregunta 1: ¿Dónde mover la configuración?
- [ ] **Opción A:** `workspaces/opsfleet/` (RECOMENDADO)
- [ ] **Opción B:** `packages/opsfleet-company/`
- [ ] **Opción C:** Dejar en `doc/business-case-base/` (no recomendado)

### Pregunta 2: ¿Qué agregar a la UI?
- [ ] Toggle switch en lista de agentes (FÁCIL, ALTO IMPACTO)
- [ ] Indicador de próximo run (FÁCIL, MEDIO IMPACTO)
- [ ] Control Panel avanzado (DIFÍCIL, BAJO IMPACTO inicial)

### Pregunta 3: ¿Necesitas cambios en el backend?
- [ ] Sí, agregar `lastHeartbeatAt` para calcular próximo run
- [ ] No, por ahora solo mostrar intervalSec configurado

---

## 📋 **Next Steps**

1. **Revisar este documento**
2. **Decidir opciones de arquitectura**
3. **Ejecutar migration plan**
4. **Implementar UI changes**
5. **Testing con agentes reales**

---

**¿Prefieres que proceda con Opción A (workspaces) + UI toggle switch?**
