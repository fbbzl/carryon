# Upstream

Source: https://github.com/cathrynlavery/diagram-design
Imported: 2026-10-22
Source ref: main (downloaded snapshot; commit not pinned)
Plugin version: 2.6.119
Payload: complete skills/diagram-design directory, plus upstream license notices.
Local change: SKILL.md metadata.version normalized from quoted 2.6 to 2.6.119 for the project validator.
Local change: export_png.py accepts --browser-channel chrome or msedge to reuse an installed browser.
Local change: taste-gate checks use the active skin's background and typography roles, including custom brands and dark variants.
Local change: PNG export instructions prefer configured Python runtimes and document installed-browser channels; see LOCAL-RUNTIME.md.
Local change: environment diagnostics use the same configured Python runtime and browser channel as PNG export, retaining bounded probes and read-only checks.
Local change: onboarding writes canonical token/font settings, prioritizes verified brand typography, and verifies rebuilt output; maintainer-only validation is distinguished from installed-skill checks throughout the entrypoint and animation guide.
No MCP server or changes to other skills are included. Python Playwright is installed in a separate local virtual environment; see LOCAL-RUNTIME.md.
