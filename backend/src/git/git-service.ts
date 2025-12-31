import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import cron from 'node-cron';

let git: SimpleGit;
let repoPath: string;

/**
 * 初始化 Git 服务
 */
export async function initGitService(): Promise<void> {
  repoPath = path.resolve(
    process.cwd(),
    process.env.REPOSITORY_PATH || '../repository'
  );

  git = simpleGit(repoPath);

  // 检查是否是 Git 仓库
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    console.log('[Git] 初始化新仓库...');
    await git.init();
    await git.addConfig('user.name', 'ATLAS Docs OS');
    await git.addConfig('user.email', 'atlas@local');
  }

  // 设置定时推送
  const pushCron = process.env.GIT_PUSH_CRON || '0 * * * *';
  cron.schedule(pushCron, async () => {
    await pushToRemote();
  });

  console.log(`[Git] 仓库路径: ${repoPath}`);
}

/**
 * 获取 Git 实例
 */
export function getGit(): SimpleGit {
  return git;
}

/**
 * 获取仓库路径
 */
export function getRepoPath(): string {
  return repoPath;
}

/**
 * 提交更改
 */
export async function commit(
  message: string,
  operator: { type: string; id: string; name?: string }
): Promise<{ hash: string; message: string }> {
  // 添加操作者标记
  const prefix = operator.type === 'ai' ? '[AI]' : '';
  const fullMessage = `${prefix}${message}`;

  // 设置 commit 作者
  const authorName = operator.name || operator.id;
  const authorEmail = `${operator.id}@atlas.local`;

  await git.add('.');
  const result = await git.commit(fullMessage, {
    '--author': `${authorName} <${authorEmail}>`,
  });

  return {
    hash: result.commit || '',
    message: fullMessage,
  };
}

/**
 * 推送到远程仓库
 */
export async function pushToRemote(): Promise<void> {
  const remoteUrl = process.env.GIT_REMOTE_URL;
  if (!remoteUrl) {
    console.log('[Git] 未配置远程仓库，跳过推送');
    return;
  }

  try {
    const remoteName = process.env.GIT_REMOTE_NAME || 'origin';
    const branch = process.env.GIT_BRANCH || 'main';

    // 检查远程是否存在
    const remotes = await git.getRemotes();
    const hasRemote = remotes.some((r) => r.name === remoteName);

    if (!hasRemote) {
      await git.addRemote(remoteName, remoteUrl);
    }

    await git.push(remoteName, branch);
    console.log(`[Git] 推送成功: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('[Git] 推送失败:', error);
  }
}

/**
 * 获取文件历史
 */
export async function getFileHistory(
  filePath: string,
  limit: number = 10
): Promise<Array<{ hash: string; date: string; message: string; author: string }>> {
  const log = await git.log({
    file: filePath,
    maxCount: limit,
  });

  return log.all.map((entry) => ({
    hash: entry.hash,
    date: entry.date,
    message: entry.message,
    author: entry.author_name,
  }));
}

