"""Build integrity tests for 3D preview reuse."""
from pathlib import Path
import hashlib, json, tempfile, sys, unittest
import yaml
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from preview_3d_pipeline import validate_renderer_provenance, sha256

ROOT=Path(__file__).resolve().parents[1]

class ProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.plan=yaml.safe_load((ROOT/'examples/pilot-storm/shotplan.yaml').read_text())
        self.source=ROOT/'scripts/vtk_story_renderer.py'

    def test_valid_build_record(self):
        with tempfile.TemporaryDirectory() as td:
            video=Path(td)/'test.mp4';video.write_bytes(b'not a valid video; only testing the hash contract')
            record={'status':'UNAPPROVED_3D_LAYOUT',
                    'video_sha256':sha256(video),'renderer_source_sha256':sha256(self.source),
                    'plan_data_sha256':hashlib.sha256(json.dumps(self.plan,sort_keys=True).encode()).hexdigest()}
            video.with_suffix('.mp4.build.json').write_text(json.dumps(record))
            self.assertEqual(validate_renderer_provenance(video,self.plan,self.source),record)

    def test_stale_or_tampered_video_is_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            video=Path(td)/'test.mp4';video.write_bytes(b'first')
            record={'status':'UNAPPROVED_3D_LAYOUT',
                    'video_sha256':sha256(video),'renderer_source_sha256':sha256(self.source),
                    'plan_data_sha256':hashlib.sha256(json.dumps(self.plan,sort_keys=True).encode()).hexdigest()}
            video.with_suffix('.mp4.build.json').write_text(json.dumps(record))
            video.write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError,'video_sha256'):
                validate_renderer_provenance(video,self.plan,self.source)
            video.write_bytes(b'first')
            record['renderer_source_sha256']='0'*64
            video.with_suffix('.mp4.build.json').write_text(json.dumps(record))
            with self.assertRaisesRegex(ValueError,'renderer_source_sha256'):
                validate_renderer_provenance(video,self.plan,self.source)

class CoordinateContractTests(unittest.TestCase):
    def test_round_trip(self):
        from coordinate_contract import canonical_to_yup, yup_to_canonical
        for position in [(0,0,0), (1,2,3), (-2.5,3.8,7.1)]:
            self.assertEqual(tuple(float(x) for x in position),
                             yup_to_canonical(canonical_to_yup(position)))

    def test_vertical_axis_maps_upward(self):
        from coordinate_contract import canonical_to_yup
        self.assertEqual(canonical_to_yup((0,0,1)),(0,1,0))
        self.assertEqual(canonical_to_yup((0,1,0)),(0,0,-1))

if __name__=='__main__':unittest.main()
