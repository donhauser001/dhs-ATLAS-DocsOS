import express from 'express';
import cors from 'cors';
import session from 'express-session';
import adlRouter from './api/adl.js';
import workspaceRouter from './api/workspace.js';
import authRouter from './api/auth.js';
import { config, validateConfig, ensureDirectories } from './config.js';
import { optionalAuth } from './middleware/permission.js';

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

// CORS 配置
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// Session 配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'atlas-runtime-secret-key-dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// 可选认证中间件（所有请求都加载用户信息）
app.use(optionalAuth);

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    runtime: 'ATLAS', 
    version: '1.0.0',
    repository_root: config.repositoryRoot,
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/adl', adlRouter);
app.use('/api/workspace', workspaceRouter);

app.listen(config.port, () => {
  console.log(`ATLAS Runtime listening on port ${config.port}`);
  console.log(`Project root: ${config.projectRoot}`);
  console.log(`Repository root: ${config.repositoryRoot}`);
  console.log(`Proposals dir: ${config.proposalsDir}`);
});
