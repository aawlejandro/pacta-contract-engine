# CLAUDE.md — AI Assistant Guide for pacta-contract-engine

## Project Overview

`@pacta/contract-engine` is a zero-dependency TypeScript rules engine that evaluates Spanish residential tenancy law (LAU — Ley de Arrendamientos Urbanos) and Ley 12/2023. It is designed for dual auditability: lawyers review YAML rule files, developers review TypeScript implementation.

**Current status**: v0.1.0 WIP — 2 of 6 planned rules implemented.

---

## Repository Structure

```
pacta-contract-engine/
├── evaluator.ts              # Main engine — evaluarContrato() public API
├── types.ts                  # All TypeScript types and interfaces
├── actualizacion-renta.yml   # Rule definition: LAU Art. 18 (rent updates)
├── actualizacion-renta.test  # Tests for rent update rule
├── plazos-preaviso.yml       # Rule definition: LAU Arts. 9, 11 (notice periods)
├── package.json
├── tsconfig.json
├── README.md                 # Bilingual (ES/EN) project documentation
└── CONTRIBUTING.md           # Bilingual contributor guidelines
```

**Note**: The project is intentionally flat. The tsconfig `include` paths reference `engine/**/*` and `tests/**/*` for future organization, but current source files are at root.

---

## Essential Commands

```bash
npm install              # Install dev dependencies
npm run build            # Compile TypeScript → dist/
npm test                 # Run tests once (Vitest)
npm run test:watch       # Watch mode during development
npm run test:coverage    # Generate coverage report
npm run lint             # ESLint on all .ts files
npm run typecheck        # Type check without emitting
```

---

## Architecture

### Core Pattern: Rules as Data

Rules are separated into two layers:

| Layer | Files | Audience |
|-------|-------|----------|
| Rule definitions | `*.yml` | Lawyers (no code required) |
| Rule engine | `*.ts` | Developers |

### Public API

```typescript
import { evaluarContrato } from './evaluator'

const resultado: EvaluacionCompleta = evaluarContrato({
  contrato: Contrato,          // Contract state
  fecha_actual: string,        // ISO 8601 — inject for testing
  indices?: IndicesEconomicos  // Optional economic indices
})
```

**Input**: `ContextoEvaluacion` — contract state + evaluation date + optional indices
**Output**: `EvaluacionCompleta` — rule results, pending notifications, upcoming key dates

### Contract State Machine

`ContratoEstado` values:
- `INICIALIZACION` → `VIGENTE` → `PRORROGA_OBLIGATORIA` → `PRORROGA_TACITA`
- `PRORROGA_EXTRAORDINARIA`
- `FINALIZADO` (terminal — most rules do not apply)

### Notification Severity Levels

```
"info"             → Informational only
"aviso"            → Warning
"accion_requerida" → Action needed (not urgent)
"bloqueante"       → Urgent — deadline imminent
```

---

## Code Conventions

### Language

- **All identifiers, variable names, and function names are in Spanish** — this is intentional
  - Functions: `evaluarContrato`, `evaluarActualizacionRenta`, `calcularFechasClave`
  - Variables: `contrato`, `fecha_inicio`, `renta_actual`, `zona_tensionada`
  - Enum-like string values: SCREAMING_SNAKE_CASE in Spanish — `PRORROGA_OBLIGATORIA`, `ACCION_REQUERIDA`
- File names: lowercase with hyphens (`actualizacion-renta.yml`)
- Comments may be bilingual (Spanish for logic, both for legal references)

### TypeScript Strictness

The tsconfig enables maximum type safety:
- `"strict": true` — all strict checks
- `"noUncheckedIndexedAccess": true` — array access returns `T | undefined`
- `"exactOptionalPropertyTypes": true` — no implicit `undefined` for optional props
- `"noImplicitReturns": true`
- `"noFallthroughCasesInSwitch": true`

Do not disable or work around these settings.

### Data Conventions

- **Dates**: ISO 8601 strings (`"2024-03-15"`) — never `Date` objects in the API boundary
- **Currency**: Euros, 2 decimal places, rounded via `Math.round(value * 100) / 100`
- **Percentages**: Stored as decimals — `0.03` means 3%, not `3`
- **Day counting**: `Math.floor((date.getTime() - hoy.getTime()) / 86_400_000)`

### Rule Result Pattern

Every rule evaluation must return:
```typescript
{
  aplicable: boolean,               // Whether this rule applies
  motivo_no_aplicable?: string,     // Explanation if not applicable
  notificaciones: Notificacion[],   // Empty array if none (never omit)
  // ...rule-specific fields
}
```

### Zero Dependencies

There are **no runtime dependencies** — keep it that way. All computation is pure TypeScript with no external libraries.

---

## Implemented Rules

### 1. Actualización de Renta (LAU Art. 18)
**File**: `evaluarActualizacionRenta()` in `evaluator.ts`

- Uses **IRAV** index for contracts signed after 2024 (post Ley 12/2023)
- Uses **IPC** index for pre-2024 contracts
- Caps rent increase at **3%** in rent-controlled zones (`zona_tensionada: true`)
- Only applies on the contract **anniversary date**
- Generates a `"bloqueante"` notification 30 days in advance

### 2. Plazos de Preaviso (LAU Arts. 9, 11)
**File**: `evaluarPlazoPreaviso()` in `evaluator.ts`

- Minimum contract period: **5 years** (individual landlord) / **7 years** (corporate landlord)
- Non-renewal notice: **120 days** landlord → tenant, **60 days** tenant → landlord
- Desistment eligibility: after 6 months from contract start
- Returns consequences of inaction (e.g., automatic `PRORROGA_TACITA`)

---

## Testing

**Framework**: Vitest 1.x

Tests use injectable `fecha_actual` to test time-dependent logic without mocking the clock:
```typescript
evaluarContrato({
  contrato: myContract,
  fecha_actual: "2025-06-15"  // Fixed date for deterministic tests
})
```

Test cases correspond to `casos_test` in the YAML rule files — keep them in sync when adding rules.

---

## Adding a New Rule

1. Create `<rule-name>.yml` with `rule_id`, `version`, `normativa`, `condiciones`, and `casos_test` sections
2. Add corresponding types to `types.ts` (`Resultado<RuleName>` interface)
3. Implement `evaluar<RuleName>(contrato, fechaActual, indices?)` function in `evaluator.ts`
4. Add result to `EvaluacionCompleta` via `evaluarContrato()`
5. Create `<rule-name>.test` with test cases matching `casos_test` in the YAML
6. Update the feature table in `README.md`

---

## YAML Rule File Structure

```yaml
rule_id: "unique-rule-id"
version: "1.0.0"
normativa:
  - articulo: "Art. 18"
    ley: "LAU"
    descripcion: "..."
condiciones:
  - id: "condition-id"
    descripcion: "..."
    logica: "pseudocode or expression"
casos_test:
  - id: "test-case-id"
    descripcion: "..."
    entrada: { ... }
    resultado_esperado: { ... }
```

---

## Important Constraints

- **Do not add runtime dependencies** — the zero-dependency constraint is a feature
- **All identifiers must be in Spanish** — follow the established naming convention
- **Maintain strict TypeScript** — do not use `any`, `as unknown`, or type assertions without strong justification
- **Legal accuracy matters** — all rule changes must include law article references in `normativa_referencia`
- **Bilingual documentation** — public-facing docs (README, CONTRIBUTING) are maintained in both Spanish and English; code comments can be Spanish-only
- **YAML rule files are the source of truth** for legal logic — TypeScript implements what YAML defines

---

## Project Context

This engine is intended for production use in Spain's rental housing sector, potentially affecting ~3.6 million rental properties. Rule accuracy has legal consequences. When in doubt about legal interpretation, flag for review by a qualified Spanish lawyer rather than making assumptions.

The architecture intentionally separates concerns so that:
- A lawyer can verify correctness by reading only YAML files
- A developer can verify correctness by reading only TypeScript files
- Neither audience needs to read both to perform their review
