"""Real Chrome and WebGL checks through film27's LW.render. Skipped outside the Fourth Watch repo."""
import hashlib, json, math, os, shutil, subprocess, sys, tempfile, unittest
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
FILM = ROOT.parent / 'ep01-samson' / 'film27'
CHROME = os.environ.get('CHROME_PATH', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')
sys.path.insert(0, str(ROOT / 'scripts'))
BRIDGE = {'storm_bridge.html': 'storm_bridge.html', 'storm_track.js': 'storm_track.js', 'storm_score.js': 'storm_score.js',
          'storm_native.js': 'scenes/storm_native.js'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def env():
    e = dict(os.environ, CHROME_PATH=CHROME)
    root = subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip()
    if root:
        e['NODE_PATH'] = root
    return e


@unittest.skipUnless(FILM.is_dir(), 'film27 checkout missing')
class InstalledBridge(unittest.TestCase):
    def test_film27_bridge_files_match_their_source(self):
        for source, target in BRIDGE.items():
            self.assertEqual(sha(ROOT / 'native_three' / source), sha(FILM / target), target)

    def test_vtk_orientation_convention(self):
        # The native scene applies orientations as R = Rz*Rx*Ry. Check that against VTK itself.
        import numpy as np
        import vtk
        def rot(axis, deg):
            c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
            return {'x': np.array([[1, 0, 0], [0, c, -s], [0, s, c]]), 'y': np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]]),
                    'z': np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])}[axis]
        actor = vtk.vtkActor()
        actor.SetOrientation(-76.0, -141.8, -149.7)
        m = actor.GetMatrix()
        vtk_matrix = np.array([[m.GetElement(i, j) for j in range(3)] for i in range(3)])
        self.assertLess(np.abs(rot('z', -149.7) @ rot('x', -76.0) @ rot('y', -141.8) - vtk_matrix).max(), 1e-9)
        self.assertEqual((ROOT / 'native_three/storm_native.js').read_text().count("'ZXY')"), 2)

    def test_legacy_film_entry_does_not_load_the_bridge(self):
        html = (FILM / 'index.html').read_text()
        self.assertNotIn('storm', html)
        self.assertIn('score.js', html)


@unittest.skipUnless(FILM.is_dir() and Path(CHROME).exists() and shutil.which('node'), 'Chrome or film27 missing')
class NativeRender(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = tempfile.TemporaryDirectory()
        cls.out = Path(cls.dir.name)
        # S03 and S11 carry overlays. S07, S09 and S10 are the fragile contact shots.
        cls.frames = [275, 730, 975, 1060, 1210, 730]
        times = [f'{f / 30:.6f}' for f in cls.frames]
        q = subprocess.run(['node', str(ROOT / 'scripts/render_native_storm.js'), 'stills', str(cls.out), *times],
                           capture_output=True, text=True, env=env(), timeout=240)
        cls.result = q

    @classmethod
    def tearDownClass(cls):
        cls.dir.cleanup()

    def test_renders_with_no_page_errors(self):
        self.assertEqual(self.result.returncode, 0, self.result.stderr)

    def test_frames_match_v10_layout(self):
        from compare_native_v10 import compare_stills
        result = compare_stills(ROOT / 'outputs/v10/verified_3d_review/01_3d_layout_silent.mp4', self.out)
        self.assertGreater(result['ALL']['worst_ssim'], .90, json.dumps(result))

    def test_frame_is_a_pure_function_of_time(self):
        first = self.out / 'f_0730.png'
        second = self.out / 'again'
        q = subprocess.run(['node', str(ROOT / 'scripts/render_native_storm.js'), 'stills', str(second), f'{730 / 30:.6f}'],
                           capture_output=True, text=True, env=env(), timeout=120)
        self.assertEqual(q.returncode, 0, q.stderr)
        self.assertEqual(sha(first), sha(second / 'f_0730.png'))


if __name__ == '__main__':
    unittest.main()
