/**
 * Server entry point for RetroNode
 */
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`RetroNode server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});