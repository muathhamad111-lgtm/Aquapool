<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Development Workflow

This section defines the permanent development workflow for this repository.
It applies to every feature, fix, refactor, documentation update, or chore.

## 1. Git workflow

- Never work directly on `main`.
- Every feature, fix, refactor, documentation update, or chore must use its
  own branch.
- Keep `main` production-ready at all times.

## 2. Task workflow

- Always inspect the existing implementation first.
- Identify every affected file before making changes.
- Present a short implementation plan before writing any code.
- Avoid assumptions about business logic — verify against the actual code,
  and ask if something is ambiguous rather than guessing.

## 3. Scope control

- Do not modify backend code unless explicitly requested.
- Do not modify database schema, migrations, seeders, deployment scripts, or
  infrastructure unless explicitly requested.
- Avoid unrelated changes — a change scoped to one area should not also
  touch unrelated files "while in there."

## 4. Verification

Before reporting an implementation complete, run:

- TypeScript typecheck
- ESLint on changed files
- Production build

## 5. Approval gates

After verification:

- STOP.
- Do not stage files.
- Do not commit.
- Do not merge.
- Do not push.
- Do not deploy.
- Wait for explicit approval before proceeding further.

## 6. Commit workflow

Only after approval:

- Stage only the files relevant to the change.
- Create focused commits using Conventional Commit messages.
- Stop after committing.
- Do not push unless explicitly approved.

## 7. Deployment workflow

- Deployment is a separate approval step from implementation and commit.
- Never deploy without explicit approval.
- After deployment, verify:
  - Assets return 200.
  - Target pages return 200.
  - Logs are clean.

## 8. Production safety

- Prefer non-mutating verification.
- Do not run migrations, seeders, service restarts, or any other production
  mutation unless explicitly approved.

## 9. Lovable workflow

- Preserve Lovable-related workflow files and configuration unless
  explicitly approved otherwise.
- Lovable may continue to be used for UI/UX prototyping.

## 10. Communication

- Keep reports concise.
- Mention modified files and verification results.
- Stop after the requested scope is complete.
