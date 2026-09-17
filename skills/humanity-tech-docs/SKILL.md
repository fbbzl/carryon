---
name: humanity-tech-docs
description: "Refine existing technical documentation through accuracy-first review followed by controlled language cleanup. Use for API references, READMEs, design notes, and technical guides."
metadata:
  version: 1.0.0
  type: agent-skill
  scope: documentation
  tags: [technical-writing, documentation, editing]
  author: carryon
---

# Humanity Tech Docs

Use this skill to revise existing technical documentation in two ordered stages. It is a workflow wrapper around the two local skills below, not a replacement for them.

## Required dependencies

Before reviewing or editing the document, verify both dependency files exist and read them in this order:

1. `technical-writer-voice/SKILL.md`
2. `humanizer/SKILL.md`

If either dependency is unavailable:

1. Stop before editing the document and report the exact missing skill names.
2. Ask the user whether to install the missing dependencies. Treat `y` as approval and any other answer as refusal.
3. With approval, read and use the local `.system/skill-installer/SKILL.md`. Install only the missing skills from these fixed public paths:
   - `adrielkuek/Write-Like-A-Human`, `skills/technical-writer-voice`
   - `adrielkuek/Write-Like-A-Human`, `skills/humanizer`
4. Verify the installed `SKILL.md` files exist, then resume this workflow from dependency loading.

Do not silently substitute a generic writing workflow. Do not install anything without explicit user approval. If installation fails, report the failure and do not edit the document.

## Workflow

1. Apply `technical-writer-voice` first. Check document structure, terminology, request and response contracts, parameter combinations, constraints, errors, pagination, and the boundary between documented facts and unknown response shapes.
2. Apply `humanizer` second, using the `technical` or `technical-writer` voice and `technical` purpose. Limit this stage to concise, precise surface-level cleanup.

Preserve code identifiers, commands, configuration keys, measurements, links, constraints, examples, and documented behavior unless the user explicitly asks to change them. For API references, also preserve interface URLs, HTTP methods, header names, field names, types, requiredness, defaults, business codes, authentication rules, error conditions, and JSON examples. Do not invent undocumented fields, values, errors, performance claims, environment details, or technical conclusions.

After editing, verify that code fences are paired and that JSON examples still parse when the document contains JSON examples.
