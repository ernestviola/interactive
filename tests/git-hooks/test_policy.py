import pathlib
import shutil
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class BranchPolicyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = pathlib.Path(self.temp.name) / 'repo'
        self.repo.mkdir()
        self.git('init', '-b', 'staging')
        self.git('config', 'user.email', 'test@example.com')
        self.git('config', 'user.name', 'Test')
        self.git('commit', '--allow-empty', '-m', 'initial')
        self.git('branch', 'main')
        shutil.copytree(ROOT / '.githooks', self.repo / '.githooks')
        self.git('config', 'core.hooksPath', '.githooks')

    def git(self, *args, ok=True):
        result = subprocess.run(['git', *args], cwd=self.repo, capture_output=True, text=True)
        if ok:
            self.assertEqual(result.returncode, 0, result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0, result.stdout)
        return result.stdout.strip()

    def feature(self):
        self.git('switch', '-c', 'feature', 'staging')
        self.git('commit', '--allow-empty', '-m', 'feature')

    def test_branch_creation(self):
        self.feature()
        self.git('branch', 'bad', ok=False)
        self.git('branch', 'good', 'staging')
        self.git('show-ref', '--verify', 'refs/heads/bad', ok=False)

    def test_direct_main_commit_and_feature_merge_rejected(self):
        self.feature()
        self.git('switch', 'main')
        self.git('commit', '--allow-empty', '-m', 'direct', ok=False)
        self.git('merge', '--ff-only', 'feature', ok=False)

    def test_staging_fast_forward_promotion(self):
        self.feature()
        self.git('switch', 'staging')
        self.git('merge', '--ff-only', 'feature')
        self.git('switch', 'main')
        self.git('merge', '--ff-only', 'staging')

    def test_staging_merge_commit_promotion(self):
        self.feature()
        self.git('switch', 'staging')
        self.git('merge', '--ff-only', 'feature')
        self.git('switch', 'main')
        self.git('merge', '--no-ff', 'staging', '-m', 'promote')

    def test_push_requires_remote_staging(self):
        remote = pathlib.Path(self.temp.name) / 'remote.git'
        self.git('init', '--bare', str(remote))
        self.git('remote', 'add', 'origin', str(remote))
        self.git('push', 'origin', 'staging', 'main')
        self.feature()
        self.git('push', 'origin', 'feature:main', ok=False)
        self.git('push', 'origin', ':main', ok=False)
        self.git('switch', 'staging')
        self.git('merge', '--ff-only', 'feature')
        self.git('switch', 'main')
        self.git('merge', '--ff-only', 'staging')
        self.git('push', 'origin', 'main', ok=False)
        self.git('push', '--atomic', 'origin', 'staging', 'main')


if __name__ == '__main__':
    unittest.main()
