# Repository checks

## Documentation links

Checks local Markdown file/directory links against staged Git content, without changing files or staging. Requires Node on `PATH`.

```sh
node scripts/check-documentation-links.mjs        # Changed docs and links affected by removals/renames
node scripts/check-documentation-links.mjs --all  # All tracked docs; also used by CI
node --test scripts/tests/documentation-links.test.mjs
```

Supports inline links/images and reference definitions. Ignores code examples, comments and `.agents/skills/*/templates/` placeholders. Does not validate heading anchors, external URLs, absolute paths, HTML links or full Markdown syntax; symlink/submodule contents are not followed.

### Local hook setup

Cloning does not activate [.githooks/pre-commit](../.githooks/pre-commit). Check existing configuration first:

```sh
git config --get core.hooksPath
```

If another hook system exists, add the checker there. Otherwise, from the repository root:

```sh
git config --local core.hooksPath .githooks
```

Linked worktrees share this setting: each must contain the hook and checker. The hook runs only the staged check, stays quiet on success and reports broken links with their source line. Exit codes: 1 for link errors, 2 if checking cannot complete. CI enforcement requires branch protection.
