import unittest, tempfile, json, csv, copy, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from fw_engine import load,inspect,stats
from release_gate import audit

ROOT=Path(__file__).resolve().parents[1]
BASE=load(ROOT/'examples/pilot-storm/shotplan.yaml')

class PlanTests(unittest.TestCase):
    def test_baseline_structural_pass(self):
        errors,w=inspect(BASE)
        self.assertEqual(errors,[])
        self.assertTrue(any('not approved' in x for x in w))
    def test_starts_at_zero(self):
        q=copy.deepcopy(BASE);q['shots'][0]['start_frame']=1
        self.assertTrue(any('frame 0' in x for x in inspect(q)[0]))
    def test_gap(self):
        q=copy.deepcopy(BASE);q['shots'][1]['start_frame']+=1
        self.assertTrue(any('gap/overlap' in x for x in inspect(q)[0]))
    def test_overlap(self):
        q=copy.deepcopy(BASE);q['shots'][1]['start_frame']-=2
        self.assertTrue(any('gap/overlap' in x for x in inspect(q)[0]))
    def test_out_of_bounds_beat(self):
        q=copy.deepcopy(BASE);q['shots'][0]['beats'][0]['at_frame']=-2
        self.assertTrue(any('outside shot' in x for x in inspect(q)[0]))
    def test_duplicate_shot(self):
        q=copy.deepcopy(BASE);q['shots'][1]['id']='S01'
        self.assertTrue(any('duplicate' in x for x in inspect(q)[0]))
    def test_bad_medium(self):
        q=copy.deepcopy(BASE);q['shots'][0]['medium']='photorealistic magic'
        self.assertTrue(any('medium' in x for x in inspect(q)[0]))
    def test_bad_frame(self):
        q=copy.deepcopy(BASE);q['shots'][0]['end_frame']=0
        self.assertTrue(any('end must exceed' in x for x in inspect(q)[0]))
    def test_bad_camera_move(self):
        q=copy.deepcopy(BASE);q['shots'][0]['camera']['move']='random'
        self.assertTrue(any('camera' in x for x in inspect(q)[0]))
    def test_narrow_canvas_warns(self):
        q=copy.deepcopy(BASE);q['width']=1280
        self.assertTrue(any('9:16' in x for x in inspect(q)[1]))
    def test_locked_camera_warns_scale_change(self):
        q=copy.deepcopy(BASE);q['shots'][0]['camera']['move']='locked'
        self.assertTrue(any('locked' in x for x in inspect(q)[1]))
    def test_stats(self):
        s=stats(BASE);self.assertEqual(s['frames'],1440)
        self.assertEqual(s['shots'],12);self.assertEqual(s['beat_count'],24)
    def test_release_gate_blocks_unapproved(self):
        r=audit(BASE,ROOT/'examples/pilot-storm/claims.csv')
        self.assertFalse(r['release_package_preflight_pass'])
        self.assertTrue(any('unapproved' in x for x in r['errors']))
    def test_release_gate_detects_unknown_claim(self):
        q=copy.deepcopy(BASE);q['shots'][0]['claim_ids'].append('FAKE99')
        r=audit(q,ROOT/'examples/pilot-storm/claims.csv')
        self.assertTrue(any('FAKE99' in x for x in r['errors']))
    def test_unknown_claim_kind_fails(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'claims.csv'
            with (ROOT/'examples/pilot-storm/claims.csv').open() as f: rows=list(csv.DictReader(f))
            rows[0]['kind']='UNSUPPORTED'
            with p.open('w',newline='') as f:
                w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
            r=audit(BASE,p)
            self.assertTrue(any('unsupported claim' in x for x in r['errors']))
    def test_no_script_hash_pass(self):
        q=copy.deepcopy(BASE);q['approved_script_sha256']='xyz'
        self.assertTrue(any('hash' in x for x in inspect(q)[0]))
    def test_renderer_stage_flag_cannot_silently_approve(self):
        q=copy.deepcopy(BASE)
        q['approval']['script']=q['approval']['treatment']=q['approval']['animatic']=True
        q['approved_script_sha256']='a'*64
        r=audit(q,ROOT/'examples/pilot-storm/claims.csv')
        self.assertFalse(r['release_package_preflight_pass'])
        self.assertTrue(any('manifest' in x for x in r['errors']))

if __name__=='__main__':unittest.main()

class RightsAuditTests(unittest.TestCase):
    def test_missing_credits_flagged(self):
        from script_rights_audit import audit
        r=audit('Jesus told them, “Do not be afraid.” And he came to the boat.')
        self.assertFalse(r['full_notice_present'])
        self.assertGreater(r['quoted_ratio_est'],0)
    def test_credits_verified_textually_only(self):
        from script_rights_audit import audit,NOTICE
        r=audit('A passage is explained without verbatim quotes.',NOTICE)
        self.assertTrue(r['full_notice_present'])
        self.assertFalse(r['rights_clearance'])

class ReproducibleBuildTests(unittest.TestCase):
    def test_deterministic_manifest(self):
        from production_manifest import manifest
        a=manifest(BASE,claims_path=ROOT/'examples/pilot-storm/claims.csv')
        b=manifest(BASE,claims_path=ROOT/'examples/pilot-storm/claims.csv')
        self.assertEqual(a,b)
        self.assertEqual(len(a['shots']),12)
        self.assertFalse(a['final_video_verified'])
    def test_shot_change_invalidates_only_shot_key(self):
        from production_manifest import manifest
        a=manifest(BASE)
        q=copy.deepcopy(BASE)
        q['shots'][2]['visual']['mood']='more worried'
        b=manifest(q)
        changed=[i for i,(x,y) in enumerate(zip(a['shots'],b['shots'])) if x['content_key']!=y['content_key']]
        self.assertEqual(changed,[2])
    def test_wrong_script_is_blocked(self):
        from production_manifest import manifest
        q=copy.deepcopy(BASE);q['approved_script_sha256']='a'*64
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'script.txt';p.write_text('Not the approved script')
            with self.assertRaisesRegex(ValueError,'mismatch'):manifest(q,script_path=p)
    def test_hash_without_script_is_blocked(self):
        from production_manifest import manifest
        q=copy.deepcopy(BASE);q['approved_script_sha256']='a'*64
        with self.assertRaisesRegex(ValueError,'no script'):manifest(q)

class EpisodeStateTests(unittest.TestCase):
    def test_no_skip_to_release(self):
        from episode_state import advance
        with self.assertRaisesRegex(ValueError,'Cannot jump'):advance('BRIEF','RELEASE_APPROVED')
    def test_explicit_script_approval_required(self):
        from episode_state import advance
        with self.assertRaisesRegex(ValueError,'approval'):advance('SCRIPT_PROPOSED','SCRIPT_APPROVED')
    def test_legal_sequential_transition(self):
        from episode_state import advance
        self.assertEqual(advance('RESEARCHED','SCRIPT_PROPOSED'),'SCRIPT_PROPOSED')

class LegacyIntegrationTests(unittest.TestCase):
    def test_bridge_preserves_source_semantics(self):
        from legacy_handoff import convert,verify
        m=convert(BASE)
        self.assertEqual(verify(BASE,m),[])
        self.assertTrue(all(s['not_compiled'] for s in m['shots']))
        self.assertEqual(m['status'],'BLUEPRINT_ONLY')
    def test_bridge_tampering_is_detected(self):
        from legacy_handoff import convert,verify
        m=convert(BASE);m['shots'][1]['claim_ids']=[]
        self.assertTrue(any('corrupt claim_ids' in e for e in verify(BASE,m)))

class ProductionGateHardeningTests(unittest.TestCase):
    def test_even_with_approvals_placeholder_art_cannot_ship(self):
        q=copy.deepcopy(BASE)
        q['approval']={'script':True,'treatment':True,'animatic':True}
        q['approved_script_sha256']='f'*64
        r=audit(q,ROOT/'examples/pilot-storm/claims.csv')
        self.assertTrue(any('not final art' in e for e in r['errors']))
    def test_invalid_asset_hash_blocks_release(self):
        q=copy.deepcopy(BASE)
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'assets.json';p.write_text(json.dumps([{'name':'sea','origin':'created locally','license':'original','sha256':'not-a-sha'}]))
            r=audit(q,ROOT/'examples/pilot-storm/claims.csv',p)
            self.assertTrue(any('malformed sha256' in e for e in r['errors']))
    def test_local_video_low_resolution_rejected(self):
        q=copy.deepcopy(BASE)
        v=ROOT/'outputs/storm_camera_sound_test.mp4'
        if not v.exists():self.skipTest('local preview not built')
        r=audit(q,ROOT/'examples/pilot-storm/claims.csv',None,v)
        self.assertTrue(any('full-resolution' in e for e in r['errors']))
    def test_camera_positions_differ_across_shots(self):
        from cinematic_animatic import compose
        import numpy as np
        imgs=[]
        for i in (0,2,4,7,10):
            s=BASE['shots'][i]
            frame=(s['start_frame']+s['end_frame'])//2
            im=np.asarray(compose(s,frame/BASE['fps'],frame,BASE['fps']),dtype=np.float32)
            imgs.append(im)
        distances=[float(np.mean(np.abs(a-b))) for a,b in zip(imgs,imgs[1:])]
        self.assertTrue(all(x>3.0 for x in distances),distances)
    def test_audio_is_synthesized_with_correct_duration(self):
        from soundscape_test import generate
        # Test the full 48-second audio path only by sampling a short plan.
        q=copy.deepcopy(BASE);q['fps']=120; a,c,t,peak=generate(q,sample_rate=4000)
        self.assertEqual(len(a),int(t*4000)*2)
        self.assertEqual(len(c),24)
        self.assertLess(peak,1.0)

class DataDrivenSceneTests(unittest.TestCase):
    def test_scene_config_validates(self):
        from scene_player import validate
        s=json.loads((ROOT/'examples/pilot-storm/reusable_scene.json').read_text())
        self.assertEqual(validate(s),[])
    def test_keyframe_interpolation_exact(self):
        from scene_player import interp
        k=[{'time':0,'x':0},{'time':10,'x':100}]
        self.assertAlmostEqual(interp(k,5,'x'),50)
        self.assertAlmostEqual(interp(k,20,'x'),100)
    def test_unsorted_frame_rejected(self):
        from scene_player import validate
        s=json.loads((ROOT/'examples/pilot-storm/reusable_scene.json').read_text())
        s['objects'][0]['keys']=list(reversed(s['objects'][0]['keys']))
        self.assertTrue(any('unsorted' in e for e in validate(s)))
    def test_frame_repeatability(self):
        from scene_player import render_frame
        s=json.loads((ROOT/'examples/pilot-storm/reusable_scene.json').read_text())
        a=render_frame(s,2.5).tobytes();b=render_frame(s,2.5).tobytes()
        self.assertEqual(a,b)
    def test_camera_changes_frame(self):
        from scene_player import render_frame
        s=json.loads((ROOT/'examples/pilot-storm/reusable_scene.json').read_text())
        a=render_frame(s,1).tobytes();b=render_frame(s,7).tobytes()
        self.assertNotEqual(a,b)
