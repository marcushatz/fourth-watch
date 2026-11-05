"""Cold-viewer form must not leak expected narration into the visible page."""
from pathlib import Path
import sys,tempfile,unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from build_cold_review import make

class BlindReviewTests(unittest.TestCase):
    def test_visual_review_has_no_story_spoilers_in_visible_text(self):
        with tempfile.TemporaryDirectory() as td:
            v=Path(td)/'sample.mp4';v.write_bytes(b'dummy')
            o=Path(td)/'review.html'
            result=make(v,o)
            page=o.read_text()
            # Strip embedded base64 (random characters can form keywords by chance)
            prefix=page.split('data:video/mp4;base64,')[0]
            suffix=page.split('</video>')[-1]
            visible=prefix+suffix
            for text in ['Peter','Jesus','Mark 6:52','Matthew','T31','S09']:
                self.assertNotIn(text,visible)
            self.assertIn('Which visual moment was hard',page)
            self.assertIn('Export feedback as JSON',page)
            self.assertTrue(result['unprimed'])

    def test_feedback_never_requests_network(self):
        with tempfile.TemporaryDirectory() as td:
            v=Path(td)/'sample.mp4';v.write_bytes(b'dummy')
            o=Path(td)/'review.html';make(v,o)
            text=o.read_text().split('</video>')[-1]
            for forbidden in ['fetch(', 'XMLHttpRequest(', 'navigator.sendBeacon(', '<form action=']:
                self.assertNotIn(forbidden,text)
            self.assertIn('URL.createObjectURL',text)

if __name__=='__main__':unittest.main()
