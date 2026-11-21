/* Session with Jade: pay for private sessions, then choose a time.
   [data-pay="single"|"six"] opens Stripe Checkout through mara.thesessionlab.com.
   If the visitor has just sent the application, its id goes with them so their
   name and email carry over. On /private-coaching/booked/ this checks the payment
   and shows the link to choose a time. */
(function () {
  'use strict';
  var MARA = 'https://mara.thesessionlab.com';
  function utm() { try { return JSON.parse(localStorage.getItem('mara_last_utm') || '{}'); } catch (_) { return {}; } }
  function sub() { try { return sessionStorage.getItem('swj_submission') || ''; } catch (_) { return ''; } }
  function track(name, props) { try { if (window.sessionTrack) window.sessionTrack(name, props || {}); } catch (_) {} }

  document.querySelectorAll('[data-pay]').forEach(function (btn) {
    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      if (btn.disabled) return;
      var plan = btn.getAttribute('data-pay') === 'six' ? 'six' : 'single', label = btn.textContent;
      var note = document.querySelector('[data-paynote]');
      btn.disabled = true; btn.textContent = 'Opening the payment page';
      track('begin_checkout', { value: plan === 'six' ? 1250 : 250, currency: 'GBP', plan: plan });
      try {
        var r = await fetch(MARA + '/api/private/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: plan, submission: sub(), utm: utm(), anon_id: (function () { try { return localStorage.getItem('mara_aid') || ''; } catch (_) { return ''; } })() }) });
        var j = {}; try { j = await r.json(); } catch (_) {}
        if (!r.ok || !j.url) throw new Error(j.error || 'I couldn’t open the payment page. Please try again.');
        location.href = j.url;
      } catch (err) {
        btn.disabled = false; btn.textContent = label;
        if (note) { note.textContent = err.message; note.hidden = false; }
      }
    });
  });

  if (/^\/private-coaching\/start\//.test(location.pathname) && /checkout=cancelled/.test(location.search)) {
    var n = document.querySelector('[data-paynote]'); if (n) { n.textContent = 'Nothing was charged. You can choose an option again whenever you are ready.'; n.hidden = false; }
  }

  var booked = document.getElementById('booked');
  if (booked) {
    var id = new URLSearchParams(location.search).get('session_id') || '';
    var tries = 0;
    var show = function (sel) { booked.querySelectorAll('[data-state]').forEach(function (el) { el.hidden = el.getAttribute('data-state') !== sel; }); };
    var check = async function () {
      tries++;
      try {
        var r = await fetch(MARA + '/api/private/confirm?session_id=' + encodeURIComponent(id));
        var j = await r.json();
        if (!r.ok) throw new Error(j.error || '');
        if (!j.paid) { if (tries < 6) return setTimeout(check, 2500); return show('wait'); }
        booked.querySelectorAll('[data-first]').forEach(function (el) { el.textContent = j.first_name ? ', ' + j.first_name : ''; });
        booked.querySelectorAll('[data-what]').forEach(function (el) { el.textContent = j.plan === 'six' ? 'your six sessions' : 'your first session'; });
        booked.querySelectorAll('[data-six]').forEach(function (el) { el.hidden = j.plan !== 'six'; });
        booked.querySelectorAll('[data-booklink]').forEach(function (a) { a.href = j.book_url; });
        show('paid');
        if (!sessionStorage.getItem('swj_paid_' + id)) { try { sessionStorage.setItem('swj_paid_' + id, '1'); } catch (_) {} track('purchase', { value: j.plan === 'six' ? 1250 : 250, currency: 'GBP', transaction_id: id }); }
      } catch (_) { show('wait'); }
    };
    if (id) check(); else show('wait');
  }
})();
