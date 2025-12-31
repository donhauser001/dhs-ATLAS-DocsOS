import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { User, UserPublic, JwtPayload, toPublicUser } from '../types/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 敏感数据存储路径（不进入 Git）
const CREDENTIALS_FILE = 'data/auth/credentials.json';
// 用户资料存储路径（Git 管理）
const USERS_DIR = 'workspace/用户';

const JWT_SECRET = process.env.JWT_SECRET || 'atlas-docs-os-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface Credentials {
  users: {
    [userId: string]: {
      password: string; // bcrypt hashed
      last_login?: string;
      login_attempts?: number;
      locked_until?: string;
    };
  };
}

interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  id_card?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  department?: string;
  position?: string;
  avatar?: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export class AuthService {
  private backendPath: string;
  private repositoryPath: string;

  constructor(repositoryPath: string) {
    this.repositoryPath = repositoryPath;
    // backend 路径是 auth-service.ts 所在目录的上两级（src/services -> backend）
    this.backendPath = path.resolve(__dirname, '../..');
  }

  // ============ 凭证管理（敏感数据） ============

  private async getCredentials(): Promise<Credentials> {
    try {
      const filePath = path.join(this.backendPath, CREDENTIALS_FILE);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { users: {} };
    }
  }

  private async saveCredentials(credentials: Credentials): Promise<void> {
    const filePath = path.join(this.backendPath, CREDENTIALS_FILE);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(credentials, null, 2), 'utf-8');
  }

  // ============ 用户资料管理（Git 管理） ============

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profilePath = path.join(this.repositoryPath, USERS_DIR, userId, '资料.md');
      const content = await fs.readFile(profilePath, 'utf-8');
      
      // 解析 frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) return null;
      
      const frontmatter = yaml.parse(frontmatterMatch[1]);
      return frontmatter as UserProfile;
    } catch {
      return null;
    }
  }

  private async saveUserProfile(userId: string, profile: UserProfile, bodyContent?: string): Promise<void> {
    const userDir = path.join(this.repositoryPath, USERS_DIR, userId);
    await fs.mkdir(userDir, { recursive: true });
    
    const profilePath = path.join(userDir, '资料.md');
    
    // 构建 Markdown 内容
    const frontmatter = yaml.stringify(profile);
    const body = bodyContent || this.generateDefaultProfileBody(profile);
    const content = `---\n${frontmatter}---\n\n${body}`;
    
    await fs.writeFile(profilePath, content, 'utf-8');
  }

  private generateDefaultProfileBody(profile: UserProfile): string {
    return `# ${profile.name || profile.username}

## 个人简介

暂无简介。
`;
  }

  private async createDefaultPreferences(userId: string): Promise<void> {
    const prefsPath = path.join(this.repositoryPath, USERS_DIR, userId, '偏好.yml');
    const defaultPrefs = `# 用户偏好设置
theme: system
language: zh-CN
timezone: Asia/Shanghai

notifications:
  email: true
  browser: true
  
display:
  sidebar_collapsed: false
  items_per_page: 20
  
shortcuts:
  enabled: true
`;
    await fs.writeFile(prefsPath, defaultPrefs, 'utf-8');
  }

  private async getAllUserIds(): Promise<string[]> {
    try {
      const usersDir = path.join(this.repositoryPath, USERS_DIR);
      const entries = await fs.readdir(usersDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }

  // ============ 公共方法 ============

  async initialize(): Promise<void> {
    const credentials = await this.getCredentials();
    
    // 检查是否有管理员账户
    const adminProfile = await this.getUserProfile('admin');
    
    if (!adminProfile || !credentials.users['admin']) {
      // 创建默认管理员
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      credentials.users['admin'] = {
        password: hashedPassword,
      };
      await this.saveCredentials(credentials);
      
      console.log('已创建/更新默认管理员账户: admin / admin123');
    }
    
    // 确保所有现有用户都有凭证
    const userIds = await this.getAllUserIds();
    let updated = false;
    
    for (const userId of userIds) {
      if (!credentials.users[userId]) {
        // 为没有密码的用户设置默认密码
        const defaultPassword = await bcrypt.hash('123456', 10);
        credentials.users[userId] = {
          password: defaultPassword,
        };
        updated = true;
        console.log(`为用户 ${userId} 设置了默认密码: 123456`);
      }
    }
    
    if (updated) {
      await this.saveCredentials(credentials);
    }
  }

  async login(
    username: string,
    password: string
  ): Promise<{ token: string; user: UserPublic } | null> {
    const profile = await this.getUserProfile(username);
    if (!profile || profile.status !== 'active') {
      return null;
    }

    const credentials = await this.getCredentials();
    const userCreds = credentials.users[username];
    
    if (!userCreds) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, userCreds.password);
    if (!isValidPassword) {
      return null;
    }

    // 更新最后登录时间
    userCreds.last_login = new Date().toISOString();
    await this.saveCredentials(credentials);

    const payload: JwtPayload = {
      userId: profile.id,
      username: profile.username,
      role: profile.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 构建完整用户对象
    const user = await this.buildUserPublic(profile, userCreds);

    return { token, user };
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  private async buildUserPublic(
    profile: UserProfile,
    creds?: { last_login?: string }
  ): Promise<UserPublic> {
    // 读取个人简介（从 MD 正文中提取）
    let bio: string | undefined;
    try {
      const profilePath = path.join(this.repositoryPath, USERS_DIR, profile.id, '资料.md');
      const content = await fs.readFile(profilePath, 'utf-8');
      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n\n([\s\S]*)$/);
      if (bodyMatch) {
        // 提取 "## 个人简介" 后的内容
        const bioMatch = bodyMatch[1].match(/## 个人简介\n\n([\s\S]*?)(?=\n##|$)/);
        if (bioMatch) {
          bio = bioMatch[1].trim();
        }
      }
    } catch {
      // ignore
    }

    return {
      id: profile.id,
      username: profile.username,
      name: profile.name || profile.username,
      email: profile.email,
      phone: profile.phone,
      id_card: profile.id_card,
      emergency_contact: profile.emergency_contact,
      emergency_phone: profile.emergency_phone,
      department: profile.department,
      position: profile.position,
      bio,
      avatar: profile.avatar,
      role: profile.role,
      status: profile.status,
      created_at: profile.created_at,
      last_login: creds?.last_login,
    };
  }

  async getUserById(userId: string): Promise<UserPublic | null> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return null;
    
    const credentials = await this.getCredentials();
    const creds = credentials.users[userId];
    
    return this.buildUserPublic(profile, creds);
  }

  async getUserByUsername(username: string): Promise<UserPublic | null> {
    return this.getUserById(username);
  }

  async getAllUsers(): Promise<UserPublic[]> {
    const userIds = await this.getAllUserIds();
    const credentials = await this.getCredentials();
    const users: UserPublic[] = [];

    for (const userId of userIds) {
      const profile = await this.getUserProfile(userId);
      if (profile) {
        const user = await this.buildUserPublic(profile, credentials.users[userId]);
        users.push(user);
      }
    }

    return users;
  }

  async createUser(data: {
    username: string;
    password: string;
    name: string;
    email: string;
    role: User['role'];
    phone?: string;
    id_card?: string;
    emergency_contact?: string;
    emergency_phone?: string;
    department?: string;
    position?: string;
    bio?: string;
  }): Promise<UserPublic> {
    // 检查用户是否已存在
    const existing = await this.getUserProfile(data.username);
    if (existing) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已被使用
    const allUsers = await this.getAllUsers();
    if (allUsers.some(u => u.email === data.email)) {
      throw new Error('邮箱已被使用');
    }

    const now = new Date().toISOString();
    
    // 创建用户资料
    const profile: UserProfile = {
      id: data.username,
      username: data.username,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      id_card: data.id_card || '',
      emergency_contact: data.emergency_contact || '',
      emergency_phone: data.emergency_phone || '',
      department: data.department || '',
      position: data.position || '',
      avatar: '',
      role: data.role,
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    // 生成资料正文
    const body = `# ${data.name}

## 个人简介

${data.bio || '暂无简介。'}
`;

    await this.saveUserProfile(data.username, profile, body);
    await this.createDefaultPreferences(data.username);

    // 保存凭证
    const credentials = await this.getCredentials();
    credentials.users[data.username] = {
      password: await bcrypt.hash(data.password, 10),
    };
    await this.saveCredentials(credentials);

    return this.buildUserPublic(profile);
  }

  async updateUser(
    userId: string,
    data: Partial<{
      username: string;
      name: string;
      email: string;
      phone: string;
      id_card: string;
      emergency_contact: string;
      emergency_phone: string;
      department: string;
      position: string;
      bio: string;
      avatar: string;
      role: User['role'];
      status: User['status'];
    }>
  ): Promise<UserPublic | null> {
    // userId 是当前目录名（也是当前用户的标识符）
    const profile = await this.getUserProfile(userId);
    if (!profile) return null;

    // 确定最终的用户名：如果提供了新用户名就用新的，否则用目录名（保持一致）
    const finalUsername = data.username !== undefined ? data.username : userId;
    
    // 检查是否需要重命名目录（新用户名与当前目录名不同）
    const needsRename = finalUsername !== userId;

    // 如果要更新用户名，先检查新用户名是否可用
    if (needsRename) {
      // 检查新用户名是否已存在（排除当前用户）
      const existingUser = await this.getUserProfile(finalUsername);
      if (existingUser) {
        throw new Error('用户名已存在');
      }
    }

    // 检查邮箱是否被其他用户使用
    if (data.email && data.email !== profile.email) {
      const allUsers = await this.getAllUsers();
      const otherUserWithEmail = allUsers.find(u => u.email === data.email && u.id !== userId);
      if (otherUserWithEmail) {
        throw new Error('邮箱已被使用');
      }
    }

    // 更新 profile 对象的所有字段
    // 始终确保 id 和 username 与最终目录名一致
    profile.id = finalUsername;
    profile.username = finalUsername;
    
    if (data.email !== undefined) profile.email = data.email;
    if (data.name !== undefined) profile.name = data.name;
    if (data.phone !== undefined) profile.phone = data.phone;
    if (data.id_card !== undefined) profile.id_card = data.id_card;
    if (data.emergency_contact !== undefined) profile.emergency_contact = data.emergency_contact;
    if (data.emergency_phone !== undefined) profile.emergency_phone = data.emergency_phone;
    if (data.department !== undefined) profile.department = data.department;
    if (data.position !== undefined) profile.position = data.position;
    if (data.avatar !== undefined) profile.avatar = data.avatar;
    if (data.role !== undefined) profile.role = data.role;
    if (data.status !== undefined) profile.status = data.status;
    profile.updated_at = new Date().toISOString();

    // 读取现有文件内容以保留正文
    const oldProfilePath = path.join(this.repositoryPath, USERS_DIR, userId, '资料.md');
    let bodyContent: string | undefined;
    
    try {
      const content = await fs.readFile(oldProfilePath, 'utf-8');
      const match = content.match(/^---\n[\s\S]*?\n---\n\n([\s\S]*)$/);
      if (match) {
        bodyContent = match[1];
        // 如果更新了简介，替换正文中的简介部分
        if (data.bio !== undefined) {
          bodyContent = bodyContent.replace(
            /## 个人简介\n\n[\s\S]*?(?=\n##|$)/,
            `## 个人简介\n\n${data.bio}\n`
          );
        }
      }
    } catch {
      // 文件不存在，使用默认正文
    }

    // 如果需要重命名用户目录
    if (needsRename) {
      const oldDir = path.join(this.repositoryPath, USERS_DIR, userId);
      const newDir = path.join(this.repositoryPath, USERS_DIR, finalUsername);

      // 步骤 1: 先保存更新后的 profile 到旧目录
      await this.saveUserProfile(userId, profile, bodyContent);

      // 步骤 2: 重命名目录
      await fs.rename(oldDir, newDir);

      // 步骤 3: 更新凭证文件中的用户名（key）
      const credentials = await this.getCredentials();
      if (credentials.users[userId]) {
        credentials.users[finalUsername] = credentials.users[userId];
        delete credentials.users[userId];
        await this.saveCredentials(credentials);
      }
      
      console.log(`用户目录已重命名: ${userId} -> ${finalUsername}`);
    } else {
      // 不需要重命名，直接保存（同时确保 id 和 username 与目录名一致）
      await this.saveUserProfile(userId, profile, bodyContent);
    }

    const credentials = await this.getCredentials();
    return this.buildUserPublic(profile, credentials.users[finalUsername]);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const credentials = await this.getCredentials();
    const userCreds = credentials.users[userId];

    if (!userCreds) return false;

    const isValidPassword = await bcrypt.compare(oldPassword, userCreds.password);
    if (!isValidPassword) return false;

    userCreds.password = await bcrypt.hash(newPassword, 10);
    await this.saveCredentials(credentials);

    return true;
  }

  async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return false;

    const credentials = await this.getCredentials();
    
    if (!credentials.users[userId]) {
      credentials.users[userId] = {
        password: await bcrypt.hash(newPassword, 10),
      };
    } else {
      credentials.users[userId].password = await bcrypt.hash(newPassword, 10);
    }
    
    await this.saveCredentials(credentials);

    return true;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return false;

    // 不能删除最后一个管理员
    const allUsers = await this.getAllUsers();
    const adminCount = allUsers.filter(u => u.role === 'admin').length;
    if (profile.role === 'admin' && adminCount <= 1) {
      throw new Error('不能删除最后一个管理员');
    }

    // 删除用户目录
    const userDir = path.join(this.repositoryPath, USERS_DIR, userId);
    await fs.rm(userDir, { recursive: true, force: true });

    // 删除凭证
    const credentials = await this.getCredentials();
    delete credentials.users[userId];
    await this.saveCredentials(credentials);

    return true;
  }

  // ============ 用户偏好 ============

  async getUserPreferences(userId: string): Promise<Record<string, any> | null> {
    try {
      const prefsPath = path.join(this.repositoryPath, USERS_DIR, userId, '偏好.yml');
      const content = await fs.readFile(prefsPath, 'utf-8');
      return yaml.parse(content);
    } catch {
      return null;
    }
  }

  async updateUserPreferences(
    userId: string,
    prefs: Record<string, any>
  ): Promise<boolean> {
    try {
      const prefsPath = path.join(this.repositoryPath, USERS_DIR, userId, '偏好.yml');
      const content = yaml.stringify(prefs);
      await fs.writeFile(prefsPath, content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }
}

let authServiceInstance: AuthService | null = null;

export function getAuthService(repositoryPath: string): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(repositoryPath);
  }
  return authServiceInstance;
}
