#!/usr/bin/env python3
"""Conservative ESV rights preflight for a narration script, not legal advice.

Does not compare quotes to ESV. Assumes all text inside quotation marks is Bible
quotation; this intentionally overestimates quoted fraction when dialogue appears.
"""
import argparse,json,re,sys
from pathlib import Path

NOTICE='Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. ESV Text Edition: 2025. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated in whole or in part into any other language. Used by permission. All rights reserved.'

def audit(script_text,credits_text='',declared_translation='ESV'):
    if declared_translation.upper()!='ESV':return {'translation':declared_translation,'status':'UNKNOWN_TRANSLATION','notes':['Review that publisher’s current policy separately']}
    s=re.sub(r'^#.*$','',script_text,flags=re.M)
    quoted=re.findall(r'[“\"]([^”\"]+)[”\"]',s)
    word_re=r"\b[\w’-]+\b"
    n=len(re.findall(word_re,s))
    q=sum(len(re.findall(word_re,z)) for z in quoted)
    ratio=q/n if n else 0
    issues=[]
    if ratio>=0.25:issues.append('Potential 25% quotation threshold exceeded (conservative count; manual rights review needed)')
    if NOTICE not in credits_text:issues.append('2025 ESV full copyright notice absent from credits/caption text')
    if 'ESV' not in credits_text:issues.append('No explicit ESV attribution found in credits')
    issues.append('Check spoken ESV verbal credit in final audio; text cannot verify this')
    issues.append('Verify each quotation matches CURRENT ESV text exactly (this tool cannot check)')
    issues.append('Assess 500-verse, half-book, commentary/reference-work and non-CC requirements manually')
    return {'translation':'ESV','script_words_est':n,'quoted_words_est_conservative':q,'quoted_ratio_est':round(ratio,3),'full_notice_present':NOTICE in credits_text,'review_items':issues,'policy_source':'https://www.crossway.org/permissions/','rights_clearance':False}

def main():
    p=argparse.ArgumentParser();p.add_argument('script');p.add_argument('--credits');p.add_argument('--out');args=p.parse_args()
    s=Path(args.script).read_text();c=Path(args.credits).read_text() if args.credits else ''
    r=audit(s,c)
    v=json.dumps(r,indent=2,ensure_ascii=False);print(v)
    if args.out:Path(args.out).write_text(v+'\n')
    return 0
if __name__=='__main__':sys.exit(main())
