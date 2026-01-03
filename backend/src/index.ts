import express from 'express';
import cors from 'cors';
import session from 'express-session';
import adlRouter from './api/adl.js';
import workspaceRouter from './api/workspace.js';
import authRouter from './api/auth.js';
import tokensRouter from './api/tokens.js';
import principalsRouter from './api/principals.js';
import profilesRouter from './api/profiles.js';
import functionsRouter from './api/functions.js';
import lintRouter from './api/lint.js';
import navigationRouter from './api/navigation.js';
import labelsRouter from './api/labels.js';
import autoCompleteRouter from './api/auto-complete.js';
import displayConfigRouter from './api/display-config.js';
import dataTemplatesRouter from './api/data-templates.js';
import filesRouter from './api/files.js';
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
app.use(express.text({ type: 'text/plain' }));

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
app.use('/api/tokens', tokensRouter);
// Phase 3.1: Principal + Profile 用户体系
app.use('/api/principals', principalsRouter);
app.use('/api/profiles', profilesRouter);
// Phase 3.3: 功能声明系统
app.use('/api/functions', functionsRouter);
app.use('/api/lint', lintRouter);
app.use('/api/navigation', navigationRouter);
// Phase 3.3+: 标签注册表
app.use('/api/labels', labelsRouter);
// Phase 3.5: 自动补齐系统
app.use('/api/documents', autoCompleteRouter);
// Phase 3.5: 显示配置
app.use('/api/display-config', displayConfigRouter);
// Phase 3.8: 数据模板
app.use('/api/data-templates', dataTemplatesRouter);
// Phase 3.9: 文件管理
app.use('/api/files', filesRouter);

app.listen(config.port, () => {
  console.log(`ATLAS Runtime listening on port ${config.port}`);
  console.log(`Project root: ${config.projectRoot}`);
  console.log(`Repository root: ${config.repositoryRoot}`);
  console.log(`Proposals dir: ${config.proposalsDir}`);
});
