"""Migration bridge checks; no claim of native WebGL render verification."""
import hashlib, json, math, shutil, subprocess, sys, tempfile, unittest
from pathlib import Path
import yaml

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from export_native_three import export
from vtk_state_bridge import StateExportRender
from vtk_story_renderer import Render as OriginalRender
from render_lock import locked

class NativeBridgeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plan=yaml.safe_load((ROOT/'examples/pilot-storm/shotplan.yaml').read_text())
        cls.temporary=tempfile.TemporaryDirectory()
        cls.out=Path(cls.temporary.name)
        cls.meta=export(ROOT/'examples/pilot-storm/shotplan.yaml',cls.out)
        raw=(cls.out/'storm_track.js').read_text()
        cls.track=json.loads(raw.split('globalThis.FW_STORM_TRACK = ',1)[1].rstrip(';\n'))

    @classmethod
    def tearDownClass(cls):cls.temporary.cleanup()

    def test_source_provenance_and_release_block(self):
        t=self.track
        self.assertEqual(t['status'],'NOT_APPROVED_LAYOUT')
        self.assertFalse(self.meta['native_render_verified'])
        self.assertFalse(self.meta['release_approved'])
        self.assertEqual(t['source_plan_sha256'],hashlib.sha256((ROOT/'examples/pilot-storm/shotplan.yaml').read_bytes()).hexdigest())
        self.assertEqual(self.meta['track_sha256'],hashlib.sha256((self.out/'storm_track.js').read_bytes()).hexdigest())
        self.assertEqual(t['source_vtk_renderer_sha256'],hashlib.sha256((ROOT/'scripts/vtk_story_renderer.py').read_bytes()).hexdigest())

    def test_1440_frames_and_each_shot_exact(self):
        t=self.track; self.assertEqual(len(t['frames']),1440)
        self.assertEqual(t['duration_s'],48)
        shots=t['shots']
        self.assertEqual(len(shots),12)
        self.assertEqual(shots[0]['start_frame'],0)
        self.assertEqual(shots[-1]['end_frame'],1440)
        for i,s in enumerate(shots):
            if i:self.assertEqual(shots[i-1]['end_frame'],s['start_frame'])
            for f in range(s['start_frame'],s['end_frame']):
                self.assertEqual(t['frames'][f]['frame'],f)
                self.assertEqual(t['frames'][f]['shot'],s['id'])

    def test_finite_camera_and_rig_coordinates(self):
        for s in self.track['frames']:
            for v in [*s['camera']['position'],*s['camera']['look'],s['camera']['fov']]:
                self.assertTrue(math.isfinite(v))
            self.assertTrue(30<=s['camera']['fov']<=65)
            for f in s['figures'].values():
                if f['visible']:
                    self.assertIsNotNone(f['joints'])
                    for xyz in f['joints'].values():
                        self.assertTrue(all(math.isfinite(v) for v in xyz))

    def test_rescue_contact_is_held_and_lifted(self):
        s=next(q for q in self.plan['shots'] if q['id']=='S09')
        beat={b['label']:b['at_frame'] for b in s['beats']}
        contact=beat['hands meet']; last=s['end_frame']-1
        for f in [contact,contact+6,contact+20,min(contact+35,last)]:
            a=self.track['frames'][f]['figures']['Jesus']['joints']['right_hand']
            b=self.track['frames'][f]['figures']['Peter']['joints']['right_hand']
            self.assertLess(math.dist(a,b),1e-5)
        self.assertGreater(self.track['frames'][min(contact+35,last)]['figures']['Peter']['joints']['right_hand'][1],
                           self.track['frames'][contact]['figures']['Peter']['joints']['right_hand'][1])

    def test_step_moves_foot_toward_near_gunwale(self):
        s=next(q for q in self.plan['shots'] if q['id']=='S07')
        beat={b['label']:b['at_frame'] for b in s['beats']}
        a=self.track['frames'][beat['foot clears gunwale']]
        b=self.track['frames'][min(beat['foot clears gunwale']+18,s['end_frame']-1)]
        self.assertGreater(b['figures']['Peter']['joints']['right_foot'][2], a['figures']['Peter']['joints']['right_foot'][2])

    def test_entry_cue_changes_camera_and_subject_without_teleport_inside_shot(self):
        s=next(q for q in self.plan['shots'] if q['id']=='S10')
        f=next(b['at_frame'] for b in s['beats'] if b['label']=='boat entry')
        a=self.track['frames'][f-1];b=self.track['frames'][f]
        self.assertEqual(a['shot'],'S10');self.assertEqual(b['shot'],'S10')
        self.assertGreater(math.dist(a['figures']['Peter']['body'],b['figures']['Peter']['body']),1.0)
        self.assertGreater(math.dist(a['camera']['position'],b['camera']['position']),.5)

    def test_sea_calm_only_after_cue(self):
        f=next(b['at_frame'] for s in self.plan['shots'] if s['id']=='S10' for b in s['beats'] if b['label']=='water settles')
        self.assertEqual(self.track['frames'][f]['sea_calm'],1.0)
        self.assertLess(self.track['frames'][min(f+39,1439)]['sea_calm'],1.0)

    @unittest.skipIf(locked(),"no rendering while Marcus's production lock is on")
    def test_original_vtk_render_independent_contact_and_camera_spotcheck(self):
        # Actual original VTK picture path, independent of the bridge's
        # source-transformed state-only function. Sample the fragile shots.
        renderer=OriginalRender(self.plan,width=360,height=640)
        for sid in ('S07','S09','S10'):
            sh=next(x for x in self.plan['shots'] if x['id']==sid)
            f=(sh['start_frame']+sh['end_frame'])//2
            _,data=renderer.frame(f)
            exported=self.track['frames'][f]
            actual=renderer.camera.GetPosition()
            self.assertLess(math.dist(actual,exported['camera']['position']),1e-5)
            for actor in ('Jesus','Peter'):
                if exported['figures'][actor]['visible']:
                    self.assertLess(math.dist(data['joints'][actor]['right_hand'],
                                              exported['figures'][actor]['joints']['right_hand']),1e-5)

    @unittest.skipUnless(shutil.which('node'),'node missing')
    def test_real_javascript_scene_contract_executes_structurally(self):
        q=subprocess.run(['node',str(ROOT/'tests/native_bridge_runtime.js')],capture_output=True,text=True)
        self.assertEqual(q.returncode,0,q.stderr)
        self.assertIn('36 contract frames',q.stdout)

    def test_no_approval_or_narration_in_native_score(self):
        src=(self.out/'storm_score.js').read_text()
        self.assertIn('VO={lines:[], voEnd:DURATION}',src)
        self.assertNotIn('approved:true',src)
        self.assertIn("scene:'storm_native'",src)

    @unittest.skipUnless(shutil.which('node'),'node missing')
    def test_native_javascript_syntax_and_api_contract(self):
        for p in [ROOT/'native_three/storm_native.js',self.out/'storm_score.js',self.out/'storm_track.js']:
            q=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
            self.assertEqual(q.returncode,0,q.stderr)
        src=(ROOT/'native_three/storm_native.js').read_text()
        self.assertIn('SCENES.storm_native',src)
        self.assertIn('async build(env)',src)
        self.assertIn('frame(t,shot,cam)',src)
        self.assertIn('return {scene:world',src)

if __name__=='__main__':unittest.main()
