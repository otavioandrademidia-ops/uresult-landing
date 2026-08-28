(function () {
    "use strict";

    const config = window.URESULT_TRACKING_CONFIG || {};
    const strategy = config.strategy === "gtm" ? "gtm" : "direct";
    const gtmId = /^GTM-[A-Z0-9]+$/i.test(config.googleTagManagerId || "") ? config.googleTagManagerId : "";
    const ga4Id = /^G-[A-Z0-9]+$/i.test(config.googleAnalyticsId || "") ? config.googleAnalyticsId : "";
    const metaPixelId = /^\d{5,20}$/.test(config.metaPixelId || "") ? config.metaPixelId : "";
    const supportsAnalytics = strategy === "gtm" ? Boolean(gtmId) : Boolean(ga4Id);
    const supportsMarketing = strategy === "gtm" ? Boolean(gtmId) : Boolean(metaPixelId);
    const isConfigured = supportsAnalytics || supportsMarketing;
    const consentKey = `uresult_cookie_consent_${config.consentVersion || "1.0"}`;

    window.uResultTracking = {
        isConfigured,
        track: function () {}
    };

    if (!isConfigured) return;

    let preferences = readPreferences();
    let lastFocusedElement = null;

    function readPreferences() {
        try {
            const stored = window.localStorage.getItem(consentKey);
            if (!stored) return null;
            const parsed = JSON.parse(stored);
            if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") return null;
            return parsed;
        } catch (error) {
            return null;
        }
    }

    function storePreferences(nextPreferences) {
        try {
            window.localStorage.setItem(consentKey, JSON.stringify({
                analytics: Boolean(nextPreferences.analytics),
                marketing: Boolean(nextPreferences.marketing),
                savedAt: new Date().toISOString()
            }));
        } catch (error) {
            // Se o armazenamento estiver bloqueado, a escolha vale apenas para a sessão atual.
        }
    }

    function ensureDataLayer() {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () {
            window.dataLayer.push(arguments);
        };
    }

    function setGoogleConsent(nextPreferences, command) {
        ensureDataLayer();
        window.gtag("consent", command || "update", {
            analytics_storage: nextPreferences.analytics ? "granted" : "denied",
            ad_storage: nextPreferences.marketing ? "granted" : "denied",
            ad_user_data: nextPreferences.marketing ? "granted" : "denied",
            ad_personalization: nextPreferences.marketing ? "granted" : "denied",
            functionality_storage: "granted",
            security_storage: "granted"
        });
    }

    function loadGoogleTagManager(nextPreferences) {
        if (!gtmId || document.getElementById("uresult-gtm")) return;
        setGoogleConsent({ analytics: false, marketing: false }, "default");
        setGoogleConsent(nextPreferences, "update");
        window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

        const script = document.createElement("script");
        script.id = "uresult-gtm";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
        document.head.appendChild(script);
    }

    function loadGoogleAnalytics() {
        if (!ga4Id || document.getElementById("uresult-ga4")) return;
        ensureDataLayer();
        setGoogleConsent({ analytics: false, marketing: false }, "default");
        setGoogleConsent({ analytics: true, marketing: false }, "update");

        const script = document.createElement("script");
        script.id = "uresult-ga4";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
        document.head.appendChild(script);

        window.gtag("js", new Date());
        window.gtag("config", ga4Id, { anonymize_ip: true });
    }

    function loadMetaPixel() {
        if (!metaPixelId || window.fbq) return;

        const fbq = function () {
            fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
        };
        fbq.push = fbq;
        fbq.loaded = true;
        fbq.version = "2.0";
        fbq.queue = [];
        window.fbq = fbq;

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/pt_BR/fbevents.js";
        document.head.appendChild(script);

        window.fbq("init", metaPixelId);
        window.fbq("track", "PageView");
    }

    function applyPreferences(nextPreferences) {
        preferences = {
            analytics: supportsAnalytics && Boolean(nextPreferences.analytics),
            marketing: supportsMarketing && Boolean(nextPreferences.marketing)
        };

        if (strategy === "gtm") {
            if (preferences.analytics || preferences.marketing) {
                loadGoogleTagManager(preferences);
            } else if (window.gtag) {
                setGoogleConsent(preferences, "update");
            }
            return;
        }

        if (preferences.analytics) loadGoogleAnalytics();
        if (preferences.marketing) loadMetaPixel();
    }

    function removeKnownTrackingCookies() {
        const trackedNames = document.cookie
            .split(";")
            .map(function (item) { return item.split("=")[0].trim(); })
            .filter(function (name) {
                return /^(_ga($|_)|_gid$|_gat($|_)|_fbp$|_fbc$)/.test(name);
            });

        const hostnameParts = window.location.hostname.split(".");
        const domains = [window.location.hostname];
        if (hostnameParts.length > 2) {
            const isBrazilianDomain = hostnameParts.slice(-2).join(".") === "com.br";
            domains.push(`.${hostnameParts.slice(isBrazilianDomain ? -3 : -2).join(".")}`);
        }

        trackedNames.forEach(function (name) {
            document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
            domains.forEach(function (domain) {
                document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
            });
        });
    }

    function track(eventName, parameters) {
        const safeName = String(eventName || "").replace(/[^a-zA-Z0-9_]/g, "_");
        if (!safeName || !preferences) return;

        if (strategy === "gtm" && (preferences.analytics || preferences.marketing)) {
            ensureDataLayer();
            window.dataLayer.push(Object.assign({ event: safeName }, parameters || {}));
            return;
        }

        if (preferences.analytics && window.gtag) {
            window.gtag("event", safeName, parameters || {});
        }
        if (preferences.marketing && window.fbq) {
            window.fbq("trackCustom", safeName, parameters || {});
        }
    }

    window.uResultTracking.track = track;

    function injectStyles() {
        const style = document.createElement("style");
        style.textContent = `
            .ur-cookie-banner, .ur-cookie-modal { font-family: 'Poppins', Arial, sans-serif; }
            .ur-cookie-banner[hidden], .ur-cookie-overlay[hidden] { display: none !important; }
            .ur-cookie-banner {
                position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
                width: min(1120px, calc(100% - 32px)); z-index: 5000;
                display: flex; align-items: center; justify-content: space-between; gap: 26px;
                padding: 22px 24px; color: #fff; background: rgba(7, 10, 16, .98);
                border: 1px solid rgba(0, 102, 255, .32); border-radius: 18px;
                box-shadow: 0 20px 65px rgba(0, 0, 0, .55); backdrop-filter: blur(14px);
            }
            .ur-cookie-copy { max-width: 690px; }
            .ur-cookie-copy strong { display: block; margin-bottom: 6px; font-size: 17px; }
            .ur-cookie-copy p { margin: 0; color: #aaa; font-size: 13px; line-height: 1.6; }
            .ur-cookie-copy a { color: #58a0ff; }
            .ur-cookie-actions { display: flex; gap: 10px; flex-shrink: 0; }
            .ur-cookie-button {
                min-height: 42px; padding: 10px 17px; border-radius: 999px; cursor: pointer;
                border: 1px solid #273247; color: #fff; background: #111722;
                font: inherit; font-size: 12px; font-weight: 700; transition: .2s ease;
            }
            .ur-cookie-button:hover { transform: translateY(-1px); border-color: #0066ff; }
            .ur-cookie-button-primary { border-color: #0066ff; background: #0066ff; }
            .ur-cookie-manage {
                position: fixed; left: 18px; bottom: 18px; z-index: 2100; padding: 8px 12px;
                color: #aeb7c7; background: rgba(7, 10, 16, .92); border: 1px solid #273247;
                border-radius: 999px; cursor: pointer; font: 600 11px 'Poppins', Arial, sans-serif;
            }
            .ur-cookie-overlay {
                position: fixed; inset: 0; z-index: 5100; display: grid; place-items: center;
                padding: 20px; background: rgba(0, 0, 0, .78); backdrop-filter: blur(6px);
            }
            .ur-cookie-modal {
                width: min(590px, 100%); max-height: calc(100vh - 40px); overflow: auto;
                padding: 30px; color: #fff; background: #080b11; border: 1px solid #1c2d48;
                border-radius: 20px; box-shadow: 0 24px 80px rgba(0, 0, 0, .7);
            }
            .ur-cookie-modal-header { display: flex; justify-content: space-between; gap: 18px; }
            .ur-cookie-modal h2 { margin: 0 0 8px; font-size: 25px; }
            .ur-cookie-modal-intro { margin: 0 0 24px; color: #9ba4b3; font-size: 13px; line-height: 1.65; }
            .ur-cookie-close { align-self: flex-start; border: 0; color: #fff; background: transparent; cursor: pointer; font-size: 24px; }
            .ur-cookie-option {
                display: flex; align-items: center; justify-content: space-between; gap: 20px;
                padding: 18px 0; border-top: 1px solid #1a2230;
            }
            .ur-cookie-option strong { display: block; margin-bottom: 4px; font-size: 14px; }
            .ur-cookie-option span { display: block; color: #8f98a8; font-size: 12px; line-height: 1.5; }
            .ur-cookie-option input { width: 21px; height: 21px; accent-color: #0066ff; flex-shrink: 0; }
            .ur-cookie-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
            @media (max-width: 760px) {
                .ur-cookie-banner { bottom: 12px; padding: 19px; align-items: stretch; flex-direction: column; gap: 16px; }
                .ur-cookie-actions { display: grid; grid-template-columns: 1fr 1fr; }
                .ur-cookie-button-primary { grid-column: 1 / -1; grid-row: 1; }
                .ur-cookie-modal { padding: 24px 20px; }
                .ur-cookie-modal-actions { display: grid; grid-template-columns: 1fr 1fr; }
                .ur-cookie-manage { left: 12px; bottom: 12px; }
            }
        `;
        document.head.appendChild(style);
    }

    function buildInterface() {
        injectStyles();

        const banner = document.createElement("section");
        banner.className = "ur-cookie-banner";
        banner.setAttribute("aria-label", "Preferências de cookies");
        banner.hidden = true;
        banner.innerHTML = `
            <div class="ur-cookie-copy">
                <strong>Você escolhe como seus dados são usados</strong>
                <p>Cookies opcionais de medição e publicidade só serão ativados com sua autorização. <a href="privacidade.html">Leia a Política de Privacidade</a>.</p>
            </div>
            <div class="ur-cookie-actions">
                <button class="ur-cookie-button" type="button" data-cookie-action="reject">Recusar</button>
                <button class="ur-cookie-button" type="button" data-cookie-action="manage">Gerenciar</button>
                <button class="ur-cookie-button ur-cookie-button-primary" type="button" data-cookie-action="accept">Aceitar todos</button>
            </div>
        `;

        const manageButton = document.createElement("button");
        manageButton.type = "button";
        manageButton.className = "ur-cookie-manage";
        manageButton.textContent = "Preferências de cookies";
        manageButton.hidden = !preferences;

        const overlay = document.createElement("div");
        overlay.className = "ur-cookie-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <div class="ur-cookie-modal" role="dialog" aria-modal="true" aria-labelledby="ur-cookie-title">
                <div class="ur-cookie-modal-header">
                    <div>
                        <h2 id="ur-cookie-title">Preferências de cookies</h2>
                        <p class="ur-cookie-modal-intro">Você pode alterar sua escolha a qualquer momento. Os cookies necessários permanecem ativos para guardar sua preferência.</p>
                    </div>
                    <button class="ur-cookie-close" type="button" aria-label="Fechar preferências">&times;</button>
                </div>
                <div class="ur-cookie-option">
                    <div><strong>Necessários</strong><span>Guardam sua escolha e ajudam no funcionamento básico do site.</span></div>
                    <input type="checkbox" checked disabled aria-label="Cookies necessários sempre ativos">
                </div>
                <label class="ur-cookie-option" data-cookie-category="analytics">
                    <div><strong>Analytics</strong><span>Ajuda a entender visitas, páginas acessadas e cliques.</span></div>
                    <input type="checkbox" name="analytics">
                </label>
                <label class="ur-cookie-option" data-cookie-category="marketing">
                    <div><strong>Marketing</strong><span>Permite medir campanhas e conversões publicitárias.</span></div>
                    <input type="checkbox" name="marketing">
                </label>
                <div class="ur-cookie-modal-actions">
                    <button class="ur-cookie-button" type="button" data-cookie-action="reject-modal">Recusar opcionais</button>
                    <button class="ur-cookie-button ur-cookie-button-primary" type="button" data-cookie-action="save">Salvar preferências</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);
        document.body.appendChild(manageButton);
        document.body.appendChild(overlay);

        const analyticsRow = overlay.querySelector('[data-cookie-category="analytics"]');
        const marketingRow = overlay.querySelector('[data-cookie-category="marketing"]');
        if (!supportsAnalytics) analyticsRow.hidden = true;
        if (!supportsMarketing) marketingRow.hidden = true;

        const analyticsInput = overlay.querySelector('input[name="analytics"]');
        const marketingInput = overlay.querySelector('input[name="marketing"]');

        function openSettings() {
            lastFocusedElement = document.activeElement;
            analyticsInput.checked = Boolean(preferences && preferences.analytics);
            marketingInput.checked = Boolean(preferences && preferences.marketing);
            overlay.hidden = false;
            overlay.querySelector(".ur-cookie-close").focus();
        }

        function closeSettings() {
            overlay.hidden = true;
            if (lastFocusedElement && typeof lastFocusedElement.focus === "function") lastFocusedElement.focus();
        }

        function finishChoice(nextPreferences, reloadAfterSave) {
            const hadPreferences = Boolean(preferences);
            storePreferences(nextPreferences);
            if (!nextPreferences.analytics || !nextPreferences.marketing) removeKnownTrackingCookies();
            applyPreferences(nextPreferences);
            banner.hidden = true;
            overlay.hidden = true;
            manageButton.hidden = false;
            if (reloadAfterSave && hadPreferences) window.location.reload();
        }

        banner.querySelector('[data-cookie-action="accept"]').addEventListener("click", function () {
            finishChoice({ analytics: supportsAnalytics, marketing: supportsMarketing }, false);
        });
        banner.querySelector('[data-cookie-action="reject"]').addEventListener("click", function () {
            finishChoice({ analytics: false, marketing: false }, false);
        });
        banner.querySelector('[data-cookie-action="manage"]').addEventListener("click", openSettings);
        manageButton.addEventListener("click", openSettings);
        overlay.querySelector(".ur-cookie-close").addEventListener("click", closeSettings);
        overlay.querySelector('[data-cookie-action="reject-modal"]').addEventListener("click", function () {
            finishChoice({ analytics: false, marketing: false }, true);
        });
        overlay.querySelector('[data-cookie-action="save"]').addEventListener("click", function () {
            finishChoice({ analytics: analyticsInput.checked, marketing: marketingInput.checked }, true);
        });
        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) closeSettings();
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !overlay.hidden) closeSettings();
        });

        if (preferences) {
            applyPreferences(preferences);
        } else {
            banner.hidden = false;
        }
    }

    function registerConversionEvents() {
        document.addEventListener("click", function (event) {
            const link = event.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
            if (!link) return;
            track("whatsapp_click", {
                link_url: link.href,
                page_path: window.location.pathname
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            buildInterface();
            registerConversionEvents();
        });
    } else {
        buildInterface();
        registerConversionEvents();
    }
})();
