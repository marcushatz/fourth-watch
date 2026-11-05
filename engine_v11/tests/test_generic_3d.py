"""Independent second-story proof: same geometry/rig/camera engine, different JSON."""
from pathlib import Path
import json, sys, unittest
try:
    import numpy as np
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
    from generic_3d_scene import GenericScene,check_scene,interpolate,GenericSheep
except ImportError:
    GenericScene=None

ROOT=Path(__file__).resolve().parents[1]

@unittest.skipUnless(GenericScene is not None,'VTK generic renderer unavailable')
class Generic3DTests(unittest.TestCase):
    def load(self,name):return json.loads((ROOT/'examples/generic-3d'/name).read_text())

    def test_two_distinct_story_configurations_are_valid(self):
        for name in ['naaman.json','psalm23.json']:
            self.assertEqual(check_scene(self.load(name)),[],name)

    def test_invalid_approval_and_missing_source_rejected(self):
        cfg=self.load('naaman.json');cfg['status']='APPROVED';cfg['biblical_reference']=''
        self.assertGreaterEqual(len(check_scene(cfg)),2)

    def test_naaman_repeated_washing_is_actual_vertical_motion(self):
        cfg=self.load('naaman.json')
        # Seven distinct downward motion targets, as recorded in 2 Kings 5:14.
        keys=cfg['actors'][0]['keys']
        self.assertEqual(sum(k.get('sink',0)>=.9 for k in keys),7)
        sc=GenericScene(cfg)
        sc.frame(3.25);down=np.asarray(sc.actors['naaman'].last_joint['head'])
        sc.frame(3.55);up=np.asarray(sc.actors['naaman'].last_joint['head'])
        self.assertGreater(up[1]-down[1],.8)

    def test_psalm_23_uses_sheep_not_second_human(self):
        cfg=self.load('psalm23.json');sc=GenericScene(cfg)
        self.assertIsInstance(sc.actors['follower'],GenericSheep)
        img=sc.frame(4.1)
        self.assertEqual(img.shape,(640,360,3))

    def test_camera_cuts_are_data_driven(self):
        sc=GenericScene(self.load('naaman.json'))
        sc.camera_state(2.9);a=np.array(sc.camera.GetPosition())
        sc.camera_state(3.0);b=np.array(sc.camera.GetPosition())
        self.assertGreater(np.linalg.norm(a-b),2)

    def test_generic_renderer_is_deterministic(self):
        sc=GenericScene(self.load('psalm23.json'))
        a=sc.frame(5.5);sc.frame(8.2);b=sc.frame(5.5)
        self.assertTrue(np.array_equal(a,b))

if __name__=='__main__':unittest.main()
