import app from './app.js';

// JWT_SECRET is validated inside app.js, so it covers both this local entry point
// and the Vercel serverless entry (api/index.js) which imports app.js directly.

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Easy Rental API running on port ${PORT}`);
});
