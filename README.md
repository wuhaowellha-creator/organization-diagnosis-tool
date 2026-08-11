# Organization Diagnosis Workbench

**组织脉络** is an open-source, human-in-the-loop organization diagnosis workbench for HR business partners. It turns interviews and workplace observations into reviewable diagnoses, accountable follow-ups, and reusable management reports—without allowing AI output to bypass human confirmation.

[简体中文](README.zh-CN.md) · [Contributing](CONTRIBUTING.md) · [Roadmap](ROADMAP.md) · [Security](SECURITY.md)

> **Project status:** early-stage and actively maintained. The core workflow is usable, but the project is still building its external user and contributor community. Usage numbers are intentionally not claimed until they can be verified.

## Why this project exists

HR observations often live in scattered notes, while AI-generated conclusions can be difficult to audit. This project provides a self-hostable reference implementation that keeps facts, machine assistance, human judgment, and follow-up state separate.

It is also useful to developers building responsible AI workflows because it demonstrates:

- a provider-neutral OpenAI-compatible model adapter;
- structured-output validation and a deterministic fallback;
- human approval gates before downstream actions;
- user-isolated persistence on Cloudflare D1;
- transactional CSV imports and auditable report exports;
- a complete Vinext / React / ChatGPT Sites application.

## Core workflow

```mermaid
flowchart LR
  A[Work record] --> B[AI-assisted draft]
  B --> C{Human review}
  C -->|Revise| B
  C -->|Confirm| D[Follow-up item]
  C -->|Confirm| E[Summary report]
  D --> F[Retrospective]
```

AI output is always a draft. Unconfirmed diagnoses cannot create follow-up items and are excluded from reports.

## Features

- Create, edit, search, filter, and bulk-import work records.
- Import up to 100 CSV rows with browser and server validation; reject the entire batch when any row is invalid.
- Generate structured diagnosis drafts with DeepSeek, OpenAI, OpenRouter, or another compatible endpoint.
- Fall back to conservative built-in rules when an external provider is unavailable or returns invalid output.
- Review and confirm diagnoses before they enter the operational workflow.
- Convert confirmed medium/high-risk diagnoses into deduplicated follow-up items.
- Track status, suggested actions, and retrospective results.
- Generate date-range reports and batch-export UTF-8 CSV files that open correctly in Excel.
- Use ChatGPT identity and D1-backed per-user data isolation when deployed through ChatGPT Sites.

## Quick start

### Prerequisites

- Node.js 22.13 or newer
- pnpm 10

### Run locally

```bash
git clone https://github.com/wuhaowellha-creator/organization-diagnosis-tool.git
cd organization-diagnosis-tool
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm dev
```

Open `http://localhost:3000`. External AI keys are optional; without them, the built-in diagnosis rules keep the core workflow available.

### Validate a change

```bash
pnpm check
```

This runs the automated tests, TypeScript validation, and a production build—the same checks used by GitHub Actions.

## AI providers and data handling

The provider can be selected from the **AI-assisted diagnosis** panel on a work-record detail page.

| Provider | Environment variables |
| --- | --- |
| DeepSeek | `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL` |
| OpenAI | `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` |
| OpenRouter | `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_MODEL` |
| Compatible API | `COMPATIBLE_API_KEY`, `COMPATIBLE_BASE_URL`, `COMPATIBLE_MODEL` |

Server-side keys never enter the business database. A user may optionally provide a browser-local key; it is sent to this application's server only when generating a diagnosis and is not persisted in D1. See [SECURITY.md](SECURITY.md) before using real HR data or a shared device.

## Architecture

```text
React 19 + Vinext
        │
        ├── App routes and API handlers
        ├── Human-in-the-loop diagnosis domain
        ├── Multi-provider AI adapter + safety validation
        └── Drizzle ORM ── Cloudflare D1
```

The main AI path is:

```text
POST /api/records/:id/diagnose
  → resolve the current user's provider settings
  → call the provider adapter
  → validate structure and safety constraints
  → persist a pending diagnosis draft
  → require human confirmation
```

## API overview

- `GET|POST /api/records`
- `POST /api/records/import`
- `GET|PATCH /api/records/:id`
- `POST /api/records/:id/diagnose`
- `PATCH /api/diagnoses/:id`
- `POST /api/diagnoses/:id/confirm`
- `POST /api/records/:id/create-follow-up`
- `GET|PATCH /api/follow-ups/:id`
- `POST /api/reports/summary`
- `GET|PATCH /api/settings/ai`

Every business-data endpoint resolves the current user and scopes records to that user.

## Contributing and maintenance

Bug reports, design discussions, documentation improvements, tests, and focused pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the [roadmap](ROADMAP.md).

The maintainer reviews issues and pull requests, owns architecture and releases, and keeps final merge and AI-assisted decisions under human control. Project decisions and releases will be documented publicly as the community grows.

## License

MIT © 2026 [Bighao](https://github.com/wuhaowellha-creator). See [LICENSE](LICENSE).
