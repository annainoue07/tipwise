# AGENTS.md

This project keeps its agent instructions in [`CLAUDE.md`](./CLAUDE.md).

`AGENTS.md` is the tool-neutral convention that several coding agents look for;
`CLAUDE.md` is what Claude Code loads automatically. Rather than maintain two
files that drift apart, this repo keeps one source of truth.

**If you are an agent that reads `AGENTS.md`, read `CLAUDE.md` now** — it
contains the constraints, workflow, and escalation rules for this repository.

Supporting documentation, all referenced from `CLAUDE.md`:

| File | Purpose |
| --- | --- |
| `docs/ARCHITECTURE.md` | System shape, data flow, package boundaries |
| `docs/CODING_STANDARDS.md` | Conventions, testing rules, error handling |
| `docs/adr/` | Architecture decision records — settled questions |
| `.github/pull_request_template.md` | What every PR must state |

> **Maintainer note:** if you prefer a real single file, replace this with a
> symlink (`ln -s CLAUDE.md AGENTS.md`). Symlinks survive git but confuse some
> Windows checkouts, which is why this repo uses a pointer file instead.
