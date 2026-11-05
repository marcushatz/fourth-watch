import sys,unittest,tempfile,copy,yaml
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from preview_pipeline import execute
ROOT=Path(__file__).resolve().parents[1]

class PreviewPipelineTests(unittest.TestCase):
    def test_dry_run_no_video(self):
        with tempfile.TemporaryDirectory() as d:
            r=execute(ROOT/'examples/pilot-storm/shotplan.yaml',d,dry_run=True)
            self.assertEqual(len(r['commands']),6)
            self.assertFalse((Path(d)/'camera_sound_preview.mp4').exists())
            self.assertEqual(r['diagnostics']['shots'],12)
    def test_invalid_plan_refused_before_tools(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'bad.yaml';p.write_text('schema_version: bad\nshots: []\n')
            with self.assertRaisesRegex(ValueError,'Invalid shotplan'):execute(p,Path(d)/'out')

if __name__=='__main__':unittest.main()
