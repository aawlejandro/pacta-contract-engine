# pacta-contract-engine
# PACTA · Contract Engine

> **“Tu contrato, vivo.” — “Your contract, alive.”**

Motor de reglas contractuales open source para arrendamientos de vivienda en España.  
Open source contractual rules engine for residential tenancies in Spain.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: WIP](https://img.shields.io/badge/Status-Work%20In%20Progress-yellow)]()
[![Normativa: LAU + Ley 12/2023](https://img.shields.io/badge/Normativa-LAU%20%2B%20Ley%2012%2F2023-green)]()

-----

## 🇪🇸 Español

### ¿Qué es esto?

Este repositorio contiene el **motor de reglas contractuales de PACTA**: el núcleo que traduce la Ley de Arrendamientos Urbanos (LAU 29/1994) y la Ley 12/2023 en reglas ejecutables, auditables y versionadas.

No es una app. No es un PDF. Es el conjunto de reglas que responde preguntas como:

- ¿Cuánto puede subir la renta este año en mi contrato?
- ¿Cuándo debo notificar si no quiero renovar?
- ¿Estoy en zona tensionada? ¿Qué límites aplican?
- ¿En qué fase de prórroga está mi contrato?

### El principio fundamental

**Solo automatizamos lo que es objetivamente computable.** Si una situación requiere interpretación jurídica, queda fuera del motor. PACTA aplica reglas, no interpreta.

### Arquitectura: separación de responsabilidades

El motor está diseñado para ser auditado por dos tipos de personas distintas:

```
pacta-contract-engine/
├── rules/                        ← Auditables por abogados (YAML legible)
│   └── lau/
│       ├── actualizacion-renta.yaml   # LAU Art. 18
│       └── plazos-preaviso.yaml       # LAU Arts. 9, 10, 11
├── engine/                       ← Auditables por developers (TypeScript)
│   ├── evaluator.ts              # Motor de evaluación principal
│   └── types.ts                  # Tipos compartidos
├── tests/                        ← Casos reales verificados con Vitest
│   └── lau/
│       └── actualizacion-renta.test.ts
├── package.json
└── tsconfig.json
```

- **`rules/`** — Escrito en YAML semántico. Un abogado puede leerlo, entenderlo y detectar errores sin saber programar.
- **`engine/`** — El evaluador TypeScript que ejecuta esas reglas. Un developer puede auditarlo, testearlo y mejorarlo.

Ninguna de las dos capas debería entender la otra para hacer su trabajo. Esa separación es intencional y es el núcleo de nuestra propuesta de transparencia.

### Ejemplo de regla (LAU Art. 18 — Actualización de renta)

```yaml
rule_id: "LAU_18_actualizacion_renta"
version: "1.0.0"
normativa:
  ley: "LAU 29/1994"
  articulo: "18"
  modificado_por: "Ley 12/2023"

descripcion: >
  La renta solo puede actualizarse en la fecha de cada aniversario del contrato,
  aplicando el índice pactado (IRAV si el contrato es posterior a 2023, IPC si es anterior).

condiciones:
  - contrato.estado == "VIGENTE"
  - dias_hasta_aniversario == 0
  - actualizacion_aplicada_este_año == false

calculo:
  indice: "IRAV"                    # o IPC según fecha del contrato
  fuente: "https://www.ine.es"      # API pública del INE
  limite_zona_tensionada: 0.03      # máximo 3% en zona tensionada (art. 17.6)

resultado:
  nueva_renta: "renta_actual * (1 + variacion_indice)"
  notificacion_obligatoria_dias: 30
```

### Scope de v0.1 (en desarrollo)

|Regla                                      |Artículo           |Archivo                             |Estado       |
|-------------------------------------------|-------------------|------------------------------------|-------------|
|Actualización de renta (IRAV/IPC)          |LAU Art. 18        |`rules/lau/actualizacion-renta.yaml`|🔄 Borrador   |
|Plazos de preaviso                         |LAU Arts. 9, 10, 11|`rules/lau/plazos-preaviso.yaml`    |🔄 Borrador   |
|Cálculo de prórrogas (obligatoria / tácita)|LAU Arts. 9, 10    |—                                   |📋 Planificado|
|Identificación zona tensionada (Cataluña)  |Ley 12/2023 Art. 18|—                                   |📋 Planificado|
|Límites de renta en zona tensionada        |Ley 12/2023 Art. 17|—                                   |📋 Planificado|
|Información precontractual obligatoria     |Ley 12/2023 Art. 25|—                                   |📋 Planificado|


> ⚠️ **Estado actual**: El repositorio está en construcción activa. Las reglas están marcadas como `borrador` y pendientes de revisión legal especializada. El motor TypeScript está en fase de prototipo. **No usar en producción.**

### Primeros pasos

```bash
git clone https://github.com/aawlejandro/pacta-contract-engine
cd pacta-contract-engine
npm install
npm test
```

### Cómo contribuir

Buscamos dos tipos de colaboradores:

**Abogados y especialistas en LAU**

- Revisar que las reglas YAML reflejen correctamente la normativa
- Aportar casos reales que sirvan como tests
- Identificar ambigüedades o lagunas en las reglas

**Developers**

- Mejorar el motor de evaluación TypeScript
- Añadir tests para nuevos casos
- Integraciones con APIs públicas (INE, MIVAU, Catastro)

Consulta <CONTRIBUTING.md> para empezar.

### Aviso legal

Este motor aplica reglas legales objetivas de forma automatizada. **No constituye asesoramiento jurídico.** Para situaciones que requieran interpretación, consulta con un profesional. PACTA aplica reglas; no interpreta.

-----

## 🇬🇧 English

### What is this?

This repository contains the **PACTA contractual rules engine**: the core that translates Spain’s Urban Tenancy Law (LAU 29/1994) and Law 12/2023 into executable, auditable, versioned rules.

It’s not an app. It’s not a PDF. It’s the rule set that answers questions like:

- How much can my rent increase this year?
- When must I notify if I don’t want to renew?
- Am I in a rent-controlled zone? What limits apply?
- What extension phase is my contract currently in?

### The core principle

**We only automate what is objectively computable.** If a situation requires legal interpretation, it stays out of the engine. PACTA applies rules — it does not interpret them.

### Architecture: separation of concerns

The engine is designed to be audited by two different types of people:

- **`rules/`** — Written in semantic YAML. A lawyer can read it, understand it, and spot errors without knowing how to code.
- **`engine/`** — The TypeScript evaluator that executes those rules. A developer can audit it, test it, and improve it.

Neither layer needs to understand the other to do its job. That separation is intentional and is the core of our transparency proposition.

### Getting started

```bash
git clone https://github.com/aawlejandro/pacta-contract-engine
cd pacta-contract-engine
npm install
npm test
```

### Why open source?

Spain has approximately 3.6 million rental properties. The legal framework governing them (LAU + Law 12/2023) is complex, frequently misapplied, and opaque to both landlords and tenants. A black-box proprietary engine that claims to apply the law correctly is, frankly, not trustworthy enough for something this important.

By making the rules open source, we enable:

- **Community auditing** by legal professionals
- **Transparent corrections** when rules are wrong
- **Independent adoption** by any project that needs to apply Spanish tenancy law
- **Public administration integration** (long-term)

### Contributing

We’re looking for two kinds of contributors:

**Lawyers and LAU specialists**

- Review that YAML rules correctly reflect the law
- Contribute real cases as tests
- Flag ambiguities or gaps

**Developers**

- Improve the TypeScript evaluation engine
- Add tests for edge cases
- Build integrations with public APIs (INE, MIVAU, Catastro)

See <CONTRIBUTING.md> to get started.

### Legal disclaimer

This engine automates the application of objective legal rules. **It does not constitute legal advice.** For situations requiring interpretation, consult a qualified professional.

-----

## Licencia / License

MIT — úsalo, fórkalo, mejóralo. Solo pedimos que las mejoras vuelvan a la comunidad.  
MIT — use it, fork it, improve it. We just ask that improvements come back to the community.

-----

<p align="center">
  Desarrollado como parte de <strong>PACTA</strong> · <em>Tu contrato, vivo.</em><br>
  <a href="https://pacta.es">pacta.es</a> · 
  <a href="mailto:hola@pacta.es">hola@pacta.es</a>
</p>
