# Paperclip Workspaces

Este directorio contiene configuraciones de compañías/proyectos para Paperclip.

## 📁 Estructura

```
workspaces/
├── opsfleet/              # OpsFleet - 7 agentes especializados
│   ├── README.md          # Documentación de OpsFleet
│   ├── skills/            # Skills modulares
│   ├── agents/            # Configuración por agente
│   └── config/            # Setup scripts y secrets
│
└── [tu-compañia]/         # Tu workspace aquí
    ├── .paperclip.yaml
    ├── skills/
    └── agents/
```

## 🚀 Workspaces Disponibles

### 1. OpsFleet (`opsfleet/`)

Sistema de 7 agentes especializados para operaciones cloud:

- **FinOps Agent** - Optimización de costos (cada 8h)
- **Security Agent** - Auditoría de seguridad (cada 12h)
- **Infra Ops Agent** - Monitoreo de infraestructura (cada 4h)
- **Knowledge Agent** - Respuestas técnicas (on-demand)
- **CI/CD Agent** - Análisis de pipelines (cada 6h)
- **Compliance Agent** - Verificación de cumplimiento (cada 24h)
- **CEO Agent** - Síntesis ejecutiva (diario)

**Ver:** [opsfleet/README.md](./opsfleet/README.md)

---

## 📦 Crear Nuevo Workspace

```bash
# 1. Copiar template de OpsFleet
cp -r workspaces/opsfleet workspaces/mi-compania

# 2. Configurar secrets
cd workspaces/mi-compania
cp company-secrets.yaml company-secrets.local.yaml
# Editar company-secrets.local.yaml con tus credentials

# 3. Configurar agentes
nano agents-config.yaml

# 4. Ejecutar setup
export PAPERCLIP_API_URL="http://localhost:3100"
export PAPERCLIP_API_KEY="pcp_..."
export PAPERCLIP_COMPANY_ID="..."
./setup-*.sh
```

---

## 🔐 Seguridad

⚠️ **IMPORTANTE:** 

- ✅ Commitear: `.yaml` templates, skills, documentación
- ❌ NO commitear: `.env`, `secrets.local.yaml`, API keys

El `.gitignore` en este directorio protege archivos sensibles.

---

## 📚 Recursos

- [Paperclip Docs](../docs/)
- [OpsFleet Architecture](./opsfleet/README.md)
- [Skills Reference](../docs/skills.md)

---

**Workspaces es tu espacio de configuración multi-tenant para Paperclip.** 🚀
