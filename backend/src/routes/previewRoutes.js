import { Router } from 'express';
import { PropertyModel } from '../models/PropertyModel.js';
import { PropertyMediaModel } from '../models/PropertyMediaModel.js';

/**
 * One home's own page: /home/:id
 *
 * When Bill texts a home's link, the receiving app fetches the page to build the little
 * card. A single-page app hands back one shell whose head carries the site-wide logo and
 * "Easy Rental — Find Your Next Home", so every home previewed as the whole website.
 *
 * We used to answer only known preview bots (a user-agent list in vercel.json) with a
 * stub page. That list can never be complete — Android's Google Messages fetches with
 * `GoogleMessages`, which was not on it, and Bill saw the site-wide card again.
 *
 * So there is no user-agent branching any more. EVERY visitor of /home/:id gets the real
 * app shell with this home's tags written into its head: a crawler reads the card it
 * came for, a person's browser boots the app at the same address exactly as before.
 * That is also why nothing here may carry a meta refresh — it would bounce a real
 * browser off the page it just landed on.
 */
const router = Router();

// How long a fetched shell stays good in this instance's memory. The shell only changes
// on a deploy, and a warm instance would otherwise re-fetch it on every single view.
const SHELL_TTL_MS = 60_000;
const SHELL_TIMEOUT_MS = 5000;

// The CDN can serve a different body to a crawler than to a person. Ask as a browser.
const SHELL_FETCH_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const SITE_NAME = 'Easy Rental';
const SITE_DESCRIPTION =
  'Browse rental homes in the Lower Mainland. Search by map, filter by price and bedrooms, and inquire directly with Easy Rental property management.';
const GONE_TITLE = 'This home is no longer listed';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Preview cards are one line of plain text. Collapse the newlines out of Bill's
// listing copy and cut it at a whole word.
function oneLine(value, max) {
  const flat = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `$${n.toLocaleString('en-CA')}` : null;
}

function priceLine(property) {
  if (property.listing_type === 'short_term') {
    if (property.price_daily != null) return `${money(property.price_daily)}/night`;
    if (property.price_weekly != null) return `${money(property.price_weekly)}/week`;
    if (property.price_monthly != null) return `${money(property.price_monthly)}/month`;
    return null;
  }
  return property.price != null ? `${money(property.price)}/month` : null;
}

function summarize(property) {
  const bits = [];
  const price = priceLine(property);
  if (price) bits.push(price);
  if (property.bedrooms != null) bits.push(`${property.bedrooms} bed`);
  if (property.bathrooms != null) bits.push(`${property.bathrooms} bath`);
  if (property.city) bits.push(property.city);
  if (property.listing_type === 'short_term') bits.push('Furnished');
  if (property.status === 'occupied') bits.push('Leased');

  const facts = bits.join(' · ');
  const blurb = oneLine(property.description, 120);
  if (facts && blurb) return `${facts} — ${blurb}`;
  return facts || blurb || 'A rental home from Easy Rental.';
}

function originOf(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${String(proto).split(',')[0]}://${host}`;
}

// The browser tab reads "<home> — Easy Rental"; the card's own title stays the bare home
// title, because the card already shows the site name on its own line.
function withSiteName(title) {
  const base = String(title ?? '').trim();
  if (!base) return SITE_NAME;
  if (base === SITE_NAME || base.endsWith(` — ${SITE_NAME}`)) return base;
  return `${base} — ${SITE_NAME}`;
}

/* ------------------------------------------------------------------ *
 * The head we write
 * ------------------------------------------------------------------ */

function metaBlock({ cardTitle, description, image, url }) {
  return [
    // Our block goes first in the head, which would push the shell's own charset past the
    // first 1024 bytes a parser sniffs — so the charset leads, and the shell's copy is
    // taken out below. Bill's copy is full of em dashes and middots; they must survive.
    '<meta charset="utf-8" />',
    `<title>${escapeHtml(withSiteName(cardTitle))}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeHtml(cardTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(cardTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
  ].join('\n');
}

/* ------------------------------------------------------------------ *
 * The head we take out
 * ------------------------------------------------------------------ */

// Read one attribute off a tag, tolerant of order, spacing and quote style.
function attrValue(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'));
  if (!match) return null;
  return match[2] ?? match[3] ?? match[4] ?? '';
}

function isManagedMeta(tag) {
  const name = (attrValue(tag, 'name') || '').trim().toLowerCase();
  const property = (attrValue(tag, 'property') || '').trim().toLowerCase();
  const httpEquiv = (attrValue(tag, 'http-equiv') || '').trim().toLowerCase();

  // A refresh in the shell's head would bounce the visitor off the page — never serve one.
  if (httpEquiv === 'refresh') return true;

  // Our block declares the charset; a second declaration lower down is dead weight.
  if (attrValue(tag, 'charset') !== null) return true;

  // Some writers use name= where the spec says property= and the other way round,
  // so check both keys for both families.
  for (const key of [name, property]) {
    if (key === 'description') return true;
    if (key.startsWith('og:')) return true;
    if (key.startsWith('twitter:')) return true;
  }
  return false;
}

function stripManagedHeadTags(head) {
  return head
    .replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, tag => (isManagedMeta(tag) ? '' : tag))
    .replace(/<link\b[^>]*>/gi, tag =>
      (attrValue(tag, 'rel') || '').trim().toLowerCase() === 'canonical' ? '' : tag)
    // Each removed tag leaves its blank line behind. Tidy the gap so the head Bill's
    // visitors view-source on reads like a page and not like a deletion.
    .replace(/(?:[ \t]*\r?\n){3,}/g, '\n\n');
}

// Put this home's tags at the very top of the head, then hand back the rest of the
// shell untouched — same scripts, same stylesheets, same <div id="root">.
// Returns null when the document has no head to work with; the caller then falls back.
function mergeHead(shellHtml, block) {
  const open = shellHtml.match(/<head\b[^>]*>/i);
  if (!open) return null;
  const headStart = open.index + open[0].length;
  const closeIndex = shellHtml.search(/<\/head\s*>/i);
  if (closeIndex < headStart) return null;

  return shellHtml.slice(0, headStart)
    + `\n${block}\n`
    + stripManagedHeadTags(shellHtml.slice(headStart, closeIndex))
    + shellHtml.slice(closeIndex);
}

/* ------------------------------------------------------------------ *
 * The shell
 * ------------------------------------------------------------------ */

let shellCache = null; // { url, html, fetchedAt }

// On Vercel this is the site's own front door, which the catch-all rewrite serves as
// index.html. It is not a /home/... address, so the function never calls itself.
// SHELL_URL only exists so a local backend can read the Vite dev server instead.
function shellUrlFor(origin) {
  const override = String(process.env.SHELL_URL || '').trim();
  return override || `${origin}/`;
}

async function loadShell(url) {
  const now = Date.now();
  if (shellCache && shellCache.url === url && now - shellCache.fetchedAt < SHELL_TTL_MS) {
    return shellCache.html;
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': SHELL_FETCH_UA, Accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
    signal: AbortSignal.timeout(SHELL_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`shell at ${url} answered ${response.status}`);

  const html = await response.text();
  if (!/<head\b[^>]*>/i.test(html) || !/<\/head\s*>/i.test(html)) {
    throw new Error(`shell at ${url} has no <head> … </head>`);
  }

  shellCache = { url, html, fetchedAt: now };
  return html;
}

/* ------------------------------------------------------------------ *
 * The fallback: the old stub, unchanged
 * ------------------------------------------------------------------ */

// If the shell cannot be fetched we still owe the visitor a page. This is exactly what
// this route served before — minimal tags plus a refresh that walks a browser on to the
// real app. It is the one place a refresh belongs, because this page has no app in it.
function stubPage({ stubTitle, description, image, url, refreshTo }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(stubTitle)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Easy Rental" />
<meta property="og:title" content="${escapeHtml(stubTitle)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ''}
<meta property="og:url" content="${escapeHtml(url)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(stubTitle)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
<link rel="canonical" href="${escapeHtml(url)}" />
<meta http-equiv="refresh" content="0;url=${escapeHtml(refreshTo)}" />
</head>
<body>
<p><a href="${escapeHtml(refreshTo)}">${escapeHtml(stubTitle)}</a></p>
</body>
</html>`;
}

/* ------------------------------------------------------------------ *
 * The route
 * ------------------------------------------------------------------ */

// A home that isn't there any more, or an id that was never a home. The app's own panel
// says so on screen; these are the tags that say so in the tab and on the card.
function goneCard(origin) {
  return {
    status: 404,
    cardTitle: GONE_TITLE,
    stubTitle: SITE_NAME,
    description: SITE_DESCRIPTION,
    image: `${origin}/logo-full.png`,
    url: `${origin}/listings`,
    refreshTo: '/listings',
  };
}

async function buildCard(id, origin) {
  if (!/^\d+$/.test(id)) return goneCard(origin);

  const property = await PropertyModel.findById(id);
  if (!property || property.status === 'maintenance') return goneCard(origin);

  const images = await PropertyMediaModel.findByPropertyId(id);
  const primary = images.find(img => img.is_primary) || images[0];
  const title = oneLine(property.title, 90) || SITE_NAME;

  return {
    status: 200,
    cardTitle: title,
    stubTitle: title,
    description: oneLine(summarize(property), 200),
    image: primary?.url || `${origin}/logo-full.png`,
    url: `${origin}/home/${property.id}`,
    refreshTo: `/home/${property.id}`,
  };
}

async function renderHome(req, res, next) {
  try {
    const { id } = req.params;
    const origin = originOf(req);
    const card = await buildCard(id, origin);

    let merged = null;
    try {
      const shell = await loadShell(shellUrlFor(origin));
      merged = mergeHead(shell, metaBlock(card));
      if (!merged) throw new Error(`shell at ${shellUrlFor(origin)} had no usable <head>`);
    } catch (error) {
      // fetch() hides the real reason (ECONNREFUSED and friends) one level down.
      const why = error.cause?.message ? `${error.message} — ${error.cause.message}` : error.message;
      console.warn(
        `[easy-rental] /home/${id}: could not read the app shell — ${why}. `
        + 'Served the old redirect stub instead: the link preview is still correct, but a '
        + 'person following the link gets a bounce rather than the app. Check that '
        + `${shellUrlFor(origin)} answers 200 with an HTML page.`
      );
    }

    res.set('Content-Type', 'text/html; charset=utf-8');

    if (merged) {
      // A real home may sit on the CDN for five minutes, so a title Bill edits shows up
      // quickly and a shared link costs nothing to re-open. Nothing else is cached.
      res.set('Cache-Control', card.status === 200
        ? 'public, s-maxage=300, stale-while-revalidate=3600'
        : 'no-store');
      return res.status(card.status).send(merged);
    }

    res.set('Cache-Control', 'no-store');
    return res.status(card.status).send(stubPage(card));
  } catch (error) {
    next(error);
  }
}

// Mounted twice by app.js, so the route answers whichever path Vercel hands the
// function: the real address `/home/:id`, or `/api/home-preview/:id`.
router.get('/home-preview/:id', renderHome);
router.get('/home/:id', renderHome);

export default router;
