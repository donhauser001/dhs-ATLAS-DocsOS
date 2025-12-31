import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { commandRouter } from './api/command.js';
import { queryRouter } from './api/query.js';
import { fsRouter } from './api/fs.js';
import { authRouter } from './api/auth.js';
import { organizationRouter } from './api/organization.js';
import { uploadRouter } from './api/upload.js';
import { errorHandler } from './middleware/error-handler.js';
import { initGitService } from './git/git-service.js';
import { loadCommands } from './commands/command-loader.js';
import { loadStateMachines } from './state-machine/state-machine-loader.js';
import { getAuthService } from './services/auth-service.js';

dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
// 相对于 backend 目录的上一级
const REPOSITORY_PATH = process.env.REPOSITORY_PATH || path.resolve(__dirname, '../../repository');

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// API 路由
app.use('/api/auth', authRouter);
app.use('/api/command', commandRouter);
app.use('/api', queryRouter);
app.use('/api/fs', fsRouter);
app.use('/api/organization', organizationRouter);
app.use('/api/upload', uploadRouter);
app.use('/api', uploadRouter); // 挂载 /api/files/* 路由

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// 错误处理
app.use(errorHandler);

// 启动服务
async function bootstrap() {
  try {
    // 初始化 Git 服务
    await initGitService();
    console.log('[Git] Git 服务初始化完成');

    // 初始化认证服务
    const authService = getAuthService(REPOSITORY_PATH);
    await authService.initialize();
    console.log('[Auth] 认证服务初始化完成');

    // 加载 Command 定义
    await loadCommands();
    console.log('[Command] Command 定义加载完成');

    // 加载状态机定义
    await loadStateMachines();
    console.log('[StateMachine] 状态机定义加载完成');

    app.listen(PORT, () => {
      console.log(`\n[ATLAS Docs OS] 服务启动成功`);
      console.log(`[ATLAS Docs OS] 端口: ${PORT}`);
      console.log(`[ATLAS Docs OS] 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n可用端点:`);
      console.log(`  POST /api/auth/login   - 用户登录`);
      console.log(`  GET  /api/auth/me      - 获取当前用户`);
      console.log(`  GET  /api/auth/users   - 获取用户列表（管理员）`);
      console.log(`  GET  /health           - 健康检查`);
      console.log(`  GET  /api/commands     - 获取所有 Command 定义`);
      console.log(`  POST /api/command      - 执行 Command`);
      console.log(`  GET  /api/projects     - 获取项目列表`);
      console.log(`  POST /api/upload       - 文件上传`);
      console.log(`  GET  /api/files/*      - 获取文件`);
    });
  } catch (error) {
    console.error('[ATLAS Docs OS] 启动失败:', error);
    process.exit(1);
  }
}

bootstrap();

