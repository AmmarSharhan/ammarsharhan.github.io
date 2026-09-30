#!/usr/bin/env python3
"""Sync Arabic source strings into data/ar.json and optionally auto-translate new strings.

Set OPENAI_API_KEY and OPENAI_MODEL in CI/local environment to enable automatic
translation of only newly discovered Arabic strings. Existing translations are
never overwritten.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import json, os, re, urllib.request

ROOT=Path(__file__).resolve().parents[1]
SRC=[ROOT/'index.html', *sorted((ROOT/'pages').glob('*.html'))]
AR=ROOT/'data/ar.json'; EN=ROOT/'data/en.json'

def norm(v): return re.sub(r'\s+', ' ', str(v or '')).strip()
def collect():
    out=set()
    for p in SRC:
        s=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
        for n in s.find_all(string=True):
            if n.parent and n.parent.name not in {'script','style','noscript'}:
                v=norm(n)
                if v and re.search(r'[\u0600-\u06ff]',v): out.add(v)
        for el in s.find_all(True):
            for a in ('title','aria-label','placeholder','alt'):
                v=norm(el.get(a))
                if v and re.search(r'[\u0600-\u06ff]',v): out.add(v)
    return out

def load(path): return json.loads(path.read_text(encoding='utf-8'))
def save(path,data): path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')

def translate_batch(items):
    key=os.getenv('OPENAI_API_KEY'); model=os.getenv('OPENAI_MODEL'); base=os.getenv('OPENAI_BASE_URL','https://api.openai.com/v1').rstrip('/')
    if not key or not model: return {}
    prompt=("Translate each Arabic string into natural professional English suitable for a personal digital marketing portfolio website. "
            "Preserve brand names, URLs, emails, phone numbers, product names and proper nouns. Return ONLY valid JSON object mapping the exact Arabic strings to English strings.\n\n"
            + json.dumps(items,ensure_ascii=False))
    payload=json.dumps({"model":model,"messages":[{"role":"system","content":"You are a professional Arabic-English website translator."},{"role":"user","content":prompt}],"temperature":0.2}).encode()
    req=urllib.request.Request(base+'/chat/completions',data=payload,headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'},method='POST')
    with urllib.request.urlopen(req,timeout=120) as r: data=json.load(r)
    text=data['choices'][0]['message']['content'].strip()
    text=re.sub(r'^```json\s*|^```\s*|\s*```$','',text,flags=re.I|re.S).strip()
    return json.loads(text)

def main():
    found=collect(); ar=load(AR); en=load(EN)
    armap=ar.setdefault('translations',{}); enmap=en.setdefault('translations',{})
    new=[x for x in sorted(found) if x not in armap]
    for x in new: armap[x]=x
    if new:
        print(f'New Arabic strings: {len(new)}')
        translated=translate_batch(new)
        for x in new: enmap[x]=translated.get(x,x)
    # Keep existing translations; add any Arabic entries already present but missing from EN.
    for x in armap:
        enmap.setdefault(x,x)
    ar['language']='ar'; en['language']='en'
    save(AR,ar); save(EN,en)
    print(f'Arabic strings: {len(armap)} | English entries: {len(enmap)}')
    if new and not os.getenv('OPENAI_API_KEY'): print('OPENAI_API_KEY/OPENAI_MODEL not configured; new entries were added as Arabic placeholders.')

if __name__=='__main__': main()
