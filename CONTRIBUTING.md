# Contribuir a PACTA Contract Engine / Contributing to PACTA Contract Engine

-----

## 🇪🇸 Español

### Bienvenido

Este proyecto tiene dos tipos de contribuidores con responsabilidades distintas y complementarias:

**Abogados y especialistas en LAU** — revisan que las reglas YAML sean legalmente correctas  
**Developers** — revisan que el motor TypeScript implemente las reglas con precisión técnica

Ninguno necesita entender el trabajo del otro para contribuir. Esa separación es deliberada.

-----

### Para abogados y especialistas legales

No necesitas saber programar. Los archivos que te interesan están en `/rules/lau/`.

**Cómo contribuir:**

1. Lee los archivos `.yaml` en `/rules/lau/`
1. Si detectas un error legal, abre un [Issue](https://github.com/aawlejandro/pacta-contract-engine/issues) con la etiqueta `legal-review`
1. Describe el error con referencia al artículo de ley correspondiente
1. Si puedes, propón la corrección en texto plano — un developer la traducirá a YAML

**Qué buscar:**

- ¿La regla refleja correctamente el artículo de ley que referencia?
- ¿Hay condiciones que faltan o que son incorrectas?
- ¿Los casos de test cubren situaciones reales relevantes?
- ¿Hay normativa autonómica que debería añadirse?

**Importante:** Las reglas solo automatizan lo que es objetivamente computable. Si detectas una situación que requiere interpretación jurídica, señálalo — no lo añadiremos al motor, pero lo documentaremos como límite explícito.

-----

### Para developers

**Setup:**

```bash
git clone https://github.com/aawlejandro/pacta-contract-engine
cd pacta-contract-engine
npm install
npm test
```

**Estructura del proyecto:**

```
rules/lau/       ← Reglas YAML (no tocar sin revisión legal)
engine/          ← Motor TypeScript
tests/lau/       ← Tests por regla
```

**Antes de hacer un PR:**

- [ ] Los tests pasan: `npm test`
- [ ] TypeScript sin errores: `npm run typecheck`
- [ ] Si modificas una regla YAML, abre también un issue `legal-review`
- [ ] Si añades una nueva regla, incluye al menos 3 casos de test

**Principio de diseño a respetar:**

El motor evalúa reglas; no toma decisiones. Si un caso requiere interpretación, el resultado debe incluir `requiere_consulta_legal: true`, no un veredicto.

-----

### Proceso de revisión

|Tipo de cambio                 |Revisión necesaria     |
|-------------------------------|-----------------------|
|Corrección de bug en TypeScript|1 developer            |
|Nueva regla YAML               |1 developer + 1 abogado|
|Modificación de regla existente|1 developer + 1 abogado|
|Nuevo test                     |1 developer            |
|Documentación                  |Cualquiera             |

-----

### Código de conducta

Este proyecto trata un tema que afecta a la vida real de millones de personas. Pedimos rigor, honestidad sobre las limitaciones, y respeto entre contributors.

Si detectas un error que podría llevar a un cálculo incorrecto en producción, ábrelo como issue urgente con la etiqueta `legal-critical`. Lo trataremos con prioridad máxima.

-----

## 🇬🇧 English

### Welcome

This project has two types of contributors with distinct and complementary responsibilities:

**Lawyers and LAU specialists** — review that YAML rules are legally correct  
**Developers** — review that the TypeScript engine implements rules with technical precision

Neither needs to understand the other’s work to contribute. That separation is intentional.

-----

### For lawyers and legal specialists

You don’t need to know how to code. The files you care about are in `/rules/lau/`.

**How to contribute:**

1. Read the `.yaml` files in `/rules/lau/`
1. If you spot a legal error, open an [Issue](https://github.com/aawlejandro/pacta-contract-engine/issues) with the label `legal-review`
1. Describe the error with a reference to the relevant law article
1. If possible, propose the fix in plain text — a developer will translate it to YAML

**What to look for:**

- Does the rule correctly reflect the law article it references?
- Are there missing or incorrect conditions?
- Do the test cases cover relevant real-world situations?
- Is there regional law (normativa autonómica) that should be added?

-----

### For developers

**Setup:**

```bash
git clone https://github.com/aawlejandro/pacta-contract-engine
cd pacta-contract-engine
npm install
npm test
```

**Before submitting a PR:**

- [ ] Tests pass: `npm test`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] If you modify a YAML rule, also open a `legal-review` issue
- [ ] If you add a new rule, include at least 3 test cases

-----

### Legal disclaimer

This engine automates the application of objective legal rules. It does not constitute legal advice. For situations requiring legal interpretation, users should consult a qualified professional.
