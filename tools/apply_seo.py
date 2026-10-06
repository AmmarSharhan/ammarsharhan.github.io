#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
from PIL import Image
import json, re

ROOT=Path(__file__).resolve().parents[1]
BASE='https://ammarsharhan.netlify.app'
PAGES=[ROOT/'index.html',*sorted((ROOT/'pages').glob('*.html'))]

def norm(v): return re.sub(r'\s+',' ',str(v or '')).strip()

def canonical(src):
    rel=src.relative_to(ROOT).as_posix()
    return BASE+'/' + ('' if rel=='index.html' else rel)

def ensure_meta(soup, name=None, prop=None, content=''):
    attrs={'name':name} if name else {'property':prop}
    m=soup.find('meta',attrs=attrs)
    if not m:
        m=soup.new_tag('meta');
        for k,v in attrs.items(): m[k]=v
        soup.head.append(m)
    m['content']=content

def ensure_link(soup, rel, href, **extra):
    for l in soup.find_all('link'):
        r=l.get('rel') or []
        if rel in r and (not extra.get('hreflang') or l.get('hreflang')==extra['hreflang']):
            l['href']=href; return
    tag=soup.new_tag('link',rel=rel,href=href,**{k:v for k,v in extra.items() if k!='hreflang'})
    if 'hreflang' in extra: tag['hreflang']=extra['hreflang']
    soup.head.append(tag)

def optimize_images(src,soup):
    for img in soup.find_all('img'):
        raw=img.get('src','')
        if not raw or raw.startswith(('http:','https:','data:')): continue
        file=(src.parent/raw).resolve()
        if file.exists():
            try:
                with Image.open(file) as im:
                    img.setdefault('width',str(im.width)); img.setdefault('height',str(im.height))
            except Exception: pass
        # Above-the-fold visual assets should not lazy-load.
        if ('profile/profile.png' in raw) or ('logo/logo-navy.png' in raw) or ('logo/logo.png' in raw and ('loader' in str(img.parent).lower() or 'loader' in str(img.get('class','')).lower())):
            img['loading']='eager'
        elif img.get('loading') is None:
            img['loading']='lazy'

def main():
    for src in PAGES:
        soup=BeautifulSoup(src.read_text(encoding='utf-8'),'html.parser')
        url=canonical(src)
        title=norm(soup.title.get_text(' ',strip=True)) if soup.title else 'Ammar Sharhan'
        desc=''
        md=soup.find('meta',attrs={'name':'description'})
        if md: desc=md.get('content','')
        ensure_link(soup,'canonical',url)
        # Rebuild language alternates cleanly.
        for l in list(soup.find_all('link',rel=lambda x:x and 'alternate' in x)):
            l.decompose()
        rel=src.relative_to(ROOT).as_posix()
        en=BASE+'/en/'+('' if rel=='index.html' else rel)
        for lang,href in [('ar',url),('en',en),('x-default',url)]:
            tag=soup.new_tag('link',rel='alternate',hreflang=lang,href=href); soup.head.append(tag)
        ensure_meta(soup,prop='og:type',content='website' if rel!='pages/blog-single.html' else 'article')
        ensure_meta(soup,prop='og:url',content=url)
        ensure_meta(soup,prop='og:title',content=title)
        ensure_meta(soup,prop='og:description',content=desc)
        ensure_meta(soup,prop='og:site_name',content='Ammar Sharhan')
        ensure_meta(soup,name='twitter:card',content='summary_large_image')
        ensure_meta(soup,name='twitter:title',content=title)
        ensure_meta(soup,name='twitter:description',content=desc)
        image=BASE+'/assets/images/profile/profile.png'
        ensure_meta(soup,prop='og:image',content=image)
        ensure_meta(soup,name='twitter:image',content=image)
        ensure_link(soup,'manifest', '../site.webmanifest' if rel.startswith('pages/') else 'site.webmanifest')
        # Structured data
        for s in list(soup.find_all('script',attrs={'type':'application/ld+json'})): s.decompose()
        if rel=='index.html':
            obj={'@context':'https://schema.org','@type':'Person','name':'Ammar Sharhan','alternateName':'عمار شرهان','url':url,'jobTitle':'Digital Marketing Specialist & AI Content Creator','image':image,'sameAs':['https://www.facebook.com/ammar.sharhan','https://www.instagram.com/ammar.sharhan','https://www.youtube.com/@Ammar.Sharhan','https://www.tiktok.com/@jl2_9']}
        elif rel=='pages/blog-single.html':
            obj={'@context':'https://schema.org','@type':'Article','headline':title,'description':desc,'url':url,'author':{'@type':'Person','name':'Ammar Sharhan','url':BASE+'/'},'publisher':{'@type':'Person','name':'Ammar Sharhan'},'image':image}
        else:
            obj={'@context':'https://schema.org','@type':'WebPage','name':title,'description':desc,'url':url,'isPartOf':{'@type':'WebSite','name':'Ammar Sharhan','url':BASE+'/'}}
        ld=soup.new_tag('script',type='application/ld+json'); ld.string=json.dumps(obj,ensure_ascii=False,indent=2); soup.head.append(ld)
        soup.html['data-site-root']='./' if rel=='index.html' else '../'
        optimize_images(src,soup)
        src.write_text('<!DOCTYPE html>\n'+str(soup),encoding='utf-8')
    print('SEO/performance metadata applied to',len(PAGES),'Arabic pages.')

if __name__=='__main__': main()
