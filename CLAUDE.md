# Working agreement for AI assistants

This file is read automatically by Claude Code. It records how the assistant is
expected to work in this repo. See `docs/architecture.md` for the system and
`docs/development-standards.md` for the engineering rules.

## Publishing and remote access — the owner does it, not the assistant

As of 2026-07-23, by the owner's instruction:

- **Never push to any remote.** No `git push`, no branch or tag pushed to
  GitHub. Commit locally only when asked; leave the push to the owner.
- **Never deploy.** No `scripts/deploy-frontend.sh`, no rsync to the server, no
  release swap — on production or staging.
- **Never touch the server or its databases.** No SSH to the droplet, no
  `psql`/`pg_dump`, no schema or grant changes on the live databases. Read-only
  audits included: they still open a session on the box.
- **Anything that leaves this machine is the owner's action.** Publishing,
  deploying, and remote administration are done by the owner only.

This is a hard boundary, not a default to weigh against convenience. If a task
seems to need any of the above, do the local part, then stop and hand the
remote step to the owner with the exact command(s) to run.

Local work is unaffected: editing files, running the test/lint/build/typecheck
suite, driving a local dev server, and making local commits (when asked) are all
fine.
