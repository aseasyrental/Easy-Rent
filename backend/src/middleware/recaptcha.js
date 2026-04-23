const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

export async function verifyRecaptcha(token) {
  if (!RECAPTCHA_SECRET) {
    console.warn('[recaptcha] RECAPTCHA_SECRET_KEY not configured — skipping verification');
    return { success: true, score: 1.0 };
  }
  if (!token) {
    return { success: false, score: 0 };
  }

  const params = new URLSearchParams();
  params.append('secret', RECAPTCHA_SECRET);
  params.append('response', token);

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: params,
  });

  const data = await res.json();
  return {
    success: data.success && (data.score == null || data.score >= 0.5),
    score: data.score,
  };
}
