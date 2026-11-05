/* ═══════════════════════════════════════════════════════════════════════════
   track.js · Session and Mara analytics and advertising tags
   One file, served from all three sites:
     https://www.thesessionlab.com/track.js       (Session)
     https://mara.thesessionlab.com/track.js      (Mara, public pages only)
     https://sessionwithjade.com/track.js         (Session with Jade)

   WHAT IT DOES
   1. Shows a cookie banner. UK PECR and UK GDPR need opt in, so NOTHING is
      loaded and no cookie is set by any tag until the visitor says yes.
      Reject is one click, same size as Accept.
   2. After consent it loads Google Analytics 4 and Google Ads (with Google
      Consent Mode v2), the Meta Pixel, the LinkedIn Insight Tag and the
      TikTok Pixel. A platform with an empty ID below is simply skipped.
   3. It sends conversions (sign up, trial started, lead, call booked) by
      watching for successful calls to our own endpoints, so the page code
      did not need to change. Only the event name and plan value leave the
      browser. No email, name or form content is ever sent to an ad platform.
   4. ON MARA IT SWITCHES ITSELF OFF ONCE SOMEONE IS SIGNED IN. Rooms such as
      Off the Record are never tracked. The only exception is the moment a
      visitor comes back from Stripe, so the trial start can be counted; even
      then only that one conversion is sent and the tags are shut down.

   The consent choice is stored in one first party cookie on .thesessionlab.com
   (session_consent), so a choice made on Session also covers Mara.

   TO TURN A PLATFORM ON: paste its ID into CONFIG below and redeploy.
   TO TEST: add ?track_debug=1 to any page and open the browser console.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.__sessionTrack) return;

  // ─── CONFIG · paste IDs here ─────────────────────────────────────────────
  var CONFIG = {
    // Google Analytics 4. One property covers both sites (hostname tells
    // them apart) so a visit that starts on Session and signs up on Mara is
    // one journey. Looks like "G-ABC123XYZ9".
    ga4: "G-6PS24XN959",

    // Google Ads. Looks like "AW-123456789". The labels are optional: if you
    // import the GA4 key events into Google Ads instead, leave them blank.
    googleAds: "AW-18557702547",
    googleAdsLabels: {
      sign_up: "vWWtCOu0zrIdEJOjgJFF",        // "Sign-up" in Google Ads
      start_trial: "Mwf_CO60zrIdEJOjgJFF",    // "Trial started"
      generate_lead: "DCTTCPG0zrIdEJOjgJFF",  // "Submit lead form"
      book_call: "bYKkCLC1zrIdEJOjgJFF"       // "Book appointment"
    },

    // Meta Pixel (Instagram and Facebook). 15 or 16 digits.
    metaPixel: "",

    // LinkedIn Insight Tag partner ID (digits) and conversion IDs (digits).
    linkedinPartner: "",
    linkedinConversions: {
      sign_up: "",
      start_trial: "",
      generate_lead: "",
      book_call: ""
    },

    // TikTok Pixel ID, looks like "C123ABC456DEF".
    tiktokPixel: ""
  };

  // Plan prices in GBP, used as the value of a trial start.
  var PLAN_VALUE = { starter: 15.99, full: 29.99, everything: 29.99 };

  // ─── setup ───────────────────────────────────────────────────────────────
  var COOKIE = "session_consent";
  var VERSION = 1; // bump to ask everyone again after a policy change
  var host = location.hostname;
  var SITE = /(^|\.)mara\.thesessionlab\.com$/.test(host) || /practise-bot.*onrender\.com$/.test(host) ? "mara"
    : /(^|\.)sessionwithjade\.com$/.test(host) ? "jade" : "session";
  var DEBUG = /[?&]track_debug=1/.test(location.search);
  try { if (DEBUG) localStorage.setItem("track_debug", "1"); if (localStorage.getItem("track_debug") === "1") DEBUG = true; } catch (e) {}
  function log() { if (DEBUG && window.console) console.log.apply(console, ["[track]"].concat([].slice.call(arguments))); }

  // Conversion return from Stripe, captured now before the page tidies the URL.
  var RETURN = /[?&](card_trial|studio_checkout)=cs_/.test(location.search);

  // Is a Mara member signed in? Supabase keeps the session in localStorage.
  function signedIn() {
    if (SITE !== "mara") return false;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k) && localStorage.getItem(k)) return true;
      }
    } catch (e) {}
    return false;
  }

  // Signed in on load and not coming back from Stripe: do nothing at all.
  // No banner, no tags, no event hooks.
  var memberOnLoad = signedIn();
  if (memberOnLoad && !RETURN) { log("signed in member, tracking off"); window.__sessionTrack = { off: true }; exposeNoop(); return; }

  var state = { consent: null, loaded: { ga: false, ads: false, meta: false, li: false, tt: false }, shutdown: false };
  var CONVERSIONS = { sign_up: 1, start_trial: 1, begin_checkout: 1 };

  // ─── consent cookie ──────────────────────────────────────────────────────
  function readConsent() {
    var m = document.cookie.match(new RegExp("(?:^|; )" + COOKIE + "=([^;]*)"));
    if (!m) return null;
    var p = decodeURIComponent(m[1]).split(".");
    // format: v1.a1.d0.<time>
    if (p[0] !== "v" + VERSION) return null;
    return { analytics: p[1] === "a1", ads: p[2] === "d1" };
  }
  function writeConsent(c) {
    var v = ["v" + VERSION, c.analytics ? "a1" : "a0", c.ads ? "d1" : "d0", Date.now()].join(".");
    var dom = /thesessionlab\.com$/.test(host) ? "; domain=.thesessionlab.com" : "";
    document.cookie = COOKIE + "=" + encodeURIComponent(v) + "; path=/; max-age=" + (60 * 60 * 24 * 182) + "; samesite=lax" + (location.protocol === "https:" ? "; secure" : "") + dom;
  }

  // ─── loaders ─────────────────────────────────────────────────────────────
  function addScript(src) {
    var s = document.createElement("script"); s.async = true; s.src = src;
    (document.head || document.documentElement).appendChild(s);
  }

  function gtagBoot() {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
      analytics_storage: "denied", functionality_storage: "granted", security_storage: "granted"
    });
    window.gtag("js", new Date());
  }

  function loadGoogle(c) {
    if (!CONFIG.ga4 && !CONFIG.googleAds) return;
    gtagBoot();
    window.gtag("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: c.ads ? "granted" : "denied",
      ad_user_data: c.ads ? "granted" : "denied",
      ad_personalization: c.ads ? "granted" : "denied"
    });
    var first = CONFIG.ga4 || CONFIG.googleAds;
    if (!state.loaded.ga && !state.loaded.ads) addScript("https://www.googletagmanager.com/gtag/js?id=" + first);
    if (c.analytics && CONFIG.ga4 && !state.loaded.ga) {
      window.gtag("config", CONFIG.ga4, {
        send_page_view: false,
        cookie_domain: /thesessionlab\.com$/.test(host) ? "thesessionlab.com" : "auto",
        site: SITE
      });
      state.loaded.ga = true;
    }
    if (c.ads && CONFIG.googleAds && !state.loaded.ads) {
      window.gtag("config", CONFIG.googleAds, { send_page_view: false });
      state.loaded.ads = true;
    }
  }

  function loadMeta() {
    if (!CONFIG.metaPixel || state.loaded.meta) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("set", "autoConfig", false, CONFIG.metaPixel); // no automatic button tracking
    window.fbq("init", CONFIG.metaPixel);
    state.loaded.meta = true;
  }

  function loadLinkedIn() {
    if (!CONFIG.linkedinPartner || state.loaded.li) return;
    window._linkedin_partner_id = CONFIG.linkedinPartner;
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(CONFIG.linkedinPartner);
    if (!window.lintrk) { window.lintrk = function (a, b) { window.lintrk.q.push([a, b]); }; window.lintrk.q = []; }
    addScript("https://snap.licdn.com/li.lms-analytics/insight.min.js");
    state.loaded.li = true;
  }

  function loadTikTok() {
    if (!CONFIG.tiktokPixel || state.loaded.tt) return;
    /* eslint-disable */
    !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)}}(window,document,"ttq");
    /* eslint-enable */
    window.ttq.load(CONFIG.tiktokPixel);
    state.loaded.tt = true;
  }

  function applyConsent(c, firstTime) {
    state.consent = c;
    if (!c.analytics && !c.ads) { shutdown("declined"); return; }
    if (state.shutdown && !RETURN) return;
    loadGoogle(c);
    if (c.ads) { loadMeta(); loadLinkedIn(); loadTikTok(); }
    // One page view for this page. Never on a signed in Mara page.
    if (!memberOnLoad && !signedIn()) pageView();
    flushQueue();
    log("consent applied", c, firstTime ? "(new choice)" : "(saved choice)");
  }

  // ─── events ──────────────────────────────────────────────────────────────
  function pageView() {
    if (state.consent && state.consent.analytics && state.loaded.ga) window.gtag("event", "page_view", { send_to: CONFIG.ga4, site: SITE });
    if (state.consent && state.consent.ads) {
      if (state.loaded.ads) window.gtag("event", "page_view", { send_to: CONFIG.googleAds });
      if (state.loaded.meta) window.fbq("track", "PageView");
      if (state.loaded.tt) window.ttq.page();
      // LinkedIn counts the page view itself when its script loads.
    }
    log("page_view", location.pathname);
  }

  // Event name map per platform. Unknown names go to GA4 only.
  var META = { sign_up: "CompleteRegistration", start_trial: "StartTrial", begin_checkout: "InitiateCheckout", generate_lead: "Lead", book_call: "Schedule" };
  var TIKTOK = { sign_up: "CompleteRegistration", start_trial: "Subscribe", begin_checkout: "InitiateCheckout", generate_lead: "SubmitForm", book_call: "Contact" };

  var queue = [];
  function flushQueue() { var q = queue; queue = []; for (var i = 0; i < q.length; i++) send(q[i][0], q[i][1]); }

  function track(name, params) {
    params = params || {};
    if (state.shutdown && !CONVERSIONS[name]) { log("ignored after shutdown", name); return; }
    if (!state.consent) { queue.push([name, params]); log("queued until consent", name); return; }
    send(name, params);
  }

  function send(name, params) {
    var c = state.consent; if (!c) return;
    var p = {}; for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) p[k] = params[k];
    p.site = SITE;
    if (p.value != null) p.currency = p.currency || "GBP";

    if (c.analytics && state.loaded.ga) window.gtag("event", name, Object.assign({ send_to: CONFIG.ga4 }, p));
    if (c.ads) {
      var label = CONFIG.googleAdsLabels[name];
      if (state.loaded.ads && label) window.gtag("event", "conversion", { send_to: CONFIG.googleAds + "/" + label, value: p.value, currency: p.currency });
      if (state.loaded.meta && META[name]) window.fbq("track", META[name], p.value != null ? { value: p.value, currency: p.currency, predicted_ltv: p.value } : {});
      if (state.loaded.tt && TIKTOK[name]) window.ttq.track(TIKTOK[name], p.value != null ? { value: p.value, currency: p.currency, content_type: "product", content_id: p.plan || name } : {});
      var li = CONFIG.linkedinConversions[name];
      if (state.loaded.li && li) window.lintrk("track", { conversion_id: Number(li) });
    }
    log("event", name, p);
  }

  // Stop everything. Used when a Mara visitor signs in, and when consent is
  // declined or withdrawn.
  function shutdown(why) {
    if (state.shutdown) return;
    state.shutdown = true;
    if (CONFIG.ga4) window["ga-disable-" + CONFIG.ga4] = true;
    if (CONFIG.googleAds) window["ga-disable-" + CONFIG.googleAds] = true;
    if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    if (window.fbq) try { window.fbq("consent", "revoke"); } catch (e) {}
    if (window.ttq && window.ttq.revokeConsent) try { window.ttq.revokeConsent(); } catch (e) {}
    log("tracking shut down:", why);
  }

  // ─── conversion hooks: watch our own endpoints ───────────────────────────
  // [pattern on URL, event, extra params or function(responseJson) -> params|false]
  var HOOKS = [
    [/\/auth\/v1\/signup(\?|$)/, "sign_up", { method: "email" }],
    [/\/api\/trial\/card-checkout\/confirm(\?|$)/, "start_trial", function (d) {
      if (!d || !d.ok) return false;
      var plan = d.plan === "starter" ? "starter" : "full";
      return { plan: plan, value: PLAN_VALUE[plan], trialing: !!d.trialing };
    }],
    [/\/api\/trial\/card-checkout(\?|$)/, "begin_checkout", function (d, body) {
      var plan = body && /starter/i.test(body) ? "starter" : "full";
      return { plan: plan, value: PLAN_VALUE[plan] };
    }],
    [/\/api\/trial\/studio-checkout\/confirm(\?|$)/, "start_trial", function (d) { return d && d.ok === false ? false : { plan: "studio_friend", value: PLAN_VALUE.starter }; }],
    [/\/api\/hr-trial\/apply(\?|$)/, "generate_lead", { form: "hr_trial" }],
    [/\/api\/corporate\/register(\?|$)/, "generate_lead", { form: "corporate_register" }],
    [/\/api\/intake(\?|$)/, "generate_lead", { form: "intake" }],
    [/\/api\/free\/lead(\?|$)/, "generate_lead", { form: "free_tool" }],
    [/\/api\/free\/moment(\?|$)/, "generate_lead", { form: "the_moment" }],
    [/\/api\/trial\/lead(\?|$)/, "generate_lead", { form: "fifteen_minute_trial" }],
    [/\/api\/trial\/start(\?|$)/, "generate_lead", { form: "fifteen_minute_trial" }],
    [/\/api\/subscribers(\?|$)/, "generate_lead", { form: "newsletter" }],
    [/\/api\/brochure\/identify(\?|$)/, "generate_lead", { form: "brochure" }],
    [/api\.web3forms\.com\/submit/, "generate_lead", { form: "enquiry" }]
  ];

  function matchHook(url) {
    for (var i = 0; i < HOOKS.length; i++) if (HOOKS[i][0].test(url)) return HOOKS[i];
    return null;
  }

  function handleResponse(hook, ok, json, body) {
    if (!ok) return;
    var extra = hook[2];
    if (typeof extra === "function") { extra = extra(json, body); if (extra === false) return; }
    track(hook[1], extra || {});
  }

  if (window.fetch) {
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var method = ((init && init.method) || (input && input.method) || "GET").toUpperCase();
      var p = _fetch.apply(this, arguments);
      if (method !== "POST") return p;
      var hook = matchHook(url);
      if (!hook) return p;
      var body = init && typeof init.body === "string" ? init.body : "";
      p.then(function (res) {
        try {
          res.clone().json().then(function (j) { handleResponse(hook, res.ok, j, body); }, function () { handleResponse(hook, res.ok, null, body); });
        } catch (e) { handleResponse(hook, res.ok, null, body); }
      }, function () {});
      return p;
    };
  }

  // Session with Jade: its enquiry and mailing list forms open an email
  // rather than calling an endpoint, so count the submit itself.
  if (SITE === "jade") {
    document.addEventListener("submit", function (e) {
      var f = e.target; if (!f || !f.querySelector) return;
      var em = f.querySelector("[type=email]");
      if (em && !em.value) return;
      var list = f.querySelector("[name=list]");
      track("generate_lead", { form: list && list.value ? String(list.value).toLowerCase().replace(/[^a-z0-9]+/g, "_") : "enquiry" });
    }, true);
  }

  // Calendly bookings (Session pages embed the Calendly widget).
  window.addEventListener("message", function (e) {
    if (!e || !/calendly\.com$/.test((e.origin || "").replace(/^https?:\/\//, "").split(":")[0])) return;
    var d = e.data;
    if (d && d.event === "calendly.event_scheduled") track("book_call", { tool: "calendly" });
  });

  // Clicks from Session to Mara, and on Calendly links (analytics only).
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (SITE === "session" && /mara\.thesessionlab\.com/.test(href)) track("click_to_mara", { link_url: href.split("?")[0] });
    else if (/calendly\.com\//.test(href)) track("open_booking", { link_url: href.split("?")[0] });
    else if (/^mailto:/.test(href)) track("click_email", {});
  }, true);

  // ─── Mara: switch off the moment someone signs in ────────────────────────
  if (SITE === "mara") {
    var watch = setInterval(function () {
      if (signedIn()) {
        // A short grace so the sign up, checkout or trial conversion can go.
        clearInterval(watch);
        setTimeout(function () { shutdown("member signed in"); }, 15000);
      }
    }, 1500);
  }

  // ─── banner ──────────────────────────────────────────────────────────────
  var COPY = {
    title: "Cookies",
    body: SITE === "mara"
      ? "We would like to use cookies to see how people find Mara and which of our adverts work. Nothing is set unless you say yes. Once you sign in, none of this runs."
      : SITE === "jade"
      ? "I would like to use cookies to see how people find this site and which of my adverts work. Nothing is set unless you say yes."
      : "We would like to use cookies to see how people find Session and which of our adverts work. Nothing is set unless you say yes.",
    accept: "Accept all",
    reject: "Reject all",
    choose: "Choose",
    save: "Save my choice",
    analyticsTitle: "Analytics",
    analyticsBody: "Counts visits and which pages people read, using Google Analytics.",
    adsTitle: "Advertising",
    adsBody: SITE === "jade"
      ? "Tells Google, Meta, LinkedIn and TikTok when someone who saw one of my adverts gets in touch, so I only keep paying for adverts that work."
      : "Tells Google, Meta, LinkedIn and TikTok when someone who saw one of our adverts signs up or books a call, so we only keep paying for adverts that work.",
    policy: "Cookie policy"
  };

  var CSS = "" +
    "#sc-cb{position:fixed;z-index:2147483000;left:16px;right:16px;bottom:16px;max-width:520px;margin:0 auto 0 0;background:#111;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:4px;padding:22px 22px 18px;font:16px/1.55 Jost,Archivo,'Helvetica Neue',Arial,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.35)}" +
    "#sc-cb *{box-sizing:border-box}" +
    "#sc-cb h2{margin:0 0 6px;font-weight:600;font-size:18px;line-height:1.3;font-family:inherit;color:#fff;letter-spacing:0;font-style:normal}" +
    "#sc-cb p{margin:0 0 14px;color:#e8e4dc;font-size:15px}" +
    "#sc-cb a{color:#fff;text-decoration:underline}" +
    "#sc-cb .sc-row{display:flex;gap:10px;flex-wrap:wrap}" +
    "#sc-cb button{flex:1 1 130px;min-height:46px;padding:11px 16px;border-radius:3px;font-weight:500;font-size:15px;line-height:1.2;font-family:inherit;cursor:pointer;border:1px solid #fff}" +
    "#sc-cb .sc-solid{background:#fff;color:#111}" +
    "#sc-cb .sc-line{background:transparent;color:#fff}" +
    "#sc-cb .sc-text{flex:0 0 auto;border:0;background:none;color:#fff;text-decoration:underline;padding:11px 6px}" +
    "#sc-cb .sc-opt{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid rgba(255,255,255,.12)}" +
    "#sc-cb .sc-opt input{width:22px;height:22px;margin:2px 0 0;flex:0 0 22px;accent-color:#fff}" +
    "#sc-cb .sc-opt b{display:block;font-weight:600;color:#fff}" +
    "#sc-cb .sc-opt span{display:block;font-size:14px;color:#d6d1c7}" +
    "#sc-cb .sc-opts{display:none;margin:0 0 14px}" +
    "#sc-cb.sc-more .sc-opts{display:block}" +
    "@media (max-width:560px){#sc-cb{left:10px;right:10px;bottom:10px;padding:18px}}" +
    ".sc-settings-link{cursor:pointer}" +
    "@media print{#sc-cb,.sc-settings-link{display:none!important}}";

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  function showBanner(prefill) {
    if (document.getElementById("sc-cb")) return;
    if (!document.getElementById("sc-cb-css")) { var st = el("style", { id: "sc-cb-css" }); st.textContent = CSS; document.head.appendChild(st); }
    var box = el("div", { id: "sc-cb", role: "dialog", "aria-modal": "false", "aria-labelledby": "sc-cb-t" });
    box.appendChild(el("h2", { id: "sc-cb-t" }, COPY.title));
    var p = el("p", null, COPY.body + " ");
    var pol = el("a", { href: (SITE === "jade" ? "/cookies.html" : "/cookies") }, COPY.policy);
    p.appendChild(pol); box.appendChild(p);

    var opts = el("div", { "class": "sc-opts" });
    function opt(id, title, body, checked) {
      var lab = el("label", { "class": "sc-opt", "for": id });
      var cb = el("input", { type: "checkbox", id: id }); cb.checked = !!checked;
      var txt = el("div"); txt.appendChild(el("b", null, title)); txt.appendChild(el("span", null, body));
      lab.appendChild(cb); lab.appendChild(txt); opts.appendChild(lab); return cb;
    }
    var cA = opt("sc-a", COPY.analyticsTitle, COPY.analyticsBody, prefill && prefill.analytics);
    var cD = opt("sc-d", COPY.adsTitle, COPY.adsBody, prefill && prefill.ads);
    box.appendChild(opts);

    var row = el("div", { "class": "sc-row" });
    var bAcc = el("button", { type: "button", "class": "sc-solid" }, COPY.accept);
    var bRej = el("button", { type: "button", "class": "sc-solid" }, COPY.reject); // same weight as Accept
    var bMore = el("button", { type: "button", "class": "sc-text" }, COPY.choose);
    var bSave = el("button", { type: "button", "class": "sc-line" }, COPY.save);
    bSave.style.display = "none";
    row.appendChild(bAcc); row.appendChild(bRej); row.appendChild(bMore); row.appendChild(bSave);
    box.appendChild(row);

    function decide(c) {
      var had = state.consent;
      writeConsent(c);
      box.parentNode && box.parentNode.removeChild(box);
      if (had && ((had.analytics && !c.analytics) || (had.ads && !c.ads))) {
        // Withdrawn: stop now and reload so loaded scripts are gone.
        shutdown("consent withdrawn"); setTimeout(function () { location.reload(); }, 150); return;
      }
      applyConsent(c, true);
      track("consent_choice", { analytics: c.analytics ? "yes" : "no", ads: c.ads ? "yes" : "no" });
    }
    bAcc.onclick = function () { decide({ analytics: true, ads: true }); };
    bRej.onclick = function () { decide({ analytics: false, ads: false }); };
    bMore.onclick = function () { box.classList.add("sc-more"); bMore.style.display = "none"; bSave.style.display = ""; cA.focus(); };
    bSave.onclick = function () { decide({ analytics: cA.checked, ads: cD.checked }); };
    if (prefill) bMore.onclick();

    (document.body || document.documentElement).appendChild(box);
  }

  // A "Cookie settings" link in every footer, so a choice can be changed.
  function addFooterLink() {
    if (document.querySelector(".sc-settings-link")) return;
    var f = document.querySelector("footer");
    if (!f) return;
    var a = el("a", { href: "#cookie-settings", "class": "sc-settings-link" }, "Cookie settings");
    a.style.cssText = "display:inline-block;margin:10px 12px 0 0;color:inherit;opacity:.8;text-decoration:underline;font-size:13px";
    f.appendChild(a);
  }
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href="#cookie-settings"],[data-cookie-settings]') : null;
    if (!a) return;
    e.preventDefault(); showBanner(state.consent || { analytics: false, ads: false });
  });

  // ─── public API ──────────────────────────────────────────────────────────
  // sessionTrack('generate_lead', {form:'x'}) from any page script.
  window.sessionTrack = track;
  window.sessionConsent = { open: function () { showBanner(state.consent || { analytics: false, ads: false }); }, get: function () { return state.consent; } };
  window.__sessionTrack = { site: SITE, config: CONFIG, state: state };

  function exposeNoop() {
    window.sessionTrack = function () {};
    window.sessionConsent = { open: function () {}, get: function () { return null; } };
  }

  // ─── start ───────────────────────────────────────────────────────────────
  function start() {
    addFooterLink();
    var saved = readConsent();
    if (saved) applyConsent(saved, false);
    else if (!memberOnLoad) showBanner(null);
    else log("member returning from Stripe without a saved choice: nothing sent");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
