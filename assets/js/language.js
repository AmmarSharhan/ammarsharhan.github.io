/* ===========================================================
   AMMAR SHARHAN PORTFOLIO - Language Switcher
   Arabic <-> English with persistent language preference.
   The HTML files remain the Arabic source of truth. When English
   is selected, the page is translated from the original Arabic
   DOM and then the selected language is persisted.
=========================================================== */

(() => {
    const STORAGE_KEY = "siteLanguage";
    const DEFAULT_LANGUAGE = "ar";

    const getPageBase = () =>
        window.location.pathname.replace(/\\/g, "/").includes("/pages/") ? "../" : "";

    const normalize = (value) =>
        String(value || "").replace(/\s+/g, " ").trim();

    async function loadTranslations() {
        const base = getPageBase();

        try {
            const response = await fetch(`${base}data/en.json?v=2`, {
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(`Translation file returned ${response.status}`);
            }

            const data = await response.json();
            return data.translations || {};
        } catch (error) {
            console.error("Language file could not be loaded:", error);
            return {};
        }
    }

    function translateTextNodes(translations) {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    if (!node.nodeValue.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    const parent = node.parentElement;

                    if (
                        !parent ||
                        ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodes = [];
        let node;

        while ((node = walker.nextNode())) {
            nodes.push(node);
        }

        nodes.forEach((textNode) => {
            const original = normalize(textNode.nodeValue);

            if (!original) return;

            const translated = translations[original];

            if (!translated) return;

            /*
             * Paragraphs and other long blocks are often split across
             * indentation/newline whitespace in the HTML source. The
             * normalized value therefore does not exist literally inside
             * nodeValue. Replace the whole visible text while preserving
             * only the surrounding whitespace.
             */
            const raw = textNode.nodeValue;
            const leading = raw.match(/^\s*/)?.[0] || "";
            const trailing = raw.match(/\s*$/)?.[0] || "";
            textNode.nodeValue = `${leading}${translated}${trailing}`;
        });
    }

    function translateAttributes(translations) {
        const attributes = [
            "title",
            "aria-label",
            "placeholder",
            "alt"
        ];

        document.querySelectorAll("*").forEach((element) => {
            attributes.forEach((attribute) => {
                const value = element.getAttribute(attribute);

                if (!value) return;

                const normalized = normalize(value);
                const translated = translations[normalized];

                if (translated) {
                    element.setAttribute(attribute, translated);
                }
            });
        });
    }

    function updateMeta(translations) {
        const title = normalize(document.title);
        const translatedTitle = translations[title];

        if (translatedTitle) {
            document.title = translatedTitle;
        }

        document.querySelectorAll("meta[content]").forEach((meta) => {
            const content = meta.getAttribute("content");

            if (!content) return;

            const normalized = normalize(content);
            const translated = translations[normalized];

            if (translated) {
                meta.setAttribute("content", translated);
            }
        });
    }

    function setDocumentLanguage(language) {
        const english = language === "en";
        const html = document.documentElement;

        html.lang = english ? "en" : "ar";
        html.dir = english ? "ltr" : "rtl";

        document.body.classList.toggle("english-mode", english);
        document.body.classList.toggle("arabic-mode", !english);

        const languageButton = document.querySelector(
            ".header-actions .icon-btn:not(#themeToggle)"
        );

        if (languageButton) {
            /*
             * The button shows the language the user can switch TO:
             * Arabic page  -> EN
             * English page -> AR
             */
            languageButton.textContent = english ? "AR" : "EN";
            languageButton.setAttribute(
                "aria-label",
                english ? "Switch to Arabic" : "Switch to English"
            );
            languageButton.setAttribute(
                "title",
                english ? "Switch to Arabic" : "Switch to English"
            );
        }
    }

    function applyLanguage(translations, language) {
        setDocumentLanguage(language);

        /*
         * Every fresh page load starts from the original Arabic HTML.
         * Therefore English is always translated from Arabic exactly once.
         * Arabic requires no reverse translation and can never become
         * accidentally inverted by repeated DOM mutations.
         */
        if (language === "en") {
            translateTextNodes(translations);
            translateAttributes(translations);
            updateMeta(translations);
        }
    }

    function installButton(translations) {
        const button = document.querySelector(
            ".header-actions .icon-btn:not(#themeToggle)"
        );

        if (!button) return;

        /*
         * Prevent duplicate listeners if this script is ever initialized
         * more than once.
         */
        if (button.dataset.languageReady === "true") return;

        button.dataset.languageReady = "true";

        button.addEventListener("click", () => {
            const current =
                localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;

            const next = current === "ar" ? "en" : "ar";

            localStorage.setItem(STORAGE_KEY, next);

            /*
             * Reload from the original Arabic HTML. This is intentional:
             * it guarantees that switching EN -> AR can never reverse or
             * mix already-translated text.
             */
            window.location.reload();
        });
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const translations = await loadTranslations();

        const savedLanguage =
            localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;

        const language =
            savedLanguage === "en" ? "en" : "ar";

        applyLanguage(translations, language);
        installButton(translations);
    });
})();
