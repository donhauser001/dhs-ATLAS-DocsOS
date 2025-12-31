import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', runtime: 'ATLAS', version: '0.1.0' });
});

// ADL API routes will be added here
// app.use('/api/adl', adlRouter);

app.listen(PORT, () => {
  console.log(`ATLAS Runtime listening on port ${PORT}`);
});
