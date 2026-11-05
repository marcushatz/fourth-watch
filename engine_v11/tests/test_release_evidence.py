"""The release gate and state machine read evidence, not flags. Each forged case from the Nov 5 audit must fail.

Decision logs here live in temp folders and are labelled test fixtures. Nothing in this file records a real approval.
"""
import copy, hashlib, json, os, shutil, subprocess, sys, tempfile, unittest
from pathlib import Path
from unittest import mock

ENGINE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ENGINE/'scripts'))
from fw_engine import inspect
from release_gate import audit
import episode_state

STATE_SCRIPT=ENGINE/'scripts/episode_state.py'
GATE_SCRIPT=ENGINE/'scripts/release_gate.py'
HAS_MEDIA=bool(shutil.which('ffmpeg') and shutil.which('ffprobe'))
GOOD_PROBE={'streams':[{'codec_type':'video','width':1080,'height':1920},{'codec_type':'audio'}],'format':{'duration':'2.0'}}
_media=tempfile.TemporaryDirectory()
MEDIA=Path(_media.name)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def make_video(name,size='1080x1920',source='testsrc2',audio=True,seconds=2):
    path=MEDIA/name
    if path.exists():return path
    cmd=['ffmpeg','-v','error','-y','-f','lavfi','-i',f'{source}=s={size}:r=30:d={seconds}']
    if audio:cmd+=['-f','lavfi','-i',f'sine=frequency=220:duration={seconds}']
    cmd+=['-pix_fmt','yuv420p','-preset','ultrafast','-movflags','+faststart']
    if audio:cmd+=['-c:a','aac','-shortest']
    subprocess.run(cmd+[str(path)],check=True)
    return path


def shot(sid,start,end,**extra):
    return {'id':sid,'start_frame':start,'end_frame':end,'narration':'Test narration.','read':'A test picture for the gate.',
            'medium':'2_5d_parallax','size':'WS','angle':'eye',
            'camera':{'move':'push','why':'test','start_scale':1.0,'end_scale':1.1},
            'visual':{'setting':'test','subject':'test','action':'test','key_light':'test','mood':'test','stage':'FINAL'},
            'claim_ids':['C1'],'beats':[],**extra}


def decision(did,gate,subject,sha256,**extra):
    return {'decision_id':did,'gate':gate,'verdict':'approved','decided_by':'Marcus','marcus_said':'TEST FIXTURE: approved',
            'decided_at':'2026-11-05T10:00:00+00:00','source':'test fixture, not a real conversation',
            'subject':str(subject),'subject_sha256':sha256,**extra}


@unittest.skipUnless(HAS_MEDIA,'ffmpeg and ffprobe are required')
class Case(unittest.TestCase):
    """A complete, genuine-looking package. Each test forges exactly one piece of it."""
    def setUp(self):
        tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup)
        d=self.dir=Path(tmp.name)
        self.script=d/'script.txt';self.script.write_text('The locked test script.\n')
        self.claims=d/'claims.csv';self.claims.write_text('id,kind,scripture,support_summary,notes\nC1,TEXT,Mark 6:48,test,test\n')
        self.treatment=d/'treatment.md';self.treatment.write_text('Test treatment.\n')
        self.animatic=d/'animatic.txt';self.animatic.write_text('Test animatic.\n')
        (d/'assets').mkdir()
        self.asset=d/'assets/plate.txt';self.asset.write_text('plate bytes')
        self.assets=d/'assets.json'
        self.write_assets([{'name':'plate','origin':'test','license':'original','sha256':sha(self.asset),'path':str(self.asset)}])
        self.video=make_video('master.mp4')
        self.plan={'schema_version':'1.0','episode_id':'gate-test','fps':30,'width':1080,'height':1920,
                   'approved_script_sha256':sha(self.script),'approval':{'script':True,'treatment':True,'animatic':True},
                   'shots':[shot('S01',0,30,assets=['plate']),shot('S02',30,60)]}
        self.assertEqual(inspect(self.plan)[0],[])
        self.log=d/'decisions.json'
        self.entries=[decision('D1','script',self.script.name,sha(self.script)),
                      decision('D2','treatment',self.treatment.name,sha(self.treatment)),
                      decision('D3','animatic',self.animatic.name,sha(self.animatic))]
        self.write_log(self.entries)

    def write_log(self,entries):
        self.log.write_text(json.dumps(entries,indent=2))

    def write_assets(self,items):
        self.assets.write_text(json.dumps(items))

    def gate(self,plan=None,**changes):
        args=dict(claims_path=self.claims,manifest_path=self.assets,video_path=self.video,script_path=self.script,decisions_path=self.log)
        args.update(changes)
        return audit(plan or self.plan,**args)

    def assertBlocked(self,result,text):
        self.assertFalse(result['release_package_preflight_pass'],result)
        self.assertIs(result['release_approved'],False)
        self.assertTrue(any(text in e for e in result['errors']),result['errors'])


class GenuinePackageTests(Case):
    def test_real_evidence_passes_preflight_and_still_is_not_release_approved(self):
        r=self.gate()
        self.assertEqual(r['errors'],[])
        self.assertTrue(r['release_package_preflight_pass'])
        self.assertIs(r['release_approved'],False)

    def test_release_approved_needs_marcus_decision_on_this_exact_file(self):
        master=self.dir/'master.mp4';shutil.copy(self.video,master)
        self.write_log(self.entries+[decision('D4','release',master.name,sha(master))])
        self.assertIs(self.gate(video_path=master)['release_approved'],True)

    def test_a_release_decision_on_another_cut_does_not_count(self):
        other=self.dir/'other_cut.mp4';shutil.copy(make_video('other.mp4',source='smptebars'),other)
        self.write_log(self.entries+[decision('D4','release',other.name,sha(other))])
        r=self.gate()
        self.assertTrue(r['release_package_preflight_pass'])
        self.assertIs(r['release_approved'],False)

    def test_a_failed_package_stays_unapproved_even_with_a_release_decision(self):
        master=self.dir/'master.mp4';shutil.copy(self.video,master)
        self.write_log(self.entries+[decision('D4','release',master.name,sha(master))])
        self.assertBlocked(self.gate(video_path=master,script_path=None),'script')

    def test_the_gate_never_writes_the_log(self):
        before=self.log.read_bytes()
        self.gate()
        self.assertEqual(self.log.read_bytes(),before)

    def test_command_line_reads_the_script_and_a_log_beside_the_plan(self):
        plan=self.dir/'shotplan.json';plan.write_text(json.dumps(self.plan))
        r=subprocess.run([sys.executable,str(GATE_SCRIPT),str(plan),'--claims',str(self.claims),'--manifest',str(self.assets),
                          '--video',str(self.video),'--script',str(self.script)],capture_output=True,text=True)
        self.assertEqual(r.returncode,0,r.stdout+r.stderr)
        self.assertIs(json.loads(r.stdout)['release_approved'],False)


class ForgedApprovalTests(Case):
    def test_flags_set_by_hand_with_an_empty_log(self):
        self.write_log([])
        self.assertBlocked(self.gate(),'does not trace')

    def test_flags_set_by_hand_with_no_log(self):
        self.assertBlocked(self.gate(decisions_path=None),'decisions log')

    def test_log_path_that_does_not_exist(self):
        self.assertBlocked(self.gate(decisions_path=self.dir/'nothing.json'),'does not trace')

    def test_entry_not_from_marcus(self):
        self.entries[0]['decided_by']='Claude';self.write_log(self.entries)
        self.assertBlocked(self.gate(),'Marcus')

    def test_entry_without_his_words(self):
        self.entries[1]['marcus_said']='   ';self.write_log(self.entries)
        self.assertBlocked(self.gate(),'words')

    def test_continue_is_not_approval(self):
        for words in ('continue','Go ahead.','CONTINUE!'):
            with self.subTest(words=words):
                self.entries[2]['marcus_said']=words;self.write_log(self.entries)
                self.assertBlocked(self.gate(),'not an approval')

    def test_entry_with_no_source(self):
        self.entries[0]['source']='';self.write_log(self.entries)
        self.assertBlocked(self.gate(),'source')

    def test_entry_dated_in_the_future(self):
        self.entries[0]['decided_at']='2999-01-01T00:00:00+00:00';self.write_log(self.entries)
        self.assertBlocked(self.gate(),'future')

    def test_entry_for_another_gate(self):
        self.entries[2]['gate']='treatment';self.write_log(self.entries)
        self.assertBlocked(self.gate(),'animatic')

    def test_newest_decision_wins_so_a_later_rejection_blocks(self):
        rejected=decision('D9','animatic',self.animatic.name,sha(self.animatic),verdict='rejected')
        self.write_log(self.entries+[rejected])
        self.assertBlocked(self.gate(),'rejected')

    def test_approved_file_changed_after_the_decision(self):
        self.treatment.write_text('Changed after he approved it.\n')
        self.assertBlocked(self.gate(),'changed')

    def test_zero_hash_in_a_decision(self):
        self.entries[1]['subject_sha256']='0'*64;self.write_log(self.entries)
        self.assertBlocked(self.gate(),'changed')

    def test_decision_pointing_at_a_missing_file(self):
        self.entries[1]['subject']='gone.md';self.write_log(self.entries)
        self.assertBlocked(self.gate(),'not found')

    def test_duplicate_decision_ids(self):
        self.entries[1]['decision_id']='D1';self.write_log(self.entries)
        self.assertBlocked(self.gate(),'duplicate')

    def test_log_that_is_not_a_list(self):
        self.log.write_text('{"script":true}')
        self.assertBlocked(self.gate(),'does not trace')


class LockedScriptTests(Case):
    def test_zero_hash(self):
        plan=copy.deepcopy(self.plan);plan['approved_script_sha256']='0'*64
        self.assertBlocked(self.gate(plan),'does not match the script file')

    def test_script_edited_after_lock(self):
        self.script.write_text('A rewritten script.\n')
        self.assertBlocked(self.gate(),'does not match the script file')

    def test_no_script_given(self):
        self.assertBlocked(self.gate(script_path=None),'locked script file')

    def test_script_path_missing(self):
        self.assertBlocked(self.gate(script_path=self.dir/'gone.txt'),'locked script file')

    def test_decision_approved_a_different_text(self):
        other=self.dir/'other_script.txt';other.write_text('Another text he approved.\n')
        self.entries[0]=decision('D1','script',other.name,sha(other));self.write_log(self.entries)
        self.assertBlocked(self.gate(),'different text')


class AssetEvidenceTests(Case):
    def item(self,**changes):
        data={'name':'plate','origin':'test','license':'original','sha256':sha(self.asset),'path':str(self.asset)}
        data.update(changes)
        return data

    def test_empty_asset_list(self):
        self.write_assets([])
        self.assertBlocked(self.gate(),'empty')

    def test_good_looking_entry_with_no_file_to_check(self):
        item=self.item();del item['path']
        self.write_assets([item])
        self.assertBlocked(self.gate(),'missing path')

    def test_listed_file_that_does_not_exist(self):
        self.write_assets([self.item(path=str(self.dir/'gone.txt'))])
        self.assertBlocked(self.gate(),'missing local file')

    def test_zero_hash(self):
        self.write_assets([self.item(sha256='0'*64)])
        self.assertBlocked(self.gate(),'hash mismatch')

    def test_empty_file(self):
        empty=self.dir/'assets/empty.txt';empty.write_bytes(b'')
        self.write_assets([self.item(path=str(empty),sha256=sha(empty))])
        self.assertBlocked(self.gate(),'empty')

    def test_shot_uses_an_asset_nobody_listed(self):
        plan=copy.deepcopy(self.plan);plan['shots'][1]['assets']=['ghost']
        self.assertBlocked(self.gate(plan),'ghost')

    def test_relative_paths_resolve_from_the_asset_manifest(self):
        self.write_assets([self.item(path='assets/plate.txt')])
        cwd=os.getcwd();self.addCleanup(os.chdir,cwd);os.chdir(ENGINE)
        self.assertEqual(self.gate()['errors'],[])

    def test_paid_asset_with_a_made_up_approval_id(self):
        self.write_assets([self.item(paid=True,approval_id='fake')])
        self.assertBlocked(self.gate(),'does not trace')

    def test_paid_asset_with_no_approval_id(self):
        self.write_assets([self.item(paid=True)])
        self.assertBlocked(self.gate(),'paid without approval ID')

    def test_paid_asset_traced_to_a_generation_decision_passes(self):
        request=self.dir/'request.json';request.write_text('{"request_id":"r1"}')
        self.write_log(self.entries+[decision('G1','generation',request.name,sha(request))])
        self.write_assets([self.item(paid=True,approval_id='G1')])
        self.assertEqual(self.gate()['errors'],[])


class MediaProbeTests(Case):
    def fake_tool(self,name,body):
        folder=self.dir/'bin';folder.mkdir(exist_ok=True)
        tool=folder/name;tool.write_text('#!/bin/sh\n'+body);tool.chmod(0o755)
        return str(folder)

    def fake_ffprobe(self):
        return self.fake_tool('ffprobe',f"cat <<'E'\n{json.dumps(GOOD_PROBE)}\nE\n")

    def text_master(self):
        fake=self.dir/'fake.mp4';fake.write_text('this is not a film')
        return fake

    def test_stubbed_python_probe_with_a_text_file(self):
        with mock.patch('qa_video.ffprobe',return_value=GOOD_PROBE):
            self.assertBlocked(self.gate(video_path=self.text_master()),'could not be verified')

    def test_stubbed_ffprobe_binary_with_a_text_file(self):
        with mock.patch.dict(os.environ,{'PATH':self.fake_ffprobe()+os.pathsep+os.environ['PATH']}):
            self.assertBlocked(self.gate(video_path=self.text_master()),'could not be verified')

    def test_stubbed_ffprobe_binary_claiming_full_size_for_a_small_film(self):
        small=make_video('small.mp4',size='360x640')
        with mock.patch.dict(os.environ,{'PATH':self.fake_ffprobe()+os.pathsep+os.environ['PATH']}):
            self.assertBlocked(self.gate(video_path=small),'could not be verified')

    def test_mp4_header_with_no_film_behind_it(self):
        fake=self.dir/'header.mp4';fake.write_bytes(b'\x00\x00\x00\x18ftypisom\x00\x00\x02\x00isomiso2')
        with mock.patch('qa_video.ffprobe',return_value=GOOD_PROBE):
            self.assertBlocked(self.gate(video_path=fake),'could not be verified')

    def test_truncated_master(self):
        whole=self.video.read_bytes()
        cut=self.dir/'cut.mp4';cut.write_bytes(whole[:len(whole)//2])
        self.assertBlocked(self.gate(video_path=cut),'could not be verified')

    def test_low_resolution_master(self):
        self.assertBlocked(self.gate(video_path=make_video('low.mp4',size='720x1280')),'full-resolution')

    def test_silent_master(self):
        self.assertBlocked(self.gate(video_path=make_video('silent.mp4',audio=False)),'no audio')

    def test_frozen_master(self):
        self.assertBlocked(self.gate(video_path=make_video('frozen.mp4',source='smptebars')),'never changes')

    def test_decoded_length_must_match_the_plan(self):
        self.assertBlocked(self.gate(video_path=make_video('long.mp4',seconds=4)),'duration mismatch')

    def test_no_video(self):
        self.assertBlocked(self.gate(video_path=None),'final video')


class EpisodeStateTests(Case):
    def state(self,name):
        path=self.dir/'state.json'
        path.write_text(json.dumps({'state':name,'history':[]}))
        return path

    def cli(self,target,*extra):
        return subprocess.run([sys.executable,str(STATE_SCRIPT),str(self.dir/'state.json'),target,*extra],capture_output=True,text=True)

    def stored(self):
        return json.loads((self.dir/'state.json').read_text())['state']

    def test_fake_decision_id_is_blocked(self):
        self.state('SCRIPT_PROPOSED')
        r=self.cli('SCRIPT_APPROVED','--creator-approved','--decision-id','fake','--evidence','he said so')
        self.assertEqual(r.returncode,1,r.stdout+r.stderr)
        self.assertIn('BLOCKED',r.stderr)
        self.assertEqual(self.stored(),'SCRIPT_PROPOSED')

    def test_real_decision_advances_and_reads_the_log_beside_the_state(self):
        self.state('SCRIPT_PROPOSED')
        r=self.cli('SCRIPT_APPROVED','--creator-approved','--decision-id','D1','--evidence','see the log')
        self.assertEqual(r.returncode,0,r.stderr)
        self.assertEqual(self.stored(),'SCRIPT_APPROVED')

    def test_explicit_log_path(self):
        self.state('SCRIPT_PROPOSED')
        other=self.dir/'other';other.mkdir()
        shutil.copy(self.script,other/self.script.name);shutil.move(self.log,other/'decisions.json')
        r=self.cli('SCRIPT_APPROVED','--creator-approved','--decision-id','D1','--evidence','see the log','--decisions',str(other/'decisions.json'))
        self.assertEqual(r.returncode,0,r.stderr)

    def test_decision_for_another_gate_is_blocked(self):
        self.state('SCRIPT_PROPOSED')
        r=self.cli('SCRIPT_APPROVED','--creator-approved','--decision-id','D2','--evidence','wrong gate')
        self.assertEqual(r.returncode,1)
        self.assertEqual(self.stored(),'SCRIPT_PROPOSED')

    def test_no_log_is_blocked(self):
        self.state('SCRIPT_PROPOSED');self.log.unlink()
        r=self.cli('SCRIPT_APPROVED','--creator-approved','--decision-id','D1','--evidence','x')
        self.assertEqual(r.returncode,1)
        self.assertIn('decisions log',r.stderr)

    def test_a_later_rejection_blocks_the_earlier_approval(self):
        self.state('SCRIPT_PROPOSED')
        self.write_log(self.entries+[decision('D9','script',self.script.name,sha(self.script),verdict='rejected')])
        r=self.cli('SCRIPT_APPROVED','--creator-approved','--decision-id','D1','--evidence','x')
        self.assertEqual(r.returncode,1)

    def test_decision_on_an_edited_script_is_blocked(self):
        self.state('SCRIPT_PROPOSED');self.script.write_text('Edited after approval.\n')
        r=self.cli('SCRIPT_APPROVED','--creator-approved','--decision-id','D1','--evidence','x')
        self.assertEqual(r.returncode,1)

    def test_release_cannot_be_reached_by_any_flag_without_a_decision(self):
        self.state('QA_PASSED')
        for extra in ([],['--creator-approved'],['--creator-approved','--decision-id','D1','--evidence','x'],
                      ['--decision-id','D1','--evidence','x']):
            with self.subTest(extra=extra):
                self.assertEqual(self.cli('RELEASE_APPROVED',*extra).returncode,1)
                self.assertEqual(self.stored(),'QA_PASSED')

    def test_the_cli_never_writes_the_log(self):
        self.state('SCRIPT_PROPOSED');before=self.log.read_bytes()
        self.cli('SCRIPT_APPROVED','--creator-approved','--decision-id','D1','--evidence','x')
        self.assertEqual(self.log.read_bytes(),before)

    def test_approval_flag_on_a_stage_with_no_gate_is_blocked(self):
        self.state('RESEARCHED')
        r=self.cli('SCRIPT_PROPOSED','--creator-approved','--decision-id','D1','--evidence','x')
        self.assertEqual(r.returncode,1)

    def test_advance_cannot_be_told_true(self):
        with self.assertRaisesRegex(ValueError,'approval'):episode_state.advance('SCRIPT_PROPOSED','SCRIPT_APPROVED',True)

    def test_advance_reads_the_log_itself(self):
        with self.assertRaisesRegex(ValueError,'fake'):
            episode_state.advance('SCRIPT_PROPOSED','SCRIPT_APPROVED',self.log,'fake')
        self.assertEqual(episode_state.advance('SCRIPT_PROPOSED','SCRIPT_APPROVED',self.log,'D1'),'SCRIPT_APPROVED')


if __name__=='__main__':unittest.main()
