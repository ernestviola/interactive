#!/usr/bin/env python3
"""Local guards for feature -> staging -> main. No external Python dependencies."""
import subprocess
import sys


class PolicyError(Exception):
    pass


def git(*args, required=True):
    result = subprocess.run(['git', *args], text=True, capture_output=True)
    if result.returncode and required:
        raise PolicyError(result.stderr.strip() or 'Git command failed.')
    return result.stdout.strip() if result.returncode == 0 else None


def zero(oid):
    return bool(oid) and set(oid) == {'0'}


def tips():
    return {oid for ref in ('refs/heads/staging', 'refs/remotes/origin/staging')
            if (oid := git('rev-parse', '--verify', ref, required=False))}


def promotion(old, new, staging):
    if not staging or zero(new):
        return False
    if not zero(old) and git('merge-base', '--is-ancestor', old, new, required=False) is None:
        return False
    if new in staging:
        return True
    parents = git('show', '-s', '--format=%P', new).split()
    return len(parents) == 2 and parents[0] == old and parents[1] in staging


def reference_transaction(state, lines):
    if state != 'prepared':
        return
    updates = [line.split() for line in lines if line.strip()]
    staging = tips()
    # Also support a single atomic update promoting staging and main together.
    staging.update(new for old, new, ref in updates
                   if ref == 'refs/heads/staging' and not zero(new))
    for old, new, ref in updates:
        if not ref.startswith('refs/heads/') or zero(new):
            continue
        name = ref[len('refs/heads/'):]
        if name not in ('main', 'staging') and zero(old) and new not in staging:
            raise PolicyError('New feature branches must start at staging or origin/staging. '
                              'Fetch origin, then use git switch -c <feature> origin/staging.')
        if name == 'main' and not zero(old) and not promotion(old, new, staging):
            raise PolicyError('main may advance only by promoting staging '
                              '(fast-forward or a two-parent merge from staging).')


def pre_commit():
    if git('symbolic-ref', '--quiet', '--short', 'HEAD', required=False) == 'main':
        raise PolicyError('Direct commits to main are blocked. Commit on a feature branch '
                          'from staging, then integrate through staging.')


def pre_push(remote_url, lines):
    updates = [line.split() for line in lines if line.strip()]
    main_updates = [row for row in updates if row[2] == 'refs/heads/main']
    if not main_updates:
        return
    if any(zero(row[1]) for row in main_updates):
        raise PolicyError('Deleting main is blocked.')
    staged = [row[1] for row in updates if row[2] == 'refs/heads/staging']
    if staged:
        staging = {oid for oid in staged if not zero(oid)}
    else:
        # Consult the remote rather than a possibly stale tracking reference.
        result = subprocess.run(['git', 'ls-remote', '--exit-code', '--refs', remote_url,
                                 'refs/heads/staging'], text=True, capture_output=True,
                                timeout=20)
        if result.returncode:
            raise PolicyError('Cannot verify remote staging; refusing main push. '
                              'Check connectivity and fetch staging before retrying.')
        staging = {line.split()[0] for line in result.stdout.splitlines() if line.strip()}
    for local_ref, new, remote_ref, old in main_updates:
        if not promotion(old, new, staging):
            raise PolicyError('Push to main must promote the actual remote staging tip '
                              '(or staging updated in this same push). Merge feature work '
                              'into staging first, fetch, and then promote staging.')


def main():
    try:
        hook = sys.argv[1]
        if hook == 'reference-transaction':
            reference_transaction(sys.argv[2], sys.stdin)
        elif hook == 'pre-commit':
            pre_commit()
        elif hook == 'pre-push':
            pre_push(sys.argv[3], sys.stdin)
    except (PolicyError, subprocess.TimeoutExpired, ValueError) as exc:
        print(f'Branch policy: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
