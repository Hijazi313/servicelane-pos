# Contributing

Read [project scope](docs/project-scope.md) and the [current tracker](docs/planning/TRACKER.md) before starting. Keep changes within authorized scope. Agents must also follow [AGENTS.md](AGENTS.md) and applicable nested instructions.

## Branches and commits

- Use `main` as the integration branch and short-lived topic branches. Agent-created branches use `codex/<short-description>`; other contributors may use `<type>/<short-description>`.
- Keep each commit focused on one coherent change, including its relevant documentation. Review the diff and stage specific files; preserve unrelated work.
- Use Conventional Commits: `type(scope): description`. Scope is optional and should name the affected area, not a restaurant.

```text
docs(foundation): define acceptance steps
chore(repo): add Git conventions
fix(access): reject disabled staff sessions
```

Use `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf` or `revert` as appropriate. Mark incompatible public-contract changes with `!`, such as `feat(api)!: change pagination`, and explain the impact and migration in the commit body. See [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

## Review and merge

- Once a remote is established, submit changes through pull requests. Describe the problem, resulting behavior, verification evidence and material limitations. Use a conventional PR title.
- Prefer squash merging a focused PR, using its title as the final commit subject. Delete the branch after merging.
- Configure host-side protection for `main`: require PRs and block force pushes and deletion. Require independent approval when another reviewer is available; require status checks only after they exist and are authorized. These settings are not enforced by this file.
- Never force-push `main` or rewrite shared history. Prefer reverting a shared change. Rewrite only your own unmerged branch; if a force push is necessary, use `--force-with-lease` and coordinate with anyone using it.

## Repository hygiene

- Never commit credentials, real environment files, customer data or database backups. Keep local database files outside the repository or under an ignored `backups/` directory. Commit only sanitized `.env.example` files.
- Commit the pnpm lockfile when introduced. Do not commit dependencies, build output or logs. Keep SQL migrations tracked; they are source, not database backups.
- `.gitignore` does not untrack existing files or guarantee secret detection. Inspect staged content before committing. If a secret is committed, revoke or rotate it; deleting the file in a later commit is insufficient.
- Follow `.editorconfig` and `.gitattributes`. Avoid unrelated formatting changes.

## Verification

Follow the canonical [verification policy](docs/project-scope.md#verification-policy). Run the smallest relevant checks using existing tooling; broader checks require justification. Report results, unverified behavior and pending user acceptance. Hooks and installation scripts must respect the same authorization boundaries. Source inspection is not proof of successful runtime behavior.
