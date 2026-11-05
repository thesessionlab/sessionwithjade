/* Waitlist forms. Rows go into the Supabase table "signups" (project sessiontheapp),
   the same table as thesessionapp.com/join.html. The public key below can only add
   rows; it cannot read them. Columns: name, email, interests, consent, source. */
(function () {
  var SUPABASE_URL = "https://pjtrvvtniytnkcjnnfly.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHJ2dnRuaXl0bmtjam5uZmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NDY2NTMsImV4cCI6MjEwNzAyMjY1M30.ECMxr_Sxo1s-82rU5d-ijvnXBcxGb-FpXOfO-JcDFMo";

  function send(row) {
    return fetch(SUPABASE_URL + "/rest/v1/signups", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(row)
    }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); });
  }

  document.querySelectorAll("form.waitlist").forEach(function (f) {
    var msg = f.querySelector(".wl-msg");
    var btn = f.querySelector("button[type=submit]");
    var label = btn.textContent;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.textContent = "";
      var d = new FormData(f);
      if (d.get("website")) return;
      var name = String(d.get("name") || "").trim();
      var email = String(d.get("email") || "").trim().toLowerCase();
      var group = d.get("group");
      if (f.dataset.list === "group" && !group) { msg.textContent = "Please pick a group."; return; }
      if (!name) { msg.textContent = "Please add your name."; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = "Please check your email address."; return; }
      if (!d.get("consent")) { msg.textContent = "Please tick the box so I can email you."; return; }
      var interests = f.dataset.list === "group" ? ["Live workshops", "Group: " + group] : ["Session app waitlist"];
      var row = { name: name.slice(0, 120), email: email.slice(0, 200), interests: interests, consent: true, source: ("sessionwithjade.com " + (f.dataset.source || "")).trim().slice(0, 60) };
      btn.disabled = true; btn.textContent = "Sending...";
      var attempt = function (n) {
        return send(row).catch(function (err) {
          if (n > 0) return new Promise(function (r) { setTimeout(r, 800); }).then(function () { return attempt(n - 1); });
          throw err;
        });
      };
      // Copy into the Mara CRM too, so every list lives in one place.
      try {
        fetch("https://mara.thesessionlab.com/api/intake", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ form: "jade-waitlist", name: row.name, email: row.email, interests: [], waitlist: interests.join(", "), page: location.pathname,
            consent: true, consent_wording: ((f.querySelector(".wl-consent") || {}).textContent || "Waitlist").trim().slice(0, 400) }) }).catch(function () {});
      } catch (x) {}
      attempt(1).then(function () {
        f.querySelector(".wl-fields").style.display = "none";
        msg.textContent = "Thanks " + name.split(" ")[0] + ", you're on the list. I'll email you soon.";
      }).catch(function () {
        msg.textContent = "That didn't send. Please try again, or email jade@thesessionlab.com.";
        btn.disabled = false; btn.textContent = label;
      });
    });
  });
})();
