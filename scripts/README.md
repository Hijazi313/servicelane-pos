# Repository checks

## Documentation links

The dependency-free checker validates local Markdown file/directory destinations against
Git's index. It never reads `.env`, contacts services, installs packages, rewrites files
or changes staging. Run with the project's supported Node runtime:

```sh
node scripts/check-documentation-links.mjs
node scripts/check-documentation-links.mjs --all
node --test scripts/tests/documentation-links.test.mjs
```

Default mode checks staged Markdown documents. For deletions/renames it also reads
remaining tracked Markdown and checks incoming links affected by removed paths,
including directories that lost their last tracked file. Code-only changes without
removals skip document reads. Full mode checks every tracked Markdown document and
is used by CI. Both modes inspect staged bytes and staged targets, so an unstaged
fix or an untracked target cannot make a commit pass. Directories exist when they
contain tracked files; unmerged index entries fail with a setup diagnostic.

Supported syntax: inline Markdown links/images (including angle-bracket destinations,
URL-encoded spaces and one level of nested parentheses) and reference definitions.
Paths resolve relative to the containing document. Query strings and fragments are
removed before checking path existence. Fenced code examples, inline code and HTML
comments are ignored. `.agents/skills/*/templates/` is excluded because its links
are relative to future generated documents, not the template location.

Limits: this is a bounded path checker, not a full Markdown parser. It does not
validate heading anchors, undefined reference labels, HTML links, absolute machine
paths, external URLs, nested Markdown constructs or semantic index accuracy. It
does not follow symlinks or submodule contents. Prefer conventional inline links
or reference definitions for repository navigation. No network/AI analysis or cache.

### Local hook setup

The checked-in hook is [.githooks/pre-commit](../.githooks/pre-commit). Setup is explicit;
cloning does not activate it. First inspect existing configuration:

```sh
git config --get core.hooksPath
```

If another hook system is configured, integrate the checker there rather than
replacing it. Otherwise, from the repository root:

```sh
git config --local core.hooksPath .githooks
```

This config is shared by linked worktrees; each checkout must contain the hook and
script before enabling it. Node must be on the terminal/GUI Git client's PATH.
The hook runs only the staged checker, never its tests or the full scan. It is quiet
on success; missing links exit 1 with source, line and remedy; checker/setup failures
exit 2. Local hooks can be bypassed; the independent CI check remains authoritative
only when required by repository branch protection. This change does not configure
branch protection or activate hooks in existing checkouts.
