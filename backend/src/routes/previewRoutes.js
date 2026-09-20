import { Router } from 'express';
import { PropertyModel } from '../models/PropertyModel.js';
import { PropertyMediaModel } from '../models/PropertyMediaModel.js';

/**
 * Link previews for one home.
 *
 * When Bill texts or emails a `/home/:id` link, the receiving app sends a crawler to
 * fetch the page and build the little card. A single-page app hands that crawler an
 * empty shell with the site-wide logo, so every home previews as "Easy Rental" with
 * the same picture. This route answers those crawlers with that home's own title,
 * one line about it, and its primary photo.
 *
 * Only crawlers ever land here — vercel.json routes `/home/:id` to this function only
 * when the user-agent matches a known preview bot. A person following the same link
 * falls through to the app as before. The meta refresh is the belt-and-braces: any
 * browser that does reach this page walks straight on to the real one.
 */
const router = Router();

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

function page({ title, description, image, url, refreshTo }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Easy Rental" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ''}
<meta property="og:url" content="${escapeHtml(url)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
<link rel="canonical" href="${escapeHtml(url)}" />
<meta http-equiv="refresh" content="0;url=${escapeHtml(refreshTo)}" />
</head>
<body>
<p><a href="${escapeHtml(refreshTo)}">${escapeHtml(title)}</a></p>
</body>
</html>`;
}

async function renderHomePreview(req, res, next) {
  try {
    const { id } = req.params;
    const origin = originOf(req);

    if (!/^\d+$/.test(id)) {
      return res.status(404).type('html').send(page({
        title: 'Easy Rental',
        description: 'This home is no longer listed. Browse the homes available now.',
        image: `${origin}/logo-full.png`,
        url: `${origin}/listings`,
        refreshTo: '/listings',
      }));
    }

    const property = await PropertyModel.findById(id);
    if (!property || property.status === 'maintenance') {
      return res.status(404).type('html').send(page({
        title: 'Easy Rental',
        description: 'This home is no longer listed. Browse the homes available now.',
        image: `${origin}/logo-full.png`,
        url: `${origin}/listings`,
        refreshTo: '/listings',
      }));
    }

    const images = await PropertyMediaModel.findByPropertyId(id);
    const primary = images.find(img => img.is_primary) || images[0];

    return res.status(200).type('html').send(page({
      title: oneLine(property.title, 90) || 'Easy Rental',
      description: oneLine(summarize(property), 200),
      image: primary?.url || `${origin}/logo-full.png`,
      url: `${origin}/home/${property.id}`,
      refreshTo: `/home/${property.id}`,
    }));
  } catch (error) {
    next(error);
  }
}

// Mounted twice by app.js, so the route answers whichever path Vercel hands the
// function after the crawler rewrite: the original `/home/:id`, or `/api/home-preview/:id`.
router.get('/home-preview/:id', renderHomePreview);
router.get('/home/:id', renderHomePreview);

export default router;
