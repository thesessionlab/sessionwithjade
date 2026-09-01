# sessionwithjade.com

Personal site for Jade Matthew. Performance, communication and relationship coaching.
Static, no build step, no dependencies. Deployed on GitHub Pages.

Sister properties: [thesessionlab.com](https://www.thesessionlab.com) (Session) and
[mara.thesessionlab.com](https://mara.thesessionlab.com) (Mara).

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire site. Eight views, hash routed. |
| `404.html` | Copy of index so deep links resolve. |
| `CNAME` | Tells GitHub Pages the custom domain. Do not delete. |
| `.nojekyll` | Stops GitHub running Jekyll over the files. |
| `robots.txt`, `sitemap.xml` | Search basics. |
| `assets/` | Local images. Currently empty by design. |

## Deploy to GitHub Pages

1. Create a new repository at github.com/new. Name it `sessionwithjade`. Public.
   Do not add a README, GitHub will not need one.
2. Upload every file in this folder to the root of the repo, including the hidden
   `.nojekyll`. Drag and drop into the browser works fine.
3. Repo → Settings → Pages. Under "Build and deployment", set Source to
   "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
4. Wait for the first build, roughly a minute. The site appears at
   `https://<your-username>.github.io/sessionwithjade/`.
5. Still on the Pages screen, put `sessionwithjade.com` in the Custom domain field
   and save. GitHub will check DNS and show a warning until step two below is done.

## Point the GoDaddy domain at it

In GoDaddy: My Products → Domains → sessionwithjade.com → DNS → Manage Zones.

Add four A records for the apex domain:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | 185.199.108.153 | 1 hour |
| A | @ | 185.199.109.153 | 1 hour |
| A | @ | 185.199.110.153 | 1 hour |
| A | @ | 185.199.111.153 | 1 hour |

And one CNAME for the www subdomain:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | www | `<your-username>.github.io` | 1 hour |

Delete any GoDaddy parking records that already sit on `@` or `www`, otherwise they
fight the new ones. Leave MX and TXT records alone if email runs on this domain.

Propagation is usually under an hour. Once GitHub's Pages screen shows the domain as
verified, tick **Enforce HTTPS**. The certificate is issued automatically and free.

## Before it goes live

- [ ] Replace the three placeholder testimonials on the home page
- [ ] Confirm the five systems of presence names on the ICOP page
- [ ] Decide whether coaching prices are published or stay by application
- [ ] Connect the enquiry form (Formspree, Tally or Netlify Forms) and the calendar link
- [ ] Add a local copy of the portrait to `assets/` and update the two `src` values
- [ ] Add a link from thesessionlab.com back to this site
- [ ] Add privacy and cookie pages if the form collects anything

## Editing

Everything is in `index.html`. Design tokens are the CSS custom properties at the top:
`--ink` `#0a0a0a`, `--gold` `#b8965a`, `--paper` `#f7f5f2`. Type is Cormorant Garamond
for display and Jost for everything else, loaded from Google Fonts.

Copy rules that must hold: British English, middots as separators, no dashes, Mara is
an interactive performance coach, nothing framed as therapy or clinical anxiety.

After editing `index.html`, copy it over `404.html` so the two stay identical.
