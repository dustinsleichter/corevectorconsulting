# CoreVector Consulting — Custom Website v1

A custom-built, responsive React + Vite site, prepared for **Render Static Sites**. Dark-neon hero, polished interior pages, and optional external Square Appointments and payment links.

## Pages

- `/` — homepage, hero, service overview, engineering approach and calls to action
- `/services` — all six IT service areas
- `/about` — CoreVector philosophy and positioning
- `/booking` — consultation instructions and Square booking link when configured
- `/contact` — configured business contact channels and appointment links

## Run locally (Windows PowerShell)

Requires Node.js 20.19+ or 22.12+.

```powershell
npm install
Copy-Item .env.example .env
notepad .env
npm run dev
```

Open the `localhost` URL shown by Vite. For production verification:

```powershell
npm run build
npm run preview
```

## Configure Square and contact info

In `.env`, set:

```dotenv
VITE_SQUARE_BOOKING_URL=https://YOUR-ACTUAL-BOOKING-LINK
VITE_SQUARE_PAYMENT_URL=
VITE_CONTACT_EMAIL=
VITE_CONTACT_PHONE=
```

Only set booking/payment to real HTTPS links. No checkout, credit card collection or scheduling backend runs on the website. Visitors are redirected to Square for those actions. **There is intentionally no fabricated booking or payment URL**. Without a booking URL, the booking page shows a clear setup-pending message rather than a broken button. Without a payment URL, payment links are hidden. Leave public contact information empty until it is ready.

**Where to find your booking URL:** Square Dashboard > Appointments > Online Booking > Channels > Add your booking flow to an existing site > Get Started > Get URL. See https://squareup.com/help/us/en/article/5355-set-up-online-booking-with-square-appointments

Note: Vite env variables are public client-side configuration, **not secrets**. Never place Square API tokens, credentials or private keys in these variables.

## Deploy with GitHub + Render

1. Create a GitHub repo, e.g. `corevector-website`, and push project source **without** `.env` or `node_modules`.
2. Render Dashboard > **New > Static Site** > connect the GitHub repository.
3. Build command: `npm install && npm run build`; publish directory: `dist`.
4. In Render > Environment, set `VITE_SQUARE_BOOKING_URL` and optional `VITE_SQUARE_PAYMENT_URL`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`. Redeploy after modifying build-time variables.
5. Open the Render-assigned `*.onrender.com` link and test all pages on desktop/mobile.
6. When satisfied, add both `corevectorconsulting.com` and `www.corevectorconsulting.com` as custom domains in Render. Follow **the exact DNS records Render shows for your service** in the Square-managed domain DNS settings. Preserve all existing MX/TXT email records. Do **not** change DNS until ready to cut over.

`render.yaml` included for optional Render Blueprint deployment, with an SPA rewrite so direct requests to `/services`, `/about`, etc. load correctly. When configuring manually, add rewrite: `/*` -> `/index.html` (Rewrite).

## Project notes / things to verify before launch

- Replace/confirm copy and service descriptions; no certifications or client testimonials have been invented.
- Confirm your LLC's approved legal name and use it in business agreements and footer if appropriate.
- Add real public contact information and real Square links when ready.
- Add privacy policy/accessibility review when collecting data or adding analytics. This prototype does not collect visitor data or run tracking scripts.
- Check image licensing: the CoreVector art is user-supplied/previously approved for this project.
- The company domain remains at Square; changing website DNS is not a domain transfer.

## File map

- `src/main.jsx` — pages, data, navigation, Square integration
- `src/styles.css` — global design system, layout, responsiveness
- `public/corevector-brand.webp` — optimized existing CoreVector branding
- `public/favicon.png` — cropped brand mark
- `.env.example` — public configuration sample
- `render.yaml` — Render static site blueprint with rewrite

Design palette: `#090812` base, magenta `#ce1298`, rose `#f34d73`, orange `#ff7939`.
