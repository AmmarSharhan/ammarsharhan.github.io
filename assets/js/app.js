/* ===========================================================
   Ammar Sharhan Portfolio
   app.js - Unified & Integrated File
=========================================================== */

/* ==========================================
   Global Elements
========================================== */
const header = document.querySelector(".header");
const menuToggle = document.getElementById("menuToggle");
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll(".nav a");
const sections = document.querySelectorAll("section[id]");
const reveals = document.querySelectorAll(".reveal");

/* ==========================================
   1. Header Scroll
========================================== */
function initHeaderScroll() {
    if (!header) return;

    const updateHeader = () => {
        header.classList.toggle("scrolled", window.scrollY > 20);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
}

/* ==========================================
   2. Mobile Navigation
========================================== */
function initMobileMenu() {
    if (!menuToggle || !nav) return;

    const closeMenu = () => {
        nav.classList.remove("nav-open", "active");
        document.body.classList.remove("menu-open");
        menuToggle.classList.remove("active");
        menuToggle.textContent = "☰";
        const english = document.documentElement.lang === "en" || document.documentElement.dir === "ltr";
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", english ? "Menu" : "القائمة");
        menuToggle.setAttribute("title", english ? "Menu" : "القائمة");
    };

    menuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = nav.classList.toggle("nav-open");
        nav.classList.toggle("active", isOpen);
        document.body.classList.toggle("menu-open", isOpen);
        menuToggle.classList.toggle("active", isOpen);
        menuToggle.textContent = isOpen ? "✕" : "☰";
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
        const clickedInsideMenu = nav.contains(event.target) || menuToggle.contains(event.target);
        if (!clickedInsideMenu && (nav.classList.contains("nav-open") || nav.classList.contains("active"))) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && (nav.classList.contains("nav-open") || nav.classList.contains("active"))) {
            closeMenu();
            menuToggle.focus();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
}

/* ==========================================
   3. Active Navigation
========================================== */
function initActiveNavigation() {
    if (!sections.length || !navLinks.length) return;

    const updateActiveNavigation = () => {
        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 140;
            if (window.scrollY >= sectionTop) {
                current = section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + current
            );
        });
    };

    updateActiveNavigation();
    window.addEventListener("scroll", updateActiveNavigation, { passive: true });
}

/* ==========================================
   4. Scroll Reveal
========================================== */
function initReveal() {
    if (!reveals.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    reveals.forEach(item => {
        observer.observe(item);
    });
}

/* ==========================================
   5. Back To Top
========================================== */
function initBackToTop() {
    const backToTop = document.getElementById("backToTop") || document.querySelector(".back-to-top");
    const footer = document.querySelector(".footer");

    if (!backToTop) return;

    const updateBackToTop = () => {
        const footerVisible = footer && footer.getBoundingClientRect().top <= window.innerHeight;
        if (window.scrollY > 500 && !footerVisible) {
            backToTop.classList.add("show");
        } else {
            backToTop.classList.remove("show");
        }
    };

    updateBackToTop();
    window.addEventListener("scroll", updateBackToTop, { passive: true });

    backToTop.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

/* ==========================================
   6. Scroll Progress
========================================== */
function initScrollProgress() {
    const progress = document.querySelector(".scroll-progress");
    if (!progress) return;

    const updateProgress = () => {
        const scrollTop = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

        if (documentHeight <= 0) {
            progress.style.width = "0%";
            return;
        }

        const percentage = Math.min((scrollTop / documentHeight) * 100, 100);
        progress.style.width = percentage + "%";
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
}

/* ==========================================
   7. Loading Screen
========================================== */
function initLoader() {
    const loader = document.querySelector(".loader");
    if (!loader) return;

    document.body.classList.remove("page-loaded");

    const hideLoader = () => {
        setTimeout(() => {
            loader.classList.add("hide");
            document.body.classList.add("page-loaded");
        }, 500);
    };

    if (document.readyState === "complete") {
        hideLoader();
    } else {
        window.addEventListener("load", hideLoader, { once: true });
    }
}

/* ==========================================
   8. Cursor Glow
========================================== */
function initCursorGlow() {
    const glow = document.querySelector(".cursor-glow");
    if (!glow) return;

    if (window.matchMedia("(hover:none)").matches) {
        glow.style.display = "none";
        return;
    }

    document.addEventListener("mousemove", (event) => {
        glow.style.opacity = ".9";
        glow.style.left = event.clientX + "px";
        glow.style.top = event.clientY + "px";
    });

    document.addEventListener("mouseleave", () => {
        glow.style.opacity = "0";
    });
}

/* ==========================================
   9. Theme Toggle
========================================== */
function updateThemeAccessibility(btn, isDark) {
    const english = document.documentElement.lang === "en" || document.documentElement.dir === "ltr";
    btn.setAttribute(
        "aria-label",
        english
            ? (isDark ? "Switch to light mode" : "Switch to dark mode")
            : (isDark ? "الوضع النهاري" : "الوضع الليلي")
    );
    btn.setAttribute("title", english
        ? (isDark ? "Switch to light mode" : "Switch to dark mode")
        : (isDark ? "الوضع النهاري" : "الوضع الليلي")
    );
    btn.setAttribute("aria-pressed", String(isDark));
}

function initTheme() {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark" || savedTheme === "dark-theme") {
        document.body.classList.add("dark-mode");
        btn.textContent = "☀️";
    } else if (savedTheme === "light" || savedTheme === "light-theme") {
        document.body.classList.remove("dark-mode");
        btn.textContent = "🌙";
    } else {
        btn.textContent = "🌙";
    }

    const isDarkInitial = document.body.classList.contains("dark-mode");
    updateThemeAccessibility(btn, isDarkInitial);

    btn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const dark = document.body.classList.contains("dark-mode");
        btn.textContent = dark ? "☀️" : "🌙";
        updateThemeAccessibility(btn, dark);
        localStorage.setItem("theme", dark ? "dark" : "light");
    });
}

/* ==========================================
   10. Image Lazy Fade
========================================== */
function initImages() {
    const images = document.querySelectorAll("img");
    if (!images.length) return;

    images.forEach(img => {
        if (img.complete) {
            img.classList.add("loaded");
        } else {
            img.addEventListener("load", () => {
                img.classList.add("loaded");
            }, { once: true });
        }
    });
}

/* ==========================================
   11. Animated Counters
========================================== */
function initCounters() {
    const counters = document.querySelectorAll(".stat-number");
    if (!counters.length) return;

    const observer = new IntersectionObserver(
        (entries, counterObserver) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const counter = entry.target;
                const target = Number(counter.dataset.target);

                if (!Number.isFinite(target)) {
                    counterObserver.unobserve(counter);
                    return;
                }

                const duration = 2800;
                const startTime = performance.now();

                function updateCounter(currentTime) {
                    const progress = Math.min((currentTime - startTime) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    counter.textContent = Math.round(target * eased);

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                }

                requestAnimationFrame(updateCounter);
                counterObserver.unobserve(counter);
            });
        },
        { threshold: 0.6 }
    );

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

/* ==========================================
   12. Project Anchor Navigation
========================================== */
function initProjectAnchorNavigation() {
    const hash = window.location.hash;
    if (!hash) return;

    const target = document.querySelector(hash);
    if (!target) return;

    setTimeout(() => {
        const headerEl = document.querySelector(".header");
        const headerHeight = headerEl ? headerEl.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

        window.scrollTo({
            top: targetPosition,
            behavior: "smooth"
        });
    }, 500);
}

/* ==========================================
   Main Initialization
========================================== */
document.addEventListener("DOMContentLoaded", () => {
    initHeaderScroll();
    initMobileMenu();
    initActiveNavigation();
    initReveal();
    initBackToTop();
    initScrollProgress();
    initLoader();
    initCursorGlow();
    initTheme();
    initImages();
    initCounters();
    initProjectAnchorNavigation();
});