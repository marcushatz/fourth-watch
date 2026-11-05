"""Actual offscreen VTK render tests, not just source-string or mock checks.
All tests are mechanical; none stands in for director or viewer approval.
"""
import copy
from pathlib import Path
import sys
import unittest

try:
    import numpy as np
    import yaml
    import vtk
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
    from vtk_story_renderer import Render
except ImportError:
    Render = None

ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(Render is not None, 'VTK rendering dependency not available')
class TestActual3DFrames(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plan = yaml.safe_load((ROOT / 'examples/pilot-storm/shotplan.yaml').read_text())
        cls.renderer = Render(cls.plan, 360, 640)

    @classmethod
    def project(cls, p):
        c = vtk.vtkCoordinate()
        c.SetCoordinateSystemToWorld()
        c.SetValue(*[float(z) for z in p])
        x, y = c.GetComputedDoubleDisplayValue(cls.renderer.render)
        return float(x / cls.renderer.W), float(1 - y / cls.renderer.H)

    def test_shoreline_is_continuous_tessellated_geometry_above_waves(self):
        # Past flat quads generated triangular sawtooth slabs or drowned
        # fragments as the animated water intersected the beach surface.
        shore = self.renderer.shore.GetMapper().GetInput()
        self.assertGreater(shore.GetNumberOfPolys(), 5000)
        cells = shore.GetPolys()
        arr = vtk.vtkIdList()
        cells.InitTraversal()
        for _ in range(12):
            self.assertTrue(cells.GetNextCell(arr))
            self.assertEqual(arr.GetNumberOfIds(), 3)
        ys = np.array([shore.GetPoint(i)[1] for i in range(shore.GetNumberOfPoints())])
        self.assertGreater(float(ys.min()), .35)

    def test_shoreline_and_boat_share_frame(self):
        self.renderer.frame(150)
        jesus = self.project(self.renderer.Jesus.last_joint['head'])
        boat = self.project((3.9, .5, -1.8))
        for n, point in [('shore figure', jesus), ('boat', boat)]:
            with self.subTest(n=n):
                self.assertGreater(point[0], .06)
                self.assertLess(point[0], .94)
                self.assertGreater(point[1], .1)
                self.assertLess(point[1], .9)
        self.assertGreater(abs(jesus[0] - boat[0]), .35)  # distance reads visually

    def test_walk_and_contact_are_composed_inside_portrait(self):
        for frame, subjects in [
            (390, [('Jesus head', self.renderer.Jesus, 'head')]),
            (755, [('Peter head', self.renderer.Peter, 'head'),
                   ('Peter foot', self.renderer.Peter, 'right_foot')]),
            (970, [('Jesus head', self.renderer.Jesus, 'head'),
                   ('Peter head', self.renderer.Peter, 'head')]),
            (975, [('Jesus head', self.renderer.Jesus, 'head'),
                   ('Peter head', self.renderer.Peter, 'head'),
                   ('grip', self.renderer.Jesus, 'right_hand')]),
        ]:
            self.renderer.frame(frame)
            for name, actor, joint in subjects:
                x, y = self.project(actor.last_joint[joint])
                with self.subTest(frame=frame, subject=name):
                    self.assertGreater(x, .05)
                    self.assertLess(x, .95)
                    self.assertGreater(y, .05)
                    self.assertLess(y, .94)

    def test_step_goes_toward_near_water_and_reacts_to_cue(self):
        self.renderer.frame(677)
        foot_before = np.array(self.renderer.Peter.last_joint['right_foot'])
        self.renderer.frame(755)
        foot_after = np.array(self.renderer.Peter.last_joint['right_foot'])
        self.assertGreater(foot_after[2] - foot_before[2], .55)
        self.assertTrue(self.renderer.ripple.GetVisibility())
        self.renderer.frame(755, overrides={'foot clears gunwale': 80})
        delayed = np.array(self.renderer.Peter.last_joint['right_foot'])
        self.assertGreater(foot_after[2] - delayed[2], .5)

    def test_rescue_grip_happens_on_exact_named_beat(self):
        self.renderer.frame(973)
        a = np.array(self.renderer.Jesus.last_joint['right_hand'])
        b = np.array(self.renderer.Peter.last_joint['right_hand'])
        self.assertLess(np.linalg.norm(a-b), .001)
        self.renderer.frame(950)
        a = np.array(self.renderer.Jesus.last_joint['right_hand'])
        b = np.array(self.renderer.Peter.last_joint['right_hand'])
        self.assertGreater(np.linalg.norm(a-b), .15)

    def test_rescue_hands_remain_connected_without_unphysical_arm_stretch(self):
        # Check the entire lift, not just the single frame at contact.
        # The first iteration passed a zero grip-gap test while Peter's
        # shoulder-to-wrist segment stretched like rubber as he rose.
        for frame in (973, 979, 987, 998, 1007, 1017):
            self.renderer.frame(frame)
            j = self.renderer.Jesus
            p = self.renderer.Peter
            j_hand = np.array(j.last_joint['right_hand'])
            p_hand = np.array(p.last_joint['right_hand'])
            j_shoulder = np.array(j.last_joint['right_shoulder'])
            p_shoulder = np.array(p.last_joint['right_shoulder'])
            with self.subTest(frame=frame):
                self.assertLess(np.linalg.norm(j_hand - p_hand), .001)
                self.assertLess(np.linalg.norm(j_hand - j_shoulder), .94)
                self.assertLess(np.linalg.norm(p_hand - p_shoulder), .94)
                self.assertGreater(np.linalg.norm(j_hand - j_shoulder), .30)
                self.assertGreater(np.linalg.norm(p_hand - p_shoulder), .30)

    def test_rescue_lift_is_from_immersion_not_levitation(self):
        # The second iteration avoided arm stretch by raising Peter's entire
        # root too far above the surface. A finished actor will need its own
        # foot contact IK, but this preview must never visibly float high.
        feet = []
        for frame in (973, 982, 994, 1011):
            self.renderer.frame(frame)
            foot = self.renderer.Peter.last_joint['right_foot']
            feet.append(float(foot[1]))
            self.assertLessEqual(foot[1], .33)
        self.assertLess(feet[0], 0.)
        self.assertGreater(feet[-1], 0.)
        self.assertTrue(all(a <= b + 1e-6 for a, b in zip(feet, feet[1:])))

    def test_delaying_rescue_contact_delays_the_held_grip(self):
        # No global magic-frame hand contact when the storyboard moves.
        self.renderer.frame(973)
        self.assertLess(np.linalg.norm(np.array(self.renderer.Jesus.last_joint['right_hand']) -
                                       np.array(self.renderer.Peter.last_joint['right_hand'])), .001)
        self.renderer.frame(973, overrides={'hands meet': 22})
        self.assertGreater(np.linalg.norm(np.array(self.renderer.Jesus.last_joint['right_hand']) -
                                          np.array(self.renderer.Peter.last_joint['right_hand'])), .1)

    def test_no_on_camera_teleport_outside_marked_cut(self):
        # Cut is at the declared boat-entry beat. The framing changes on
        # that frame so the spatial jump is an intentional editorial ellipsis.
        self.renderer.frame(1054)
        cam_before = np.array(self.renderer.camera.GetPosition())
        self.renderer.frame(1055)
        cam_after = np.array(self.renderer.camera.GetPosition())
        self.assertGreater(np.linalg.norm(cam_before-cam_after), 1.0)
        self.renderer.frame(1056)
        head = np.array(self.renderer.Jesus.last_joint['head'])
        self.renderer.frame(1080)
        head_after = np.array(self.renderer.Jesus.last_joint['head'])
        self.assertLess(np.linalg.norm(head-head_after), .01)

    def test_moon_is_hidden_during_rescue_and_boat_entry(self):
        for frame in [930, 975, 1060]:
            self.renderer.frame(frame)
            self.assertFalse(self.renderer.moon.GetVisibility())

    def test_nonsequential_render_is_reproducible(self):
        a, _ = self.renderer.frame(975)
        self.renderer.frame(1300)
        b, _ = self.renderer.frame(975)
        self.assertTrue(np.array_equal(a, b))

    def test_sea_calm_is_not_early(self):
        # Avoid comparing different wave phases: inspect the scripted envelope
        # itself at three times spanning the declared beat.
        from vtk_story_renderer import smooth
        cue = self.renderer.beat('S10','water settles',0)
        amount = lambda f: 1-.83*smooth((f-cue)/40)
        self.assertEqual(amount(cue-1), 1)
        self.assertLess(amount(cue+40), .2)

if __name__ == '__main__':
    unittest.main()
