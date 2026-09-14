# Placement check

Short authenticated quiz that suggests a CEFR starting level. It is **not** a full exam pack and does not replace ongoing assessment.

## Shipped

- `GET /v1/placement` — placement items for the signed-in learner.
- `POST /v1/placement/submit` — answers → suggested level + score.
- Sample Goethe-style pack endpoint exists at `GET /v1/exam-packs/goethe-b1-sample` (content sample; full exam UX still on the roadmap).
- Frontend: `/placement` (requires login; redirects to `/login` on 401).
- Result is informational; learners can still open any available Learn path content their account allows.

## Out of scope (for now)

Timed exam packs with wrong-item review into vocabulary (see [future-plans.md](./future-plans.md) §5.2).

## Key code

| Area | Location |
| --- | --- |
| Routes | `backend/src/routes/placement.ts` |
| UI | `frontend/src/app/placement/page.tsx` |
| Query helper | `frontend/src/lib/api-queries.ts` (`fetchPlacementItems`) |
