"""The per-shot record: keys, QA mapping and paid-route drafts. All free: no Higgsfield call, no credits."""
import ast, copy, hashlib, importlib.util, json, os, shutil, subprocess, sys, tempfile, unittest
from pathlib import Path

ENGINE=Path(__file__).resolve().parents[1]
REPO=ENGINE.parent
sys.path.insert(0,str(ENGINE/'scripts'))
from fw_engine import load
import production_manifest as pm

FIXTURE=ENGINE/'examples/route-qa-fixture'
SCRIPT=ENGINE/'scripts/production_manifest.py'
REQUEST_TOOL=REPO/'tools/generation_request.py'
GATE_TOOL=REPO/'tools/generation_gate.py'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class Case(unittest.TestCase):
    def setUp(self):
        tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup)
        self.dir=Path(tmp.name)/'episode'
        shutil.copytree(FIXTURE,self.dir,ignore=shutil.ignore_patterns('expected'))
        self.plan=load(self.dir/'shotplan.yaml')

    def build(self,plan=None,**extra):
        args=dict(asset_manifest=self.dir/'assets.json',renderers_path=self.dir/'renderers.json',words_path=self.dir/'words.json')
        args.update(extra)
        return pm.manifest(plan or self.plan,**args)

    def keys(self,m):
        return {s['id']:s['content_key'] for s in m['shots']}

    def changed(self,a,b):
        return sorted(k for k,v in self.keys(a).items() if self.keys(b)[k]!=v)

    def rewrite_asset(self,name,text):
        """Change an asset the honest way: new bytes, and its recorded hash updated to match."""
        path=self.dir/'assets'/f'{name}.svg'
        path.write_text(text)
        items=json.loads((self.dir/'assets.json').read_text())
        for item in items:
            if item['name']==name:item['sha256']=sha(path)
        (self.dir/'assets.json').write_text(json.dumps(items,indent=2)+'\n')

    def shot(self,m,sid):
        return next(s for s in m['shots'] if s['id']==sid)

    def run_qa(self,detected=None,previous=None,plan=None):
        path=self.dir/'shots.json'
        if detected is not None:path.write_text(json.dumps(detected))
        m=self.build(plan)
        if previous:pm.carry_forward(m,previous)
        pm.apply_qa(m,plan or self.plan,path)
        return m


class ShotKeyTests(Case):
    def test_one_asset_change_alters_only_the_shots_using_it(self):
        before=self.build()
        self.rewrite_asset('boat_sprite','<svg>a different boat</svg>')
        self.assertEqual(self.changed(before,self.build()),['S01','S03'])

    def test_the_other_asset_changes_a_different_set(self):
        before=self.build()
        self.rewrite_asset('sea_plate','<svg>a different sea</svg>')
        self.assertEqual(self.changed(before,self.build()),['S01','S02'])

    def test_an_asset_file_edited_without_updating_its_hash_still_changes_the_key(self):
        before=self.build()
        (self.dir/'assets/boat_sprite.svg').write_text('<svg>edited in place</svg>')
        after=self.build()
        self.assertEqual(self.changed(before,after),['S01','S03'])
        self.assertTrue(any('boat_sprite' in w for w in after['warnings']))

    def test_renderer_change_alters_only_shots_on_that_route(self):
        before=self.build()
        (self.dir/'renderers/higgsedit.jsx').write_text('// a changed renderer\n')
        self.assertEqual(self.changed(before,self.build()),['S02'])

    def test_a_missing_renderer_file_fails(self):
        (self.dir/'renderers/diorama.js').unlink()
        with self.assertRaisesRegex(ValueError,'renderer'):self.build()

    def test_a_route_with_no_listed_renderer_fails_when_renderers_are_given(self):
        (self.dir/'renderers.json').write_text(json.dumps({'film27_diorama':['renderers/diorama.js']}))
        with self.assertRaisesRegex(ValueError,'higgsedit'):self.build()

    def test_word_timing_change_alters_only_the_shot_speaking_it(self):
        before=self.build()
        words=json.loads((self.dir/'words.json').read_text())
        target=next(w for w in words['words'] if 4<=w['start']<7)
        target['end']+=0.01
        (self.dir/'words.json').write_text(json.dumps(words))
        self.assertEqual(self.changed(before,self.build()),['S02'])

    def test_real_word_file_shapes_are_keyed_the_same(self):
        rows=json.loads((self.dir/'words.json').read_text())['words']
        expected=self.keys(self.build())
        short=self.dir/'short.json';short.write_text(json.dumps([{'w':r['word'],'s':r['start'],'e':r['end']} for r in rows]))
        bare=self.dir/'bare.json';bare.write_text(json.dumps(rows))
        self.assertEqual(self.keys(self.build(words_path=short)),expected)
        self.assertEqual(self.keys(self.build(words_path=bare)),expected)

    def test_narrated_shot_with_no_timed_words_warns(self):
        rows=json.loads((self.dir/'words.json').read_text())
        rows['words']=[w for w in rows['words'] if not 4<=w['start']<7]
        (self.dir/'words.json').write_text(json.dumps(rows))
        self.assertTrue(any('S02' in w and 'word' in w for w in self.build()['warnings']))

    def test_route_and_assets_are_on_the_record(self):
        m=self.build()
        s=self.shot(m,'S01')
        self.assertEqual(s['route'],'film27_diorama')
        self.assertEqual(s['assets'],['sea_plate','boat_sprite'])
        self.assertEqual(s['inputs']['assets']['sea_plate'],sha(self.dir/'assets/sea_plate.svg'))
        self.assertTrue(self.shot(m,'S04')['paid'])
        self.assertFalse(self.shot(m,'S01')['paid'])

    def test_unknown_route_is_refused(self):
        plan=copy.deepcopy(self.plan);plan['shots'][0]['route']='some_new_tool'
        with self.assertRaisesRegex(ValueError,'route'):self.build(plan)

    def test_unknown_asset_name_is_refused(self):
        plan=copy.deepcopy(self.plan);plan['shots'][0]['assets']=['not_listed']
        with self.assertRaisesRegex(ValueError,'not_listed'):self.build(plan)

    def test_plan_without_new_fields_keeps_its_old_keys(self):
        plan=load(ENGINE/'examples/pilot-storm/shotplan.yaml')
        m=pm.manifest(plan)
        shot=plan['shots'][0]
        old=hashlib.sha256(pm.canon({**m['global_inputs'],'shot':shot})).hexdigest()
        self.assertEqual(m['shots'][0]['content_key'],old)

    def test_plan_that_declares_no_assets_stays_conservative(self):
        plan=load(ENGINE/'examples/pilot-storm/shotplan.yaml')
        a=pm.manifest(plan,asset_manifest=self.dir/'assets.json')
        self.rewrite_asset('sea_plate','<svg>changed</svg>')
        b=pm.manifest(plan,asset_manifest=self.dir/'assets.json')
        self.assertEqual(len(self.changed(a,b)),len(plan['shots']))


class QaMappingTests(Case):
    def test_one_dead_shot_flags_that_shot_id(self):
        m=self.run_qa()
        self.assertEqual(self.shot(m,'S03')['build_status'],'DEFECT')
        self.assertEqual([d['kind'] for d in self.shot(m,'S03')['defects']],['dead_shot'])
        self.assertEqual(self.shot(m,'S01')['build_status'],'QA_CLEAN')
        self.assertEqual(self.shot(m,'S02')['build_status'],'QA_CLEAN')
        self.assertEqual(self.shot(m,'S01')['defects'],[])
        self.assertIn('S03',m['qa']['defect_shots'])
        self.assertNotIn('S01',m['qa']['defect_shots'])

    def test_detected_shots_map_to_plan_frames(self):
        qa=self.shot(self.run_qa(),'S02')['qa']
        self.assertEqual([d['index'] for d in qa['detected']],[1])
        self.assertEqual(qa['detected'][0]['overlap_frames'],90)
        self.assertEqual(qa['coverage'],1.0)

    def test_film_ending_early_flags_the_shots_not_in_the_cut(self):
        m=self.run_qa()
        for sid in ('S04','S05'):
            self.assertEqual(self.shot(m,sid)['build_status'],'DEFECT')
            self.assertEqual([d['kind'] for d in self.shot(m,sid)['defects']],['not_in_cut'])

    def test_a_planned_cut_missing_from_the_film_is_flagged_on_the_shot_before_it(self):
        one_long={'t0':0.0,'len':7.0,'camera_pct':6.0,'own_motion_pct':3.0,'net_change':9.0}
        m=self.run_qa([one_long])
        self.assertEqual([d['kind'] for d in self.shot(m,'S01')['defects']],['cut_missing'])
        self.assertEqual(self.shot(m,'S02')['build_status'],'QA_CLEAN')

    def test_a_dissolve_is_not_a_missing_cut(self):
        plan=copy.deepcopy(self.plan);plan['shots'][0]['transition_out']='dissolve'
        one_long={'t0':0.0,'len':7.0,'camera_pct':6.0,'own_motion_pct':3.0,'net_change':9.0}
        self.assertEqual(self.shot(self.run_qa([one_long],plan=plan),'S01')['defects'],[])

    def test_a_shot_where_the_light_changes_is_not_dead(self):
        lit={'t0':0.0,'len':4.0,'camera_pct':0.0,'own_motion_pct':0.0,'net_change':9.0}
        self.assertEqual(self.shot(self.run_qa([lit]),'S01')['build_status'],'QA_CLEAN')

    def test_picture_past_the_end_of_the_plan_is_reported(self):
        detected=json.loads((self.dir/'shots.json').read_text())+[{'t0':17.5,'len':3.0,'camera_pct':5,'own_motion_pct':5,'net_change':5}]
        m=self.run_qa(detected)
        self.assertEqual(m['qa']['unmapped_detected'],[3])
        self.assertTrue(any('past the plan' in w for w in m['warnings']))

    def test_free_defect_loops_and_paid_defect_stops(self):
        m=self.run_qa()
        free=self.shot(m,'S03')['next_action']
        paid=self.shot(m,'S04')['next_action']
        self.assertIn('free',free.lower());self.assertIn('film27_diorama',free)
        self.assertIn('Marcus',paid);self.assertIn('stop',paid.lower())

    def test_empty_or_malformed_qa_is_refused(self):
        for bad in ([],{'shots':[]},[{'t0':0}],[{'t0':'x','len':1}],[{'t0':0,'len':-1}]):
            with self.subTest(bad=bad):
                (self.dir/'shots.json').write_text(json.dumps(bad))
                with self.assertRaisesRegex(ValueError,'QA'):pm.apply_qa(self.build(),self.plan,self.dir/'shots.json')

    def test_a_real_film_measured_by_fw_check_flags_the_frozen_shot(self):
        if not shutil.which('ffmpeg'):self.skipTest('ffmpeg missing')
        try:
            import cv2,numpy  # noqa: F401
        except ImportError:self.skipTest('OpenCV missing')
        spec=importlib.util.spec_from_file_location('fw_check_real',REPO/'fw_check.py')
        check=importlib.util.module_from_spec(spec);spec.loader.exec_module(check)
        film=self.dir/'film.mp4'
        # Moving, frozen, moving: the same order as S01, S02, S03 cut to the plan.
        sources=['testsrc2=s=270x480:r=30','smptebars=s=270x480:r=30','mandelbrot=s=270x480:r=30']
        cmd=['ffmpeg','-v','error','-y']
        for src,d in zip(sources,(4,3,4)):cmd+=['-f','lavfi','-t',str(d),'-i',src]
        cmd+=['-filter_complex','[0:v][1:v][2:v]concat=n=3:v=1:a=0','-pix_fmt','yuv420p',str(film)]
        subprocess.run(cmd,check=True)
        shots,_,_=check.detect_shots(str(film))
        detected=[{'t0':round(a,2),'len':round(b-a,2),'camera_pct':round(c,1),'own_motion_pct':round(o,1),'net_change':round(n,1)} for a,b,c,o,n in shots]
        m=self.run_qa(detected)
        self.assertEqual(self.shot(m,'S02')['build_status'],'DEFECT')
        self.assertEqual([d['kind'] for d in self.shot(m,'S02')['defects']],['dead_shot'])
        self.assertEqual(self.shot(m,'S01')['build_status'],'QA_CLEAN')
        self.assertEqual(self.shot(m,'S03')['build_status'],'QA_CLEAN')


class LivingRecordTests(Case):
    def previous(self):
        return json.loads(json.dumps(self.run_qa()))

    def test_unchanged_shot_keeps_its_status_and_changed_shot_goes_stale(self):
        old=self.previous()
        self.rewrite_asset('sea_plate','<svg>changed</svg>')
        m=self.build();pm.carry_forward(m,old)
        self.assertEqual(self.shot(m,'S01')['build_status'],'STALE')
        self.assertIn('sea_plate',self.shot(m,'S01')['next_action'])
        self.assertEqual(self.shot(m,'S02')['build_status'],'STALE')
        self.assertEqual(self.shot(m,'S03')['build_status'],'DEFECT')

    def test_the_same_qa_file_cannot_clear_a_stale_shot(self):
        old=self.previous()
        self.rewrite_asset('sea_plate','<svg>changed</svg>')
        m=self.run_qa(previous=old)
        self.assertEqual(self.shot(m,'S01')['build_status'],'STALE')

    def test_a_new_qa_file_can_clear_a_stale_shot(self):
        old=self.previous()
        self.rewrite_asset('sea_plate','<svg>changed</svg>')
        detected=json.loads((self.dir/'shots.json').read_text())
        detected[0]['net_change']=11.5
        m=self.run_qa(detected,previous=old)
        self.assertEqual(self.shot(m,'S01')['build_status'],'QA_CLEAN')

    def test_a_forged_previous_record_cannot_raise_film_flags(self):
        old=self.previous()
        old.update(final_video_verified=True,release_approved=True,approvals={'script':True,'treatment':True,'animatic':True})
        m=self.build();pm.carry_forward(m,old)
        self.assertIs(m['final_video_verified'],False)
        self.assertIs(m['release_approved'],False)
        self.assertFalse(any(m['approvals'].values()))

    def test_a_forged_status_is_ignored(self):
        old=self.previous()
        self.shot(old,'S01')['build_status']='RELEASED'
        m=self.build();pm.carry_forward(m,old)
        self.assertEqual(self.shot(m,'S01')['build_status'],'NOT_BUILT')


class PaidRouteTests(Case):
    def gate_root(self):
        root=self.dir/'gate_root'
        (root/'production/approvals/requests').mkdir(parents=True)
        return root

    def cli(self,*extra):
        cmd=[sys.executable,str(SCRIPT),str(self.dir/'shotplan.yaml'),'--assets',str(self.dir/'assets.json'),
             '--renderers',str(self.dir/'renderers.json'),'--words',str(self.dir/'words.json'),*extra]
        return subprocess.run(cmd,capture_output=True,text=True)

    def draft(self):
        root=self.gate_root()
        folder=root/'production/approvals/requests'
        r=self.cli('--qa',str(self.dir/'shots.json'),'--requests-dir',str(folder),'--out',str(self.dir/'manifest.json'))
        self.assertEqual(r.returncode,0,r.stderr)
        return root,folder,json.loads((self.dir/'manifest.json').read_text())

    def gate(self,root,request,item):
        env={**os.environ,'FW_GATE_ROOT':str(root)}
        event={'tool_name':'mcp__Higgsfield__'+item['tool'],'session_id':'test','tool_input':item['input']}
        return subprocess.run([sys.executable,str(GATE_TOOL)],input=json.dumps(event),text=True,capture_output=True,env=env)

    def test_drafted_request_passes_show_and_the_gate_blocks_it(self):
        root,folder,m=self.draft()
        path=folder/(self.shot(m,'S04')['request']['file'])
        env={**os.environ,'FW_GATE_ROOT':str(root)}
        shown=subprocess.run([sys.executable,str(REQUEST_TOOL),'show',str(path),'--balance','100'],capture_output=True,text=True,env=env)
        self.assertEqual(shown.returncode,0,shown.stderr)
        request=json.loads(path.read_text())
        self.assertIn(request['request_id'],shown.stdout)
        self.assertIn('2.75',shown.stdout)
        self.assertIn('Fingerprint:',shown.stdout)
        blocked=self.gate(root,request,request['items'][0])
        self.assertEqual(blocked.returncode,2,blocked.stderr)
        self.assertIn('no approval is on file',blocked.stderr)

    def test_drafting_never_creates_an_approval(self):
        root,_,_=self.draft()
        self.assertFalse((root/'production/approvals/current.json').exists())

    def test_a_job_with_no_quote_drafts_a_price_check_and_invents_no_price(self):
        root,folder,m=self.draft()
        request=json.loads((folder/self.shot(m,'S05')['request']['file']).read_text())
        item=request['items'][0]
        self.assertEqual(item['kind'],'cost_check')
        self.assertNotIn('quoted_credits',item)
        self.assertIs(item['input']['params']['get_cost'],True)
        self.assertEqual(self.gate(root,request,item).returncode,2)
        shown=subprocess.run([sys.executable,str(REQUEST_TOOL),'show',str(folder/self.shot(m,'S05')['request']['file'])],
                             capture_output=True,text=True,env={**os.environ,'FW_GATE_ROOT':str(root)})
        self.assertEqual(shown.returncode,0,shown.stderr)

    def test_only_paid_shots_get_a_request(self):
        _,folder,m=self.draft()
        self.assertEqual(sorted(p.name for p in folder.iterdir()),
                         sorted(self.shot(m,s)['request']['file'] for s in ('S04','S05')))
        self.assertNotIn('request',self.shot(m,'S01'))

    def test_a_draft_says_it_is_not_approved_and_names_the_open_gates(self):
        _,folder,m=self.draft()
        request=json.loads((folder/self.shot(m,'S04')['request']['file']).read_text())
        self.assertEqual(request['status'],'DRAFT_NOT_APPROVED')
        self.assertEqual(request['project'],'fourth-watch')
        for gate in ('script','treatment','animatic'):self.assertIn(gate,request['purpose'])
        self.assertIn('S04',request['purpose'])

    def test_a_clean_paid_shot_gets_no_new_draft(self):
        detected=[{'t0':0,'len':17,'camera_pct':5,'own_motion_pct':5,'net_change':5}]
        plan=copy.deepcopy(self.plan)
        for s in plan['shots']:s['transition_out']='dissolve'
        (self.dir/'all.json').write_text(json.dumps(detected))
        m=self.build(plan);pm.apply_qa(m,plan,self.dir/'all.json')
        self.assertEqual(pm.draft_requests(m,plan,self.dir/'requests'),[])

    def test_a_paid_shot_with_no_job_details_gets_no_draft(self):
        plan=copy.deepcopy(self.plan);del plan['shots'][3]['generation']
        m=self.build(plan)
        written=pm.draft_requests(m,plan,self.dir/'requests')
        self.assertEqual(len(written),1)
        self.assertIn('generation',self.shot(m,'S04')['next_action'])

    def test_changing_the_job_changes_the_request_id(self):
        a=self.build();pm.draft_requests(a,self.plan,self.dir/'requests')
        plan=copy.deepcopy(self.plan);plan['shots'][3]['generation']['params']['prompt']='A different prompt'
        b=self.build(plan);pm.draft_requests(b,plan,self.dir/'requests')
        self.assertNotEqual(self.shot(a,'S04')['request']['request_id'],self.shot(b,'S04')['request']['request_id'])

    def test_redrafting_is_stable_but_a_hand_edited_draft_is_not_overwritten(self):
        a=self.build();first=pm.draft_requests(a,self.plan,self.dir/'requests')
        b=self.build();self.assertEqual(pm.draft_requests(b,self.plan,self.dir/'requests'),first)
        Path(first[0]).write_text('{"edited":true}')
        with self.assertRaisesRegex(ValueError,'differs'):pm.draft_requests(self.build(),self.plan,self.dir/'requests')

    def test_the_manifest_script_has_no_route_to_a_job_or_an_approval(self):
        tree=ast.parse(SCRIPT.read_text())
        imported=set()
        for node in ast.walk(tree):
            if isinstance(node,ast.Import):imported|={a.name.split('.')[0] for a in node.names}
            elif isinstance(node,ast.ImportFrom):imported.add((node.module or '').split('.')[0])
        self.assertFalse(imported&{'subprocess','socket','urllib','http','requests','generation_request','generation_gate'},imported)
        self.assertNotIn('marcus-said',SCRIPT.read_text())

    def test_every_film_flag_stays_false(self):
        _,_,m=self.draft()
        self.assertIs(m['final_video_verified'],False)
        self.assertIs(m['release_approved'],False)
        self.assertTrue(all(s['verified_output'] is None for s in m['shots']))


class WorkedExampleTests(Case):
    def test_expected_outputs_match_a_fresh_run(self):
        out=self.dir/'run';folder=out/'requests'
        cmd=[sys.executable,str(SCRIPT),'shotplan.yaml','--script','script.txt','--assets','assets.json','--renderers','renderers.json',
             '--words','words.json','--qa','shots.json','--requests-dir',str(folder),'--out',str(out/'manifest.json')]
        r=subprocess.run(cmd,capture_output=True,text=True,cwd=self.dir)
        self.assertEqual(r.returncode,0,r.stderr)
        expected=FIXTURE/'expected'
        self.assertEqual((out/'manifest.json').read_text(),(expected/'manifest.json').read_text())
        self.assertEqual(sorted(p.name for p in folder.iterdir()),sorted(p.name for p in (expected/'requests').iterdir()))
        for path in folder.iterdir():
            self.assertEqual(path.read_text(),(expected/'requests'/path.name).read_text())

    def test_the_example_is_not_approved_and_cannot_pass_the_release_gate(self):
        from release_gate import audit
        self.assertEqual(json.loads((FIXTURE/'decisions.json').read_text()),[])
        r=audit(self.plan,None,FIXTURE/'assets.json',None,script_path=FIXTURE/'script.txt',decisions_path=FIXTURE/'decisions.json')
        self.assertFalse(r['release_package_preflight_pass'])
        self.assertIs(r['release_approved'],False)


if __name__=='__main__':unittest.main()
