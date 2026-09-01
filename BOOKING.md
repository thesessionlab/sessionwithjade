# Setting up the 20 minute intro call

The site is already built for this. Every "Book a 20 minute intro call" button reads
one line of code, so you set the link up once and paste it once.

Until you paste a link, those buttons quietly fall back to the enquiry form. Nothing
looks broken in the meantime.

---

## Which tool

**Use Calendly if it is already running on thesessionlab.com.** One calendar managing
both sites means one place to change your availability, and no chance of a coaching
call and a Session Lab enquiry landing on the same slot. That reason outweighs any
feature difference between the tools.

Create a new event type rather than reusing an existing one, so you can tell where a
booking came from.

**Google Calendar Appointment Schedule** is the right answer if you have Google
Workspace. It is built into the calendar you already use, checks your real
availability, creates the Google Meet link automatically and emails both of you.
Nothing extra to pay for, nothing extra to log into.

If your Google account is a free personal one, you get a limited version with a
single booking page, which is all you need here.

**Cal.com** is the alternative if Google will not do what you want. Free, connects to
Google Calendar, and gives you reminder emails and buffers between calls on the free
tier. **Calendly** free also works but allows only one event type, so it boxes you in
if you later want a separate corporate call.

---

## Calendly setup

1. In Calendly, **Create → Event type → One-on-one**.
2. Name it `20 minute intro call`. Duration **20 minutes**.
3. Location: **Google Meet** or **Zoom**. Calendly creates and sends the link.
4. Availability: set the windows you genuinely want to take calls. Be conservative.
5. Under **Invitee questions**, keep name and email and add one required question:
   *What are you facing, and when does it happen?* That does most of the qualifying
   before the call starts.
6. Under **Scheduling settings**, set a **15 minute buffer after**, a **daily limit of
   3**, and **12 hours minimum notice**.
7. Copy the event link. It looks like `https://calendly.com/yourname/20min`.

The site detects a Calendly link and loads their inline widget rather than a plain
frame, styled in Session colours with the cookie banner suppressed. Nothing extra to
configure.

**One Calendly setting to check.** In Calendly, go to the event's Confirmation page
settings and make sure the confirmation email is on. That is what sends the meeting
link automatically.

---

## Google Calendar setup (if you go that route instead)

1. Open **calendar.google.com** on a computer.
2. Click **Create** (top left), then **Appointment schedule**.
3. Title: `20 minute intro call with Jade`.
4. Appointment duration: **20 minutes**.
5. **General availability**: set the windows you are genuinely willing to take calls.
   Be conservative. It is better to offer four slots you want than twenty you resent.
6. Click **Next**, then set:
   - **Booked appointment settings → Add video conferencing**: Google Meet. This is
     what generates and sends the link automatically.
   - **Buffer time**: 15 minutes after each. Back to back intro calls are how you end
     up doing them badly.
   - **Maximum bookings per day**: 3 is sensible.
   - **Minimum time before booking**: 12 hours, so nobody books you for 20 minutes
     from now.
7. **Booking form**: keep name and email, and add one question:
   *What are you facing, and when does it happen?* This single question does most of
   the qualifying for you before the call starts.
8. Save, then click **Share** and copy the booking page link. It looks like
   `https://calendar.app.google/XXXXXXXX`.

---

## Paste it into the site

1. Open `index.html`.
2. Near the bottom, find the block that begins `BOOKING LINK`. It looks like this:

       var BOOKING_URL = "";

3. Put your link between the quotes:

       var BOOKING_URL = "https://calendar.app.google/XXXXXXXX";

4. Save. Copy `index.html` over `404.html` so the two match.
5. Commit. Every booking button on the site now opens your calendar, and the booking
   page embeds directly on the Book a call page.

That is the only change needed. There are eight buttons across the site and they all
read that one line.

---

## What the person gets

They pick a slot, fill in name, email and the one question. Google then sends both of
you a calendar invite with the Meet link, and reminders before the call. You do not
have to send anything manually.

---

## Worth doing at the same time

**Keep the form.** Some people will not book a call with a stranger but will send a
message. The form is still on the page below the calendar, and it still needs
connecting to a handler (Formspree or Tally, about five minutes) or it silently
discards enquiries.

**Add analytics.** Plausible or Fathom, one line in the head. Without it you cannot
tell whether people are reaching the booking page and not booking, or never reaching
it at all. Those two problems have opposite fixes.

**Block the time properly.** Intro calls expand to fill whatever you give them.
Twenty minutes with a hard stop is deliberate, and the buffer is what protects it.
