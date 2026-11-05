#!/bin/sh
set -eu
command -v python3 >/dev/null 2>&1 || { echo 'Python 3 is required for the Git policy hooks.' >&2; exit 1; }
cd "$(git rev-parse --show-toplevel)"
hook_path="$(pwd)/.githooks"
current=$(git config --get core.hooksPath || :)
if [ -n "$current" ] && [ "$current" != '.githooks' ] && [ "$current" != "$hook_path" ]; then
    echo "Existing core.hooksPath is $current; integrate these guards before replacing it." >&2
    exit 1
fi
chmod +x .githooks/reference-transaction .githooks/pre-commit .githooks/pre-push
git config --local core.hooksPath "$hook_path"
echo 'Installed branch guards. Linked worktrees share this setting and use this hook directory.'
