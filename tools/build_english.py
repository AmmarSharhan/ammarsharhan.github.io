#!/usr/bin/env python3
"""Build the English mirror of the static Arabic site.

Arabic HTML remains the source of truth. Existing reviewed translations in
 data/en.json are reused; missing strings are left in Arabic and reported.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import json, re

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://ammarsharhan.github.io/ammar-portfolio"
SRC_FILES = [ROOT / "index.html", *sorted((ROOT / "pages").glob("*.html"))]
EN_ROOT = ROOT / "en"

def norm(v):
    return re.sub(r"\s+", " ", str(v or "")).strip()

def load_translations():
    data = json.loads((ROOT / "data/en.json").read_text(encoding="utf-8"))
    return data.get("translations", {})

def page_url(src, english=False):
    rel = src.relative_to(ROOT).as_posix()
    prefix = "/en/" if english else "/"
    return BASE_URL + prefix + ("" if rel == "index.html" else rel)

def en_path(src):
    rel = src.relative_to(ROOT)
    return EN_ROOT / rel

def replace_text(soup, translations, missing):
    for node in list(soup.find_all(string=True)):
        parent = node.parent
        if not parent or parent.name in {"script", "style", "noscript"}:
            continue
        original = norm(str(node))
        if not original:
            continue
        translated = translations.get(original)
        if translated and translated != original:
            raw = str(node)
            leading = re.match(r"^\s*", raw).group(0)
            trailing = re.search(r"\s*$", raw).group(0)
            node.replace_with(leading + translated + trailing)
        elif original not in translations and re.search(r"[\u0600-\u06ff]", original):
            missing.add(original)

def replace_attrs(soup, translations, missing):
    for el in soup.find_all(True):
        for attr in ("title", "aria-label", "placeholder", "alt"):
            value = el.get(attr)
            if not value:
                continue
            key = norm(value)
            if key in translations and translations[key] != key:
                el[attr] = translations[key]
            elif key not in translations and re.search(r"[\u0600-\u06ff]", key):
                missing.add(key)

def rewrite_links(soup, is_root):
    # Relative internal links are intentionally preserved; /en/ mirrors the same tree.
    return

def fix_asset_paths(soup, rel):
    prefix = "../" if rel == "index.html" else "../../"
    for el in soup.find_all(True):
        for attr in ("src", "href"):
            value = el.get(attr)
            if not value or value.startswith(("http:", "https:", "#", "mailto:", "tel:", "data:")):
                continue
            if value.startswith("assets/"):
                el[attr] = prefix + value
            elif value.startswith("../assets/") and rel != "index.html":
                el[attr] = "../" + value

def set_meta(soup, src, translations):
    rel = src.relative_to(ROOT).as_posix()
    url = page_url(src, english=True)
    ar_url = page_url(src, english=False)
    # Translate meta descriptions/titles/OG/Twitter content as well.
    if soup.title:
        key = norm(soup.title.get_text(" ", strip=True))
        if translations.get(key): soup.title.string = translations[key]
    for meta in soup.find_all("meta"):
        content = meta.get("content")
        if content and translations.get(norm(content)):
            meta["content"] = translations[norm(content)]
    canonical = soup.find("link", rel=lambda x: x and "canonical" in x)
    if canonical:
        canonical["href"] = url
    else:
        tag = soup.new_tag("link", rel="canonical", href=url)
        soup.head.append(tag)

    for prop, content in (("og:url", url),):
        m = soup.find("meta", attrs={"property": prop})
        if m: m["content"] = content
        else: soup.head.append(soup.new_tag("meta", property=prop, content=content))

    soup.html["lang"] = "en"
    soup.html["dir"] = "ltr"
    soup.html["data-site-root"] = "../" if rel == "index.html" else "../../"

    # Language alternates are generated as real, crawlable URLs.
    for link in soup.find_all("link", rel=lambda x: x and "alternate" in x):
        link.decompose()
    ar_url = BASE_URL + "/" + ("" if rel == "index.html" else rel)
    en_url = BASE_URL + "/en/" + ("" if rel == "index.html" else rel)
    for lang, href in (("ar", ar_url), ("en", url), ("x-default", ar_url)):
        soup.head.append(soup.new_tag("link", rel="alternate", hreflang=lang, href=href))

    # JSON-LD: Person for home, WebPage for inner pages.
    for s in soup.find_all("script", attrs={"type": "application/ld+json"}):
        s.decompose()
    if rel == "index.html":
        obj = {
            "@context":"https://schema.org",
            "@type":"Person",
            "name":"Ammar Sharhan",
            "alternateName":"عمار شرهان",
            "url":BASE_URL + "/",
            "jobTitle":"Digital Marketing Specialist & AI Content Creator",
            "sameAs":[
                "https://www.facebook.com/ammar.sharhan",
                "https://www.instagram.com/ammar.sharhan",
                "https://www.youtube.com/@Ammar.Sharhan",
                "https://www.tiktok.com/@jl2_9"
            ]
        }
    else:
        obj = {"@context":"https://schema.org", "@type":"WebPage", "name":soup.title.get_text(strip=True), "url":url, "isPartOf":{"@type":"WebSite","name":"Ammar Sharhan","url":BASE_URL+"/"}}
    ld = soup.new_tag("script", type="application/ld+json")
    ld.string = json.dumps(obj, ensure_ascii=False, indent=2)
    soup.head.append(ld)

def fix_script_paths(soup, rel):
    # English root/pages need different relative paths to assets/data.
    for link in soup.find_all("link", rel=lambda x: x and "manifest" in x):
        link["href"] = "../site.webmanifest" if rel == "index.html" else "../../site.webmanifest"
    for script in soup.find_all("script", src=True):
        src = script["src"]
        if "assets/js/" in src:
            filename = src.split("assets/js/")[-1]
            script["src"] = ("../assets/js/" if rel == "index.html" else "../../assets/js/") + filename

def build():
    translations = load_translations()
    missing = set()
    EN_ROOT.mkdir(parents=True, exist_ok=True)
    (EN_ROOT / "pages").mkdir(parents=True, exist_ok=True)
    for src in SRC_FILES:
        soup = BeautifulSoup(src.read_text(encoding="utf-8"), "html.parser")
        replace_text(soup, translations, missing)
        replace_attrs(soup, translations, missing)
        rewrite_links(soup, src.name == "index.html")
        rel = src.relative_to(ROOT).as_posix()
        set_meta(soup, src, translations)
        fix_script_paths(soup, rel)
        fix_asset_paths(soup, rel)
        out = en_path(src)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(soup.prettify(formatter="html") , encoding="utf-8")
    if missing:
        print("Missing Arabic strings in data/en.json:")
        for item in sorted(missing): print("-", item)
    else:
        print("English build: all Arabic strings found in data/en.json")

if __name__ == "__main__":
    build()
