/* Session with Jade: puts a hosted tool or the application on this site.
   Usage: <div class="tool" data-form="communication_confidence" data-next="..."></div>
   The tool itself runs on mara.thesessionlab.com/f/<key> (the same engine, contacts,
   consent and emails as the rest of the CRM). This file:
     1. passes the visitor's anonymous id and campaign tags into the tool, so the
        first visit, the campaign and the finished tool all land on one contact
     2. sizes the frame to its content, so there is no inner scroll bar
     3. counts the finish as a lead conversion (no answers, names or emails are sent)
     4. shows a friendly note if the tool is not open yet */
(function () {
  'use strict';
  var MARA = 'https://mara.thesessionlab.com';
  function aid() {
    try { var a = localStorage.getItem('mara_aid'); if (!a) { a = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('mara_aid', a); } return a; } catch (_) { return ''; }
  }
  function utm() {
    var out = {}, q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (q.get(k)) out[k] = q.get(k); });
    try { var s = localStorage.getItem('mara_last_utm'); var internal = out.utm_source === 'sessionwithjade'; if (Object.keys(out).length && !(internal && s)) localStorage.setItem('mara_last_utm', JSON.stringify(out)); else if (s) out = JSON.parse(s); } catch (_) {}
    return out;
  }
  document.querySelectorAll('[data-form]').forEach(function (box) {
    var key = box.getAttribute('data-form');
    var src = new URL(MARA + '/f/' + encodeURIComponent(key));
    src.searchParams.set('embed', '1');
    var a = aid(); if (a) src.searchParams.set('aid', a);
    var u = utm(); Object.keys(u).forEach(function (k) { src.searchParams.set(k, u[k]); });
    if (!u.utm_source) { src.searchParams.set('utm_source', document.referrer && !/sessionwithjade\.com/.test(document.referrer) ? 'referral' : 'direct'); src.searchParams.set('utm_medium', 'website'); }
    var frame = document.createElement('iframe');
    frame.src = src.toString(); frame.title = box.getAttribute('data-title') || 'Free tool';
    frame.setAttribute('loading', 'lazy'); frame.style.cssText = 'width:100%;border:0;min-height:720px;display:block;background:transparent';
    box.appendChild(frame);
    fetch(MARA + '/api/growth/public/forms/' + encodeURIComponent(key)).then(function (r) {
      if (r.ok) return;
      frame.remove();
      var p = document.createElement('div'); p.className = 'toolnote';
      p.innerHTML = '<p>This tool opens very soon. In the meantime, try one of the <a class="tl" href="/free-tools/">other free tools</a>.</p>';
      box.appendChild(p);
    }).catch(function () {});
    window.addEventListener('message', function (e) {
      if (e.origin !== MARA || !e.data || e.source !== frame.contentWindow) return;
      if (e.data.type === 'mara-form-height' && e.data.height > 200) frame.style.height = (e.data.height + 24) + 'px';
      if (e.data.type === 'mara-form-done' && e.data.form === key) {
        try { if (window.sessionTrack) window.sessionTrack(key === 'private_application' ? 'generate_lead' : 'sign_up', { method: key }); } catch (_) {}
        if (e.data.submission) document.querySelectorAll('[data-guide]').forEach(function (a) { a.href = MARA + '/g/' + a.getAttribute('data-guide') + '/' + encodeURIComponent(e.data.submission); });
        var next = box.getAttribute('data-done');
        if (next) { var el = document.getElementById(next); if (el) el.hidden = false; }
        try { window.scrollTo({ top: box.getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' }); } catch (_) {}
      }
    });
  });
})();
