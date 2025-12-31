import express from 'express';
import cors from 'cors';
import adlRouter from './api/adl.js';
import { config, validateConfig, ensureDirectories } from './config.js';

const app = express();

// 启动时验证配置
const configValidation = validateConfig();
if (!configValidation.valid) {
  console.error('Configuration errors:');
  configValidation.errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
}

// 确保必要目录存在
ensureDirectories();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    runtime: 'ATLAS', 
    version: '0.5.0',
    repository_root: config.repositoryRoot,
  });
});

// ADL API routes
app.use('/api/adl', adlRouter);

app.listen(config.port, () => {
  console.log(`ATLAS Runtime listening on port ${config.port}`);
  console.log(`Project root: ${config.projectRoot}`);
  console.log(`Repository root: ${config.repositoryRoot}`);
  console.log(`Proposals dir: ${config.proposalsDir}`);
});
