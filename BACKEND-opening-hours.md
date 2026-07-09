# Backend: `/api/opening-hours`

Frontend'en (åbningstids-tabellen + "åbent nu"-badge) henter live data fra
`https://beerhere.dk/api/opening-hours` — på nøjagtig samme måde som events henter
fra `/api/events`. Google API-nøglen **må aldrig** ligge i den statiske frontend, så
selve Google-opslaget skal ske her, server-side, i Beer Here-backend'en.

Dette dokument er specifikationen + en reference-implementering til det endpoint.
Frontend'en er allerede bygget og falder tilbage til den statiske 11–21-tabel, hvis
endpointet ikke svarer — så I kan deploye frontend nu og backend bagefter.

---

## Forudsætning (vigtig)

Automatisk hentning giver kun mening, hvis åbningstiderne **vedligeholdes i Google
Business Profile**. Data trækkes fra jeres Google-profil — ikke fra Facebook.

- **Faste tider** → sæt "Åbningstider" i Google Business Profile.
- **Afvigelser** (helligdage, lukkedage, særlige events) → brug "Særlige åbningstider"
  i Google Business Profile. De kommer automatisk med i `currentOpeningHours` nedenfor.

I dag opdaterer I Facebook. Hvis I skifter til at opdatere Google (eller begge),
opdaterer hjemmesiden sig selv. Gør I ikke det, viser siden bare de faste tider.

Google's Facebook-side kan **ikke** bruges direkte som kilde med rimelig indsats —
Facebook Graph API kræver egen app, tokens der udløber og app-review, kun for at
læse et `hours`-felt. Google er den rigtige kilde.

---

## Google-opsætning (engangsarbejde)

1. Opret et projekt i [Google Cloud Console](https://console.cloud.google.com).
2. Aktivér **Places API (New)**.
3. Opret en **API-nøgle**. Begræns den:
   - *Application restriction*: IP-adresser → jeres server-IP (nøglen bruges kun server-side).
   - *API restriction*: kun Places API.
4. Find jeres **Place ID**: https://developers.google.com/maps/documentation/places/web-service/place-id
   (søg efter "Penyllan Bar & Shop, Tejn").
5. Læg nøgle + Place ID i miljøvariabler på serveren:
   ```
   GOOGLE_MAPS_API_KEY=...
   PENYLLAN_PLACE_ID=...
   ```

> **Billing:** `regularOpeningHours` / `currentOpeningHours` ligger i Places API (New)'s
> "Enterprise"-SKU. Med caching (nedenfor) rammer I ét kald i timen ≈ ~730 kald/md,
> hvilket typisk er inden for gratiskvoten — men tjek jeres egen billing.

---

## JSON-kontrakt (det frontend forventer)

`GET /api/opening-hours` → `200 application/json`:

```json
{
  "openNow": true,
  "days": [
    { "day": 0, "open": "12:00", "close": "20:00" },
    { "day": 1, "open": "11:00", "close": "21:00" },
    { "day": 2, "open": "11:00", "close": "21:00" },
    { "day": 3, "open": "11:00", "close": "21:00" },
    { "day": 4, "open": "11:00", "close": "21:00" },
    { "day": 5, "open": "11:00", "close": "22:00" },
    { "day": 6, "closed": true }
  ]
}
```

Regler:
- `day`: JS `getDay()`-konvention — **0 = søndag … 6 = lørdag** (samme som Google's API).
- `open` / `close`: `"HH:MM"` i 24-timers format, lokal tid (Europe/Copenhagen).
- `closed: true`: dagen er lukket (udelad `open`/`close`).
- `openNow`: boolean. Backend er autoritativ her, fordi den kan tage højde for
  særlige åbningstider og tidszone. (Sender I `null`, regner frontend selv "åbent nu"
  ud fra `days` — men uden hensyn til helligdage.)
- Er alle 7 dage ens, viser frontend automatisk én "Hver dag"-række; ellers én række pr. dag.

---

## Reference-implementering (Node / Express)

Tilpas til jeres faktiske backend-stack — det vigtige er formen på output.

```js
// opening-hours.js
const PLACE_ID = process.env.PENYLLAN_PLACE_ID;
const API_KEY  = process.env.GOOGLE_MAPS_API_KEY;

// Cache: ét Google-kald i timen er rigeligt for åbningstider.
let cache = { at: 0, body: null };
const TTL_MS = 60 * 60 * 1000; // 1 time

// "HHMM"/{hour,minute} -> "HH:MM"
const hhmm = (h, m) => String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');

// Google's periods[] -> vores days[]. Google: open/close = { day, hour, minute },
// day 0=søndag..6=lørdag. Vi antager normal drift (åbner og lukker samme dag).
function periodsToDays(periods = []) {
  const byDay = {};
  for (const p of periods) {
    if (!p.open) continue;
    const d = p.open.day;
    // 24/7-steder har kun open uden close — irrelevant her, men vær robust:
    if (!p.close) { byDay[d] = { day: d, open: hhmm(p.open.hour, p.open.minute), close: '23:59' }; continue; }
    byDay[d] = {
      day: d,
      open:  hhmm(p.open.hour,  p.open.minute),
      close: hhmm(p.close.hour, p.close.minute),
    };
  }
  // Fyld manglende dage ud som lukket.
  const days = [];
  for (let d = 0; d < 7; d++) days.push(byDay[d] || { day: d, closed: true });
  return days;
}

async function fetchFromGoogle() {
  const url = 'https://places.googleapis.com/v1/places/' + encodeURIComponent(PLACE_ID);
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      // regularOpeningHours = faste tider; currentOpeningHours = inkl. særlige/helligdage.
      'X-Goog-FieldMask': 'regularOpeningHours,currentOpeningHours',
    },
  });
  if (!res.ok) throw new Error('Places API ' + res.status);
  const data = await res.json();

  const regular = data.regularOpeningHours || {};
  const current = data.currentOpeningHours || regular;

  return {
    // currentOpeningHours.openNow tager højde for særlige åbningstider.
    openNow: typeof current.openNow === 'boolean' ? current.openNow : null,
    // Vis de faste ugetider i tabellen (currentOpeningHours dækker kun denne uge).
    days: periodsToDays(regular.periods),
  };
}

// Express-handler
module.exports = async function openingHours(req, res) {
  try {
    if (Date.now() - cache.at > TTL_MS || !cache.body) {
      cache = { at: Date.now(), body: await fetchFromGoogle() };
    }
    res.set('Cache-Control', 'public, max-age=900'); // 15 min i browser/CDN
    res.json(cache.body);
  } catch (err) {
    // Ved fejl: hvis vi har en gammel cache, server den; ellers 503.
    if (cache.body) return res.json(cache.body);
    res.status(503).json({ error: 'opening-hours unavailable' });
  }
};
```

Registrér ruten samme sted som `/api/events`:

```js
app.get('/api/opening-hours', require('./opening-hours'));
```

---

## CORS

`/api/events` fungerer allerede fra frontend'en, så CORS er formentlig sat op. Sørg
for at `/api/opening-hours` serveres med samme `Access-Control-Allow-Origin` som events.

## Test

```bash
curl -s https://beerhere.dk/api/opening-hours | jq
```

Ret så åbningstiderne i Google Business Profile, vent til cachen udløber (eller ryd
den), og bekræft at både `curl`-svaret og hjemmesiden opdaterer sig.
