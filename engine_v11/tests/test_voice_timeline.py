import sys,unittest,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from fw_engine import load
from voice_timeline import align, AlignmentError, captions, to_srt
BASE=load(Path(__file__).resolve().parents[1]/'examples/pilot-storm/shotplan.yaml')

def timed(plan=BASE):
    from voice_timeline import tokens
    rows=[]
    for s in plan['shots']:
        ts=tokens(s['narration']);dur=(s['end_frame']-s['start_frame'])/plan['fps'];start=s['start_frame']/plan['fps']
        for i,tok in enumerate(ts):
            a=start+dur*(i+.05)/len(ts);b=start+dur*(i+.88)/len(ts)
            rows.append({'word':tok,'start':a,'end':b})
    return {'fps':plan['fps'],'words':rows}

class VoiceAlignmentTests(unittest.TestCase):
    def test_exact_full_script_passes(self):
        r=align(BASE,timed());self.assertEqual(len(r['shots']),12)
    def test_changed_word_fails(self):
        t=timed();t['words'][4]['word']='impossible'
        with self.assertRaisesRegex(AlignmentError,'mismatch'):align(BASE,t)
    def test_omitted_word_fails(self):
        t=timed();del t['words'][4]
        with self.assertRaisesRegex(AlignmentError,'mismatch'):align(BASE,t)
    def test_reordered_word_fails(self):
        t=timed();t['words'][2]['word'],t['words'][3]['word']=t['words'][3]['word'],t['words'][2]['word']
        with self.assertRaisesRegex(AlignmentError,'mismatch'):align(BASE,t)
    def test_shifted_voice_fails(self):
        t=timed();
        for w in t['words']:w['start']+=10;w['end']+=10
        with self.assertRaisesRegex(AlignmentError,'exceeds shot'):align(BASE,t)
    def test_overlapping_words_fail(self):
        t=timed();t['words'][1]['start']=t['words'][0]['start']
        with self.assertRaisesRegex(AlignmentError,'overlaps'):align(BASE,t)
    def test_wrong_fps_fails(self):
        t=timed();t['fps']=24
        with self.assertRaisesRegex(AlignmentError,'fps mismatch'):align(BASE,t)
    def test_subtitle_format(self):
        t=timed();c=captions(t);s=to_srt(c)
        self.assertGreater(len(c),10);self.assertIn('-->',s)
    def test_no_empty_words(self):
        t=timed();t['words'][0]['word']=''
        with self.assertRaisesRegex(AlignmentError,'one spoken token'):align(BASE,t)

if __name__=='__main__':unittest.main()
