/* Session with Jade: menu, funnel wiring, consent and mailing list.
   Every form sends into the Session CRM (the same one the Mara app uses),
   so each enquiry becomes a contact, a deal in the right pipeline and a follow up sequence. */
(function () {
  var CFG = {
    INTAKE: 'https://mara.thesessionlab.com/api/intake',
    BOOK_PRIVATE: 'https://mara.thesessionlab.com/book/private_consultation',
    BOOK_CORPORATE: 'https://mara.thesessionlab.com/book/corporate_discovery',
    WHATSAPP: '',            // international number with no plus or spaces, e.g. 447700900123. Empty hides WhatsApp buttons.
    EMAIL: 'jade@thesessionlab.com'
  };
  var path = location.pathname;
  var corporatePage = /organisations|speaking\.html/.test(path);

  /* menu */
  var mb = document.querySelector('.menubtn');
  if (mb) mb.addEventListener('click', function () {
    var o = document.body.classList.toggle('menu-open');
    mb.textContent = o ? 'Close' : 'Menu'; mb.setAttribute('aria-expanded', o);
    document.getElementById('menu').setAttribute('aria-hidden', !o);
  });

  /* booking links: private call by default, workshop discovery call on corporate pages */
  document.querySelectorAll('[data-book]').forEach(function (a) {
    var corp = a.getAttribute('data-book') === 'corporate' || (corporatePage && a.getAttribute('data-book') !== 'private');
    a.href = (corp ? CFG.BOOK_CORPORATE : CFG.BOOK_PRIVATE) + '?utm_source=sessionwithjade&utm_medium=site';
  });

  /* WhatsApp buttons appear once a number is set above */
  document.querySelectorAll('[data-wa]').forEach(function (el) {
    if (!CFG.WHATSAPP) { el.hidden = true; return; }
    var a = el.tagName === 'A' ? el : el.querySelector('a');
    if (a) { a.href = 'https://wa.me/' + CFG.WHATSAPP + '?text=' + encodeURIComponent('Hi Jade, I found you on sessionwithjade.com and would like to talk about coaching.'); a.target = '_blank'; a.rel = 'noopener'; }
    el.hidden = false;
  });

  /* sending */
  function post(payload) {
    return fetch(CFG.INTAKE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); });
  }
  function mailFallback(payload) {
    var b = Object.keys(payload).map(function (k) { return k + ': ' + payload[k]; }).join('\n');
    location.href = 'mailto:' + CFG.EMAIL + '?subject=' + encodeURIComponent('Enquiry · sessionwithjade.com') + '&body=' + encodeURIComponent(b);
  }
  function val(f, n) { var el = f.querySelector('[name="' + n + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; }
  var URGENCY = { 'As soon as possible': 9, 'In the next month': 7, 'In the next three months': 4, 'Just exploring': 2 };
  var CONSENT_WORDING = 'Send me occasional letters from Jade about coaching, group programmes and the Session app. You can leave any time.';

  /* the enquiry form */
  document.querySelectorAll('form.f').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!val(f, 'name') || !/\S+@\S+\.\S+/.test(val(f, 'email'))) { (f.querySelector(!val(f, 'name') ? '[name=name]' : '[name=email]') || {}).focus && f.querySelector(!val(f, 'name') ? '[name=name]' : '[name=email]').focus(); return; }
      var route = f.dataset.route || 'self';
      var msg = val(f, 'message'), moment = val(f, 'upcoming_moment');
      var p = {
        name: val(f, 'name'), email: val(f, 'email'), phone: val(f, 'phone'),
        timing: val(f, 'timing'), urgency: URGENCY[val(f, 'timing')] || 0, upcoming_moment: moment,
        heard: val(f, 'heard'), nda_requested: val(f, 'nda') ? 'Yes' : 'No',
        consent: !!val(f, 'consent'), consent_wording: val(f, 'consent') ? CONSENT_WORDING : '',
        source: 'sessionwithjade.com/enquire:' + route, botcheck: val(f, 'botcheck')
      };
      if (route === 'self') { p.form = 'apply'; p.main_challenge = msg; p.interests = ['private']; }
      if (route === 'rep') { p.form = 'apply'; p.job_title = val(f, 'role_agency'); p.client = val(f, 'client'); p.main_challenge = 'Enquiring for ' + (val(f, 'client') || 'a client') + '. ' + msg; p.interests = ['private']; }
      if (route === 'org') { p.form = 'corporate'; p.company = val(f, 'organisation'); p.main_challenge = msg; p.interests = ['corporate']; }
      if (route === 'event') { p.form = 'contact'; p.topic = 'keynote'; p.company = val(f, 'organisation'); p.event = val(f, 'event'); p.main_challenge = (val(f, 'event') ? val(f, 'event') + '. ' : '') + msg; p.interests = ['keynote']; }
      var btn = f.querySelector('button[type=submit]'); if (btn) { btn.disabled = true; btn.textContent = 'Sending'; }
      post(p).then(function (r) {
        f.classList.add('done');
        var cal = f.querySelector('.okcal');
        if (cal && (r.showCalendar || route === 'org' || route === 'event')) {
          var a = cal.querySelector('a'); if (a) a.href = ((route === 'org' || route === 'event') ? CFG.BOOK_CORPORATE : CFG.BOOK_PRIVATE) + '?utm_source=sessionwithjade&utm_medium=enquiry';
          cal.hidden = false;
        }
        try { window.scrollTo({ top: f.getBoundingClientRect().top + scrollY - 120, behavior: 'smooth' }); } catch (x) {}
      }).catch(function () { mailFallback(p); f.classList.add('done'); });
    });
  });

  /* mailing list (pop up and footer) */
  document.querySelectorAll('form.sub').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = f.querySelector('[type=email]'); if (!em || !/\S+@\S+\.\S+/.test(em.value)) { em && em.focus(); return; }
      var p = { form: 'newsletter', email: em.value.trim(), consent: true, consent_wording: 'Join the Session with Jade list for early access to group programmes, the Session app and new writing from Jade.', source: 'sessionwithjade.com/mailing-list' };
      var finish = function () { f.classList.add('done'); try { localStorage.setItem('swj_mail', '1'); } catch (x) {} };
      post(p).then(finish).catch(function () { mailFallback(p); finish(); });
    });
  });

  /* cookie consent: the same session_consent cookie the Session sites use (v1.a1 = analytics yes) */
  function getConsent() { var m = document.cookie.match(/(?:^|; )session_consent=([^;]*)/); return m ? decodeURIComponent(m[1]) : null; }
  function setConsent(yes) {
    document.cookie = 'session_consent=' + (yes ? 'v1.a1.d1' : 'v1.a0.d0') + '; max-age=15552000; path=/; SameSite=Lax; Secure';
    window.maraConsent = { analytics: !!yes, ads: !!yes };
    try { window.dispatchEvent(new Event('maraconsent')); } catch (x) {}
    var c = document.querySelector('.cookie'); if (c) c.classList.remove('show');
    setTimeout(mailPopup, 2500);
  }

  /* LinkedIn Insight Tag. Off until LINKEDIN_PARTNER is filled in AND the visitor has said yes
     to advertising cookies (session_consent ends ".d1", the same flag the Session sites use).
     The banner on this site only asks about analytics today, so this stays inert until an
     advertising choice is added. Only page views and conversion ids are sent: never answers,
     names or emails. */
  /* Meta pixel: the same pixel as thesessionlab.com and Mara. Loads only after Accept,
     sends page views and the names of steps (Lead), never names, emails or answers. */
  var META_PIXEL = '1684505053286111';
  function loadMeta() {
    if (!META_PIXEL || !adsOk() || window.fbq) return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('set', 'autoConfig', false, META_PIXEL);
    window.fbq('init', META_PIXEL); window.fbq('track', 'PageView');
  }
  var LINKEDIN_PARTNER = '10118218';
  var LINKEDIN_CONVERSIONS = { lead: '', application: '' };
  function adsOk() { var c = getConsent(); return !!c && /^v1\.a[01]\.d1$/.test(c); }
  function loadLinkedIn() {
    if (!LINKEDIN_PARTNER || !adsOk() || window._linkedin_partner_id) return;
    window._linkedin_partner_id = LINKEDIN_PARTNER;
    window._linkedin_data_partner_ids = (window._linkedin_data_partner_ids || []).concat(LINKEDIN_PARTNER);
    if (!window.lintrk) { window.lintrk = function (a, b) { window.lintrk.q.push([a, b]); }; window.lintrk.q = []; }
    var s = document.createElement('script'); s.async = true; s.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js'; document.head.appendChild(s);
  }
  loadLinkedIn(); loadMeta(); window.addEventListener('maraconsent', function () { loadLinkedIn(); loadMeta(); });
  window.sessionTrack = window.sessionTrack || function (name) {
    var id = name === 'generate_lead' ? LINKEDIN_CONVERSIONS.application : name === 'sign_up' ? LINKEDIN_CONVERSIONS.lead : '';
    if (id && window.lintrk && adsOk()) try { window.lintrk('track', { conversion_id: Number(id) }); } catch (x) {}
    if (window.fbq && adsOk()) try { window.fbq('track', name === 'generate_lead' ? 'SubmitApplication' : 'Lead'); } catch (x) {}
  };

  var cb = document.querySelector('.cookie');
  if (cb) {
    if (getConsent()) cb.remove();
    else {
      cb.classList.add('show');
      cb.querySelector('[data-yes]').addEventListener('click', function () { setConsent(true); });
      cb.querySelector('[data-no]').addEventListener('click', function () { setConsent(false); });
    }
  }

  /* mailing list pop up: once, after the cookie choice, never on the enquiry page */
  var mailStarted = false;
  function mailPopup() {
    if (mailStarted) return; mailStarted = true;
    var m = document.querySelector('.mail'), seen = false;
    try { seen = localStorage.getItem('swj_mail'); } catch (x) {}
    if (!m || seen || /enquire/.test(path)) return;
    var show = function () { if (document.querySelector('.cookie.show')) return; m.classList.add('show'); window.removeEventListener('scroll', onS); };
    var onS = function () { if (window.scrollY > window.innerHeight * .6) show(); };
    window.addEventListener('scroll', onS); setTimeout(show, 9000);
    m.querySelector('.x').addEventListener('click', function () { m.classList.remove('show'); try { localStorage.setItem('swj_mail', '1'); } catch (x) {} });
  }
  if (getConsent()) mailPopup();

  if (/enquire/.test(path)) { var s = document.querySelector('.sticky'); if (s) s.style.display = 'none'; }

  /* reveal on scroll */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .1 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
})();
