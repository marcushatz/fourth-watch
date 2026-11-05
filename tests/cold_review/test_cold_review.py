"""Cold-viewer form must not leak expected narration into the visible page."""
from html.parser import HTMLParser
from pathlib import Path
import json,os,re,shutil,subprocess,sys,tempfile,unittest
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from build_cold_review import make
try:from playwright.sync_api import sync_playwright
except ImportError:sync_playwright=None

EXAMPLE=Path(__file__).parent/'storm_questions.json'
MARCUS='Why did Jesus send His disciples into a storm, and wait until the fourth watch to come to them?'
WALK_PAST='Why would Jesus walk past His own disciples?'
PETER='Peter walked on water, then sank. So how did he get back to the boat?'
QUESTIONS=[{'question':MARCUS,'tag':'open','source':'CANARY-SOURCE-ONE'},
           {'question':WALK_PAST,'tag':'open','source':'CANARY-SOURCE-TWO','note':'CANARY-NOTE'},
           {'question':PETER,'tag':'inference','source':'CANARY-SOURCE-THREE'}]
HOSTILE='<img src="https://example.invalid/x.png" onerror="window.ran=1"></legend></script><script>window.ran=1</script>'
TAG_WORDS=re.compile(r'\b(answerable|inference|open)\b',re.I)
JUDGING_WORDS=re.compile(r'\b(scores?|ranks?|ranking|ratings?|rate|votes?|judges?|best|worst)\b',re.I)
REQUEST_ROUTES=['fetch(','XMLHttpRequest','sendBeacon','WebSocket','EventSource','import(','@import','url(','http://','https://']
ALLOWED_TAGS={'html','head','meta','title','style','body','h1','p','fieldset','legend','label','textarea','button','script'}
URL_ATTRIBUTES={'src','srcset','href','action','formaction','poster','data','ping','background'}


class Parsed(HTMLParser):
    """Separates what a reader sees from the markup around it."""
    def __init__(self,page):
        super().__init__(convert_charrefs=True)
        self.tags=[];self.attributes=[];self.text=[];self.comments=[];self.hidden_depth=0
        self.feed(page);self.close()
    def handle_starttag(self,tag,attrs):
        self.tags.append(tag);self.attributes+=attrs
        if tag in('script','style'):self.hidden_depth+=1
    def handle_endtag(self,tag):
        if tag in('script','style'):self.hidden_depth-=1
    def handle_data(self,data):
        if not self.hidden_depth and data.strip():self.text.append(data.strip())
    def handle_comment(self,data):self.comments.append(data)


def shown(page,questions=(MARCUS,WALK_PAST,PETER)):
    """The sheet's questions a reader actually sees, in the order they see them."""
    return [t for t in Parsed(page).text if t in questions]


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


class QuestionModeTests(unittest.TestCase):
    def setUp(self):
        td=tempfile.TemporaryDirectory();self.addCleanup(td.cleanup);self.td=Path(td.name)

    def sheet(self,questions,name='sheet.json'):
        p=self.td/name;p.write_text(json.dumps({'questions':questions}),encoding='utf-8');return p

    def build(self,sheet,seed=7,name='page.html'):
        o=self.td/name;result=make(sheet,o,mode='question',seed=seed)
        return result,o.read_text(encoding='utf-8')

    def test_no_spoilers_tags_and_sources_never_reach_the_page(self):
        result,page=self.build(self.sheet(QUESTIONS,'CANARY-SHEET.json'))
        # Positive control: an empty or encoded page would pass the checks below.
        self.assertCountEqual(shown(page),[MARCUS,WALK_PAST,PETER])
        self.assertNotIn('base64',page)
        self.assertIsNone(TAG_WORDS.search(page))
        self.assertNotIn('CANARY',page)
        printed=json.dumps({k:v for k,v in result.items() if k!='path'})
        self.assertIsNone(TAG_WORDS.search(printed))
        self.assertNotIn('CANARY',printed)

    def test_no_spoilers_in_the_worked_example(self):
        sheet=json.loads(EXAMPLE.read_text(encoding='utf-8'))
        _,page=self.build(EXAMPLE)
        self.assertCountEqual(shown(page),[MARCUS,WALK_PAST,PETER])
        self.assertIsNone(TAG_WORDS.search(page))
        self.assertNotIn(sheet['episode'],page)
        self.assertNotIn('storm_questions',page)
        for q in sheet['questions']:self.assertNotIn(q['source'],page)

    def test_tags_and_sources_cannot_change_one_byte_of_the_page(self):
        # A difference here would be a leak in any form: encoded, reordered or restyled.
        retagged=[dict(q,tag=tag,source='other',extra={'hidden':True})
                  for q,tag in zip(QUESTIONS,('answerable','inference','open'))]
        self.assertEqual(self.build(self.sheet(QUESTIONS))[1],self.build(self.sheet(retagged))[1])

    def test_no_network_page_has_nothing_that_can_make_a_request(self):
        _,page=self.build(EXAMPLE)
        parsed=Parsed(page)
        self.assertCountEqual(shown(page),[MARCUS,WALK_PAST,PETER])
        self.assertLessEqual(set(parsed.tags),ALLOWED_TAGS)
        self.assertEqual(URL_ATTRIBUTES&{name for name,_ in parsed.attributes},set())
        for route in REQUEST_ROUTES:self.assertNotIn(route,page)
        self.assertIn('URL.createObjectURL',page)

    def test_no_network_browser_is_told_to_refuse_requests(self):
        _,page=self.build(EXAMPLE)
        policy=[value for name,value in Parsed(page).attributes if name=='content' and 'default-src' in value]
        self.assertEqual(len(policy),1)
        self.assertIn("default-src 'none'",policy[0])

    def test_no_network_a_question_cannot_add_markup(self):
        _,page=self.build(self.sheet([{'question':HOSTILE,'tag':'open'}]))
        parsed=Parsed(page)
        self.assertEqual(shown(page,(HOSTILE,)),[HOSTILE])
        self.assertNotIn('img',parsed.tags)
        self.assertEqual(parsed.tags.count('script'),1)

    def test_seeded_order_same_seed_same_page(self):
        sheet=self.sheet(QUESTIONS)
        first=self.build(sheet,seed=11)[1]
        self.assertCountEqual(shown(first),[MARCUS,WALK_PAST,PETER])
        self.assertEqual(first,self.build(sheet,seed=11)[1])

    def test_seeded_order_ignores_how_the_sheet_is_listed(self):
        self.assertEqual(self.build(self.sheet(QUESTIONS),seed=11)[1],
                         self.build(self.sheet(QUESTIONS[::-1],'reversed.json'),seed=11)[1])

    def test_seeded_order_reaches_every_arrangement(self):
        sheet=self.sheet(QUESTIONS)
        self.assertEqual(len({tuple(shown(self.build(sheet,seed=s)[1])) for s in range(40)}),6)

    def test_seeded_order_without_a_seed_still_shuffles_and_reports_it(self):
        sheet=self.sheet(QUESTIONS)
        builds=[self.build(sheet,seed=None) for _ in range(30)]
        self.assertGreater(len({tuple(shown(page)) for _,page in builds}),1)
        result,page=builds[0]
        self.assertEqual(self.build(sheet,seed=result['seed'])[1],page)

    def test_nov3_replay_the_storm_questions_all_survive(self):
        # Nov 3 dropped the fourth-watch question because no Gospel says why he waited
        # (ep10-fourth-watch/writer/writer_test_2026-11-03/A_angles.md, Angle 3).
        sheet=json.loads(EXAMPLE.read_text(encoding='utf-8'))
        self.assertEqual({q['question']:q['tag'] for q in sheet['questions']},
                         {MARCUS:'open',WALK_PAST:'open',PETER:'inference'})
        self.assertGreater(len(MARCUS.split()),12,'Over the Nov 3 card limit of 12 words, and must still run')
        for seed in range(24):
            self.assertCountEqual(shown(self.build(EXAMPLE,seed=seed)[1]),[MARCUS,WALK_PAST,PETER])

    def test_nov3_replay_every_open_question_it_dropped_survives(self):
        # Angles 3, 4 and 6 of A_angles.md, in that file's words, with its reasons as sources.
        dropped=[{'question':'Why did Jesus wait until the fourth watch?','tag':'open',
                  'source':'DROP: No Gospel says why he waited'},
                 {'question':"Why does Mark blame the disciples' terror on bread?",'tag':'open',
                  'source':"DROP: Mark doesn't say what they should have grasped"},
                 {'question':'Did Jesus send them into the storm on purpose?','tag':'open',
                  'source':"DROP: Needs a claim about foreknowledge the passage doesn't make"}]
        questions=[q['question'] for q in dropped]
        _,page=self.build(self.sheet(dropped))
        self.assertCountEqual(shown(page,questions),questions)
        self.assertNotIn('DROP',page)

    def test_a_long_question_is_not_a_reason_to_refuse_it(self):
        # A length limit would be a writing rule, and this mode adds none.
        long=' '.join(['word']*60)+'?'
        self.assertEqual(shown(self.build(self.sheet([{'question':long,'tag':'open'}]))[1],(long,)),[long])

    def test_a_bad_sheet_stops_the_build_instead_of_dropping_anything(self):
        one={'question':MARCUS,'tag':'open'}
        bad={'four questions':[{'question':f'Question {n}?','tag':'open'} for n in range(4)],
             'no questions':[],'no tag':[{'question':MARCUS}],'unknown tag':[{'question':MARCUS,'tag':'weak'}],
             'two lines':[{'question':'One line?\nTwo lines?','tag':'open'}],
             'blank':[{'question':'   ','tag':'open'}],'duplicate':[one,dict(one)]}
        for name,questions in bad.items():
            with self.subTest(name):
                out=self.td/'refused'/'page.html'
                with self.assertRaises(ValueError):make(self.sheet(questions),out,mode='question',seed=1)
                self.assertFalse(out.exists())

    def test_collects_words_only_with_no_score_or_ranking(self):
        _,page=self.build(EXAMPLE)
        parsed=Parsed(page)
        self.assertCountEqual(shown(page),[MARCUS,WALK_PAST,PETER])
        self.assertGreaterEqual(parsed.tags.count('textarea'),3)
        for control in ('input','select','option','meter','progress'):self.assertNotIn(control,parsed.tags)
        self.assertIsNone(JUDGING_WORDS.search(page))

    def test_export_is_marked_as_not_an_approval(self):
        _,page=self.build(EXAMPLE)
        self.assertCountEqual(shown(page),[MARCUS,WALK_PAST,PETER])
        self.assertIn('not_an_approval:true',page)
        self.assertIn("review_type:'unprimed_question'",page)
        self.assertIn('Export feedback as JSON',page)

    def test_command_line_builds_the_example_without_printing_tags(self):
        out=self.td/'page.html'
        run=subprocess.run([sys.executable,str(ROOT/'tools/build_cold_review.py'),str(EXAMPLE),'--mode','question',
                            '--seed','3','--out',str(out)],capture_output=True,text=True,check=True)
        self.assertEqual(json.loads(run.stdout)['seed'],3)
        self.assertNotIn('inference',run.stdout)
        self.assertCountEqual(shown(out.read_text(encoding='utf-8')),[MARCUS,WALK_PAST,PETER])

    def test_command_line_keeps_the_video_call_the_pipeline_uses(self):
        video=self.td/'sample.mp4';video.write_bytes(b'dummy');out=self.td/'review.html'
        subprocess.run([sys.executable,str(ROOT/'tools/build_cold_review.py'),str(video),'--out',str(out)],
                       capture_output=True,text=True,check=True)
        self.assertIn('unprimed_visual',out.read_text())


def find_chrome():
    for path in (os.environ.get('CHROME_PATH'),'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
                 shutil.which('google-chrome'),shutil.which('chromium')):
        if path and Path(path).exists():return path


@unittest.skipUnless(sync_playwright and find_chrome(),'Playwright or Chrome missing')
class QuestionPageInChrome(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright=sync_playwright().start()
        cls.browser=cls.playwright.chromium.launch(executable_path=find_chrome(),args=['--no-sandbox'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.playwright.stop()

    def setUp(self):
        td=tempfile.TemporaryDirectory();self.addCleanup(td.cleanup);self.td=Path(td.name)
        self.context=self.browser.new_context(accept_downloads=True);self.addCleanup(self.context.close)

    def visit(self,path):
        """Opens a file and reports every request and error it causes."""
        page=self.context.new_page();seen={'requests':[],'errors':[]}
        page.on('request',lambda r:seen['requests'].append(r.url))
        page.on('pageerror',lambda e:seen['errors'].append(str(e)))
        page.on('console',lambda m:seen['errors'].append(m.text) if m.type=='error' else None)
        page.goto(path.as_uri());page.wait_for_load_state('networkidle')
        return page,seen

    def export(self,page):
        boxes=page.locator('textarea');typed=[f'typed reaction {n}' for n in range(boxes.count())]
        for n,text in enumerate(typed):boxes.nth(n).fill(text)
        with page.expect_download() as download:page.get_by_role('button',name='Export feedback as JSON').click()
        return download.value.suggested_filename,Path(download.value.path()).read_text(encoding='utf-8'),typed

    def test_recorder_catches_a_real_request(self):
        # Control: without this, the zero-request checks below could pass with a deaf recorder.
        control=self.td/'control.html'
        control.write_text('<!doctype html><img src="https://example.invalid/x.png">')
        _,seen=self.visit(control)
        self.assertIn('https://example.invalid/x.png',seen['requests'])

    def test_export_from_a_real_browser_holds_reactions_and_no_tags(self):
        out=self.td/'page.html';make(EXAMPLE,out,mode='question',seed=7)
        page,seen=self.visit(out)
        order=shown(page.content())
        name,raw,typed=self.export(page)
        data=json.loads(raw)
        self.assertEqual(name,'anonymous_question_feedback.json')
        self.assertIs(data['not_an_approval'],True)
        self.assertEqual(data['review_type'],'unprimed_question')
        self.assertEqual(data['seed'],7)
        self.assertEqual([a['question'] for a in data['answers']],order)
        self.assertEqual([a['position'] for a in data['answers']],[1,2,3])
        self.assertCountEqual(order,[MARCUS,WALK_PAST,PETER])
        for text in typed:self.assertIn(text,raw)
        self.assertIsNone(TAG_WORDS.search(raw))
        self.assertEqual(seen['requests'],[out.as_uri()])
        self.assertEqual(seen['errors'],[])

    def test_hostile_question_cannot_run_or_reach_out_in_a_real_browser(self):
        sheet=self.td/'sheet.json';sheet.write_text(json.dumps({'questions':[{'question':HOSTILE,'tag':'open'}]}))
        out=self.td/'page.html';make(sheet,out,mode='question',seed=7)
        page,seen=self.visit(out)
        self.assertIsNone(page.evaluate('window.ran ?? null'))
        self.assertEqual(json.loads(self.export(page)[1])['answers'][0]['question'],HOSTILE)
        self.assertEqual(seen['requests'],[out.as_uri()])
        self.assertEqual(seen['errors'],[])


if __name__=='__main__':unittest.main()
