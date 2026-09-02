import app from './app.js';

const PORT = process.env.PORT || 8001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Node.js server listening on http://0.0.0.0:${PORT}`);
});
