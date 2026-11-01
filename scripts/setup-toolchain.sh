#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."
task_nvm_dir="${NVM_DIR:-$HOME/.nvm}"

if [ ! -s "$task_nvm_dir/nvm.sh" ]; then
  printf '%s\n' 'nvm was not found. Install nvm first: https://github.com/nvm-sh/nvm#installing-and-updating' >&2
  exit 1
fi

# nvm is a shell function and is not automatically loaded in npm scripts.
. "$task_nvm_dir/nvm.sh"
task_node_version="$(cat .node-version)"
nvm install "$task_node_version"
nvm use "$task_node_version"
corepack enable pnpm
printf '\nNode: '
node --version
printf 'Project pnpm: '
corepack pnpm --version
printf '\nIn your current terminal, activate Node with: nvm use %s\n' "$task_node_version"
printf '%s\n' 'Then run: pnpm install --frozen-lockfile --ignore-scripts'
