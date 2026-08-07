# Async Generation Jobs — frontend pointer

Повна інструкція (чому, архітектура, покрокова реалізація, чеклист) лежить у **backend-репо**:

→ [`stylegenerateai-backend/instructions/async-generation-jobs/`](../../../stylegenerateai-backend/instructions/async-generation-jobs/README.md)

Якщо репо клоновані поруч (`…/stylegenerateai` і `…/stylegenerateai-backend`), відкривай саме backend-папку — там канонічний опис.

## Файли фронту в цій схемі

| Файл | Роль |
|---|---|
| [`src/services/api/generation-job.js`](../../src/services/api/generation-job.js) | Універсальний poll: `resolveGenerationResponse` (image + json) |
| [`src/services/api/photo-lab.js`](../../src/services/api/photo-lab.js) | Після POST → `resolveGenerationResponse` |
| [`src/services/api/ready-template.js`](../../src/services/api/ready-template.js) | preview / your-look / resolve-prompt-metadata |
| [`src/services/api/autogenerate.js`](../../src/services/api/autogenerate.js) | autogenerate, poll до 90 хв |

Правило: **деплой FE разом із BE**, інакше клієнт отримає `202` без poll (або poll без BE).
