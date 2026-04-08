# UI Internationalization (i18n) — Per-Company Language

Date: 2026-04-08
Branch: `feat/i18n-per-company`
Status: In progress

## Goal

Make the board UI fully translatable so each company can choose its interface language.
The initial target is English (en) and Spanish (es).

## Approach

- Library: `i18next` + `react-i18next`
- Entry point: `ui/src/i18n/index.ts` — initialises i18next with `en` and `es` resource bundles and sets `fallbackLng: "en"`
- Locale files: `ui/src/i18n/locales/en.json` and `es.json` — flat JSON keyed by `section.key`
- Language selection is stored per-company in `CompanySettings` and applied at render time via context
- Pattern per page:
  ```ts
  import { useTranslation } from "react-i18next";
  const { t } = useTranslation();
  // then use t("section.key") in JSX
  ```
- Module-level helper functions that return UI strings receive `t` as an explicit parameter instead of calling `useTranslation()` at module scope (hooks cannot be called outside components)

## Locale Key Sections

| Section | Pages that use it |
|---|---|
| `settings.*` | `CompanySettings.tsx` |
| `onboarding.*` | Onboarding flow |
| `languages.*` | Language selector |
| `nav.*` | Sidebar navigation |
| `dashboard.*` | Dashboard page |
| `issues.*` | Issues list/detail |
| `org.*` | `OrgChart.tsx` |
| `plugins.*` | `PluginManager.tsx` |
| `instance.*` | Instance settings |
| `agent.*` | `AgentDetail.tsx` — tabs, actions, charts, phase labels, log messages, permissions, invocation sources |
| `costs.*` | `Costs.tsx` — metric tiles, tab labels, finance labels, budget display |
| `routines.*` | `RoutineDetail.tsx` — forms, tab labels, all toast messages |
| `skills.*` | `CompanySkills.tsx` — all UI strings, toast messages, help dialog |

## Pages Translated

| Page | Status |
|---|---|
| `CompanySettings.tsx` | Done |
| `OrgChart.tsx` | Done |
| `PluginManager.tsx` | Done |
| `AgentDetail.tsx` | Done |
| `Costs.tsx` | Done |
| `RoutineDetail.tsx` | Done |
| `CompanySkills.tsx` | Done |

## Pages Not Yet Translated

The following pages still contain hardcoded English strings:

- `Issues.tsx`
- `Activity.tsx`
- `ApprovalDetail.tsx`
- `NewAgent.tsx`
- `Companies.tsx`
- `ProjectWorkspaceDetail.tsx`
- `CompanyImport.tsx`
- `CompanyExport.tsx`
- `InstanceExperimentalSettings.tsx`
- `InviteLanding.tsx`
- `BoardClaim.tsx`
- `NotFound.tsx`
- `PluginPage.tsx`

## Adding Keys

When adding new user-visible strings to any translated page:

1. Add the English string under the appropriate section key in `ui/src/i18n/locales/en.json`
2. Add the Spanish translation in `ui/src/i18n/locales/es.json`
3. Use `t("section.key")` in the component

Run `pnpm -r typecheck` to confirm no type errors before committing.

## Notes

- `fallbackLng: "en"` means any missing translation silently falls back to English — no runtime crashes
- `interpolation.escapeValue: false` is safe because React already escapes values in JSX
- Module-level lookup objects (e.g. `sourceLabels`, `phaseLabel` maps) should be kept as English fallback maps; look up the translated string via `t()` in the component and use the map value as a last-resort default
