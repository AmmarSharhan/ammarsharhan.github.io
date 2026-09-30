/* ===========================================================
   AMMAR SHARHAN PORTFOLIO - Language Switcher
   Arabic is the source of truth. English pages are generated under /en/.
=========================================================== */
(() => {
    const STORAGE_KEY = "siteLanguage";
    const DEFAULT_LANGUAGE = "ar";

    const getSiteRoot = () => {
        const declared = document.documentElement.dataset.siteRoot;
        if (declared) return declared;
        const path = window.location.pathname.replace(/\\/g, "/");
        if (path.includes("/en/pages/")) return "../../";
        if (path.includes("/en/")) return "../";
        if (path.includes("/pages/")) return "../";
        return "";
    };

    const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();

    async function loadTranslations() {
        try {
            const response = await fetch(`${getSiteRoot()}data/en.json?v=4`, { cache: "no-store" });
            if (!response.ok) throw new Error(`Translation file returned ${response.status}`);
            const data = await response.json();
            return data.translations || {};
        } catch (error) {
            console.error("Language file could not be loaded:", error);
            return {};
        }
    }

    function setDocumentLanguage(language) {
        const english = language === "en";
        const html = document.documentElement;
        html.lang = english ? "en" : "ar";
        html.dir = english ? "ltr" : "rtl";
        document.body.classList.toggle("english-mode", english);
        document.body.classList.toggle("arabic-mode", !english);
        const button = document.querySelector(".header-actions .icon-btn:not(#themeToggle)");
        if (button) {
            button.textContent = english ? "AR" : "EN";
            button.setAttribute("aria-label", english ? "Switch to Arabic" : "Switch to English");
            button.setAttribute("title", english ? "Switch to Arabic" : "Switch to English");
        }
    }

    function translateTextNodes(translations) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const parent = node.parentElement;
                if (!node.nodeValue.trim() || !parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        const nodes=[]; let node;
        while ((node=walker.nextNode())) nodes.push(node);
        nodes.forEach(textNode => {
            const original=normalize(textNode.nodeValue);
            const translated=translations[original];
            if (!translated) return;
            const raw=textNode.nodeValue;
            const leading=raw.match(/^\s*/)?.[0] || "";
            const trailing=raw.match(/\s*$/)?.[0] || "";
            textNode.nodeValue=`${leading}${translated}${trailing}`;
        });
    }

    function translateAttributes(translations) {
        document.querySelectorAll("*").forEach(element => {
            ["title","aria-label","placeholder","alt"].forEach(attribute => {
                const value=element.getAttribute(attribute);
                if (!value) return;
                const translated=translations[normalize(value)];
                if (translated) element.setAttribute(attribute, translated);
            });
        });
    }

    function updateMeta(translations) {
        const title=normalize(document.title);
        if (translations[title]) document.title=translations[title];
        document.querySelectorAll("meta[content]").forEach(meta => {
            const content=meta.getAttribute("content");
            const translated=translations[normalize(content)];
            if (translated) meta.setAttribute("content", translated);
        });
    }

    function getLocalizedTarget(nextLanguage) {
        const path = window.location.pathname.replace(/\\/g, "/");
        const root = getSiteRoot();
        const marker = "/en/";
        if (nextLanguage === "ar") {
            if (path.includes(marker)) return path.replace(marker, "/");
            return path;
        }
        if (path.includes(marker)) return path;
        const projectMarker = "/ammar-portfolio/";
        if (path.includes(projectMarker)) {
            const suffix = path.split(projectMarker)[1];
            return projectMarker + "en/" + suffix;
        }
        return root + "en/";
    }

    function installButton() {
        const button=document.querySelector(".header-actions .icon-btn:not(#themeToggle)");
        if (!button || button.dataset.languageReady === "true") return;
        button.dataset.languageReady="true";
        button.addEventListener("click", () => {
            const current=document.documentElement.lang === "en" ? "en" : "ar";
            const next=current === "ar" ? "en" : "ar";
            localStorage.setItem(STORAGE_KEY,next);
            window.location.href=getLocalizedTarget(next);
        });
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const translations=await loadTranslations();
        const isEnglishPath=window.location.pathname.includes("/en/");
        const saved=localStorage.getItem(STORAGE_KEY);
        const language=isEnglishPath ? "en" : (saved === "en" ? "en" : DEFAULT_LANGUAGE);
        setDocumentLanguage(language);
        if (language === "en" && !isEnglishPath) {
            translateTextNodes(translations);
            translateAttributes(translations);
            updateMeta(translations);
        }
        if (isEnglishPath) localStorage.setItem(STORAGE_KEY,"en");
        installButton();
    });
})();
