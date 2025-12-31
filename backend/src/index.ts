import express from 'express';
import cors from 'cors';
import adlRouter from './api/adl.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', runtime: 'ATLAS', version: '0.1.0' });
});

// ADL API routes
app.use('/api/adl', adlRouter);

app.listen(PORT, () => {
  console.log(`ATLAS Runtime listening on port ${PORT}`);
  console.log(`Repository root: ${process.cwd()}/../repository`);
});
