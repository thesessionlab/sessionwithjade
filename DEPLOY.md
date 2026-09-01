# Getting sessionwithjade.com live

Two routes. Both are free. Pick one, not both.

**Short answer: use GitHub Pages.** This is a static site with no server, no
database and no build step. Pages is built for exactly that, it never sleeps, and
the HTTPS certificate is automatic. Render is the better choice only if you plan to
add a backend later, for example an enquiry form that writes somewhere, or a shared
login with Mara. If that is the plan, skip to Route B.

---

## Step 1 · Get the files into GitHub (needed for both routes)

You do not need Git installed. The browser upload works.

1. Go to **github.com** and sign in. If you do not have an account, create one first.
   Use an email you will keep.
2. Go to **github.com/new**.
3. Repository name: `sessionwithjade`. Description optional. Set it to **Public**.
   Leave "Add a README file" unticked, since the zip already has one.
4. Click **Create repository**.
5. On the next screen click **uploading an existing file**.
6. Unzip `sessionwithjade-repo.zip` on your machine. Open the folder, select
   everything inside it, and drag it into the browser window.
   Do not drag the folder itself, drag its contents, or your files end up one level
   too deep and nothing works.
7. Important: macOS hides files starting with a dot. Press **Cmd + Shift + .** in
   Finder to reveal `.nojekyll`, then include it in the selection. On Windows,
   View → Show → Hidden items.
8. In the "Commit changes" box type `Initial site`. Click **Commit changes**.

You should now see `index.html`, `404.html`, `CNAME`, `README.md`, `robots.txt`,
`sitemap.xml`, `.nojekyll` and an `assets` folder in the repo.

---

## Route A · GitHub Pages (recommended)

### Turn Pages on

1. In the repo, click **Settings**, then **Pages** in the left sidebar.
2. Under "Build and deployment", set Source to **Deploy from a branch**.
3. Branch: **main**. Folder: **/ (root)**. Click **Save**.
4. Wait about a minute. Refresh. A green banner appears with your live URL,
   `https://YOURNAME.github.io/sessionwithjade/`. Click it and check the site loads.
5. Still on the Pages screen, in **Custom domain** type `sessionwithjade.com` and
   click Save. It will show a DNS warning. That is expected until the next step.

### Point GoDaddy at it

In GoDaddy: **My Products → Domains → sessionwithjade.com → DNS**.

First delete any existing records on `@` or `www`. GoDaddy adds parking records by
default and they will fight the new ones. Leave any MX or TXT records alone.

Then add these five records:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | 185.199.108.153 | 1 hour |
| A | @ | 185.199.109.153 | 1 hour |
| A | @ | 185.199.110.153 | 1 hour |
| A | @ | 185.199.111.153 | 1 hour |
| CNAME | www | YOURNAME.github.io | 1 hour |

Replace `YOURNAME` with your actual GitHub username. The trailing dot GoDaddy
sometimes adds is fine.

### Finish

1. Wait. Usually 10 to 60 minutes, occasionally longer.
2. Go back to repo Settings → Pages. The warning should clear and show a tick.
3. Tick **Enforce HTTPS**. If the box is greyed out, the certificate is still being
   issued. Come back in an hour, it will be there.
4. Visit `https://sessionwithjade.com`. Done.

---

## Route B · Render (only if you want a backend later)

1. Go to **render.com**, sign up, and choose **Sign in with GitHub** so it can see
   your repositories.
2. Dashboard → **New +** → **Static Site**.
3. Connect the `sessionwithjade` repository.
4. Settings:
   - Name: `sessionwithjade`
   - Branch: `main`
   - Build Command: **leave completely empty**
   - Publish Directory: `.` (a single full stop)
5. Click **Create Static Site**. It deploys in under a minute to
   `sessionwithjade.onrender.com`.
6. In the site's dashboard go to **Settings → Custom Domains → Add Custom Domain**.
   Add both `sessionwithjade.com` and `www.sessionwithjade.com`.
7. Render then shows you the exact DNS values to use. **Use the values Render shows
   you, not the ones in this document**, because they differ per account and Render
   changes them. Broadly you will add an A record on `@` pointing at Render's IP and
   a CNAME on `www` pointing at `sessionwithjade.onrender.com`.
8. Enter those in GoDaddy exactly as above, deleting the parking records first.
9. Render issues the certificate automatically once DNS resolves.

One difference worth knowing: Render's free static sites do not sleep, but if you
later add a backend service on the free tier, that service will sleep after
inactivity and take about 50 seconds to wake. That is the trade you are accepting
in exchange for the option.

If you pick Render, delete the `CNAME` file from the repo. It is a GitHub Pages
instruction and does nothing useful elsewhere.

---

## Making changes afterwards

The whole site is one file. To edit:

1. Open the repo on GitHub, click `index.html`, click the pencil icon.
2. Make the change, scroll down, click **Commit changes**.
3. The live site updates in under a minute on either host.

After editing `index.html`, do the same edit to `404.html`, or just delete `404.html`
and re-upload a copy of the new `index.html` renamed. The two need to stay identical.

---

## If something is wrong

**404 on the live URL.** The files went in one level too deep. Check that
`index.html` sits at the top of the repo, not inside a `sessionwithjade` folder.

**Site loads but has no styling.** Usually `.nojekyll` is missing. Upload it.

**Domain does not resolve after two hours.** An old GoDaddy parking record is still
on `@` or `www`. Delete it, or check for a forwarding rule under GoDaddy's
Forwarding section, which silently overrides DNS.

**Certificate warning in the browser.** Normal in the first hour. If it persists,
remove the custom domain in GitHub or Render, save, then add it back.

---

## Before you tell anyone the address

- [ ] Replace the three placeholder testimonials on the home page
- [ ] Confirm the five systems of presence names on the ICOP page
- [ ] Connect the enquiry form. Formspree or Tally, about five minutes. Right now
      the form does nothing at all
- [ ] Decide whether coaching prices are published or stay by application
- [ ] Move the portrait into `assets/` rather than relying on the postimg URL
- [ ] Add a link from thesessionlab.com back to this site
- [ ] Add privacy and cookie pages before the form collects anything
