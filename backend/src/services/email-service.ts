/**
 * Email Service - 邮件服务
 * 
 * Phase 4.2: 支持常见服务商预设和自定义 SMTP
 * 
 * 功能：
 * - 发送激活邮件
 * - 发送密码重置邮件
 * - 发送欢迎邮件
 * - 测试邮件配置
 */

import nodemailer from 'nodemailer';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';
import { getUserSettings, type EmailSettings, type SmtpSettings } from './user-settings.js';

// ============================================================
// 常量定义
// ============================================================

/** 邮件模板目录 */
const TEMPLATES_DIR = () => join(config.projectRoot, 'backend', 'src', 'templates', 'email');

/** 预设邮件服务商配置 */
const PRESET_SMTP_CONFIG: Record<string, Omit<SmtpSettings, 'user' | 'pass'>> = {
  qq: {
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
  },
  '163': {
    host: 'smtp.163.com',
    port: 465,
    secure: true,
  },
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
  },
  outlook: {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
  },
  aliyun: {
    host: 'smtp.mxhichina.com',
    port: 465,
    secure: true,
  },
};

// ============================================================
// 类型定义
// ============================================================

export interface SendEmailOptions {
  /** 收件人 */
  to: string;
  /** 邮件主题 */
  subject: string;
  /** HTML 内容 */
  html: string;
  /** 纯文本内容（可选） */
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ActivationEmailData {
  username: string;
  activationLink: string;
  expiresIn: string;
}

export interface ResetPasswordEmailData {
  username: string;
  resetLink: string;
  expiresIn: string;
}

export interface WelcomeEmailData {
  username: string;
  loginUrl: string;
}

export interface TestEmailResult {
  success: boolean;
  error?: string;
  details?: {
    host: string;
    port: number;
    secure: boolean;
  };
}

// ============================================================
// 传输器创建
// ============================================================

/**
 * 根据邮件设置创建 nodemailer 传输器
 */
async function createTransporter(): Promise<nodemailer.Transporter | null> {
  const settings = await getUserSettings();
  const emailConfig = settings.email;
  
  if (!emailConfig.enabled) {
    console.warn('[EmailService] Email service is disabled');
    return null;
  }
  
  let smtpConfig: SmtpSettings;
  
  if (emailConfig.provider === 'preset' && emailConfig.preset_provider) {
    // 使用预设配置
    const preset = PRESET_SMTP_CONFIG[emailConfig.preset_provider];
    if (!preset) {
      console.error(`[EmailService] Unknown preset provider: ${emailConfig.preset_provider}`);
      return null;
    }
    
    smtpConfig = {
      ...preset,
      user: emailConfig.account || '',
      pass: emailConfig.auth_code || '',
    };
  } else if (emailConfig.smtp) {
    // 使用自定义 SMTP 配置
    smtpConfig = emailConfig.smtp;
  } else {
    console.error('[EmailService] No valid SMTP configuration');
    return null;
  }
  
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });
  
  return transporter;
}

// ============================================================
// 模板处理
// ============================================================

/**
 * 加载邮件模板
 */
function loadTemplate(templateName: string): string | null {
  const templatePath = join(TEMPLATES_DIR(), `${templateName}.html`);
  
  if (!existsSync(templatePath)) {
    console.warn(`[EmailService] Template not found: ${templatePath}`);
    return null;
  }
  
  return readFileSync(templatePath, 'utf-8');
}

/**
 * 替换模板变量
 */
function renderTemplate(template: string, data: Record<string, string>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

/**
 * 获取默认激活邮件模板
 */
function getDefaultActivationTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>账户激活</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: bold; color: #333; }
    h1 { color: #333; font-size: 24px; margin-bottom: 20px; }
    p { color: #666; line-height: 1.6; margin-bottom: 20px; }
    .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .button:hover { background: #2563EB; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px; }
    .link { color: #3B82F6; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔐 ATLAS</div>
    <h1>激活您的账户</h1>
    <p>您好 <strong>{{ username }}</strong>，</p>
    <p>感谢您注册 ATLAS 系统！请点击下方按钮激活您的账户：</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{ activationLink }}" class="button">激活账户</a>
    </p>
    <p>或者复制以下链接到浏览器打开：</p>
    <p class="link">{{ activationLink }}</p>
    <p>此链接将在 <strong>{{ expiresIn }}</strong> 后失效。</p>
    <div class="footer">
      <p>如果这不是您本人的操作，请忽略此邮件。</p>
      <p>此邮件由 ATLAS 系统自动发送，请勿直接回复。</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * 获取默认密码重置邮件模板
 */
function getDefaultResetPasswordTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>密码重置</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: bold; color: #333; }
    h1 { color: #333; font-size: 24px; margin-bottom: 20px; }
    p { color: #666; line-height: 1.6; margin-bottom: 20px; }
    .button { display: inline-block; background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .button:hover { background: #DC2626; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px; }
    .link { color: #3B82F6; word-break: break-all; }
    .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔐 ATLAS</div>
    <h1>重置您的密码</h1>
    <p>您好 <strong>{{ username }}</strong>，</p>
    <p>我们收到了您的密码重置请求。请点击下方按钮设置新密码：</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{ resetLink }}" class="button">重置密码</a>
    </p>
    <p>或者复制以下链接到浏览器打开：</p>
    <p class="link">{{ resetLink }}</p>
    <p>此链接将在 <strong>{{ expiresIn }}</strong> 后失效。</p>
    <div class="warning">
      <strong>安全提示：</strong>如果这不是您本人的操作，请立即忽略此邮件并检查您的账户安全。
    </div>
    <div class="footer">
      <p>此邮件由 ATLAS 系统自动发送，请勿直接回复。</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * 获取默认欢迎邮件模板
 */
function getDefaultWelcomeTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>欢迎使用 ATLAS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: bold; color: #333; }
    h1 { color: #333; font-size: 24px; margin-bottom: 20px; }
    p { color: #666; line-height: 1.6; margin-bottom: 20px; }
    .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .button:hover { background: #059669; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔐 ATLAS</div>
    <h1>欢迎使用 ATLAS！</h1>
    <p>您好 <strong>{{ username }}</strong>，</p>
    <p>恭喜您成功注册 ATLAS 系统！您的账户已激活，现在可以开始使用了。</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{ loginUrl }}" class="button">立即登录</a>
    </p>
    <p>如果您有任何问题，请联系系统管理员获取帮助。</p>
    <div class="footer">
      <p>感谢您选择 ATLAS！</p>
      <p>此邮件由 ATLAS 系统自动发送，请勿直接回复。</p>
    </div>
  </div>
</body>
</html>
`;
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 发送邮件
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const transporter = await createTransporter();
  
  if (!transporter) {
    return {
      success: false,
      error: '邮件服务未配置或已禁用',
    };
  }
  
  const settings = await getUserSettings();
  const emailConfig = settings.email;
  
  try {
    const info = await transporter.sendMail({
      from: `"${emailConfig.sender_name}" <${emailConfig.sender_email}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    
    console.log(`[EmailService] Email sent: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 发送激活邮件
 */
export async function sendActivationEmail(
  to: string,
  data: ActivationEmailData
): Promise<SendEmailResult> {
  // 尝试加载自定义模板，否则使用默认模板
  let template = loadTemplate('activation');
  if (!template) {
    template = getDefaultActivationTemplate();
  }
  
  const html = renderTemplate(template, {
    username: data.username,
    activationLink: data.activationLink,
    expiresIn: data.expiresIn,
  });
  
  return sendEmail({
    to,
    subject: 'ATLAS - 账户激活',
    html,
  });
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
  to: string,
  data: ResetPasswordEmailData
): Promise<SendEmailResult> {
  // 尝试加载自定义模板，否则使用默认模板
  let template = loadTemplate('reset-password');
  if (!template) {
    template = getDefaultResetPasswordTemplate();
  }
  
  const html = renderTemplate(template, {
    username: data.username,
    resetLink: data.resetLink,
    expiresIn: data.expiresIn,
  });
  
  return sendEmail({
    to,
    subject: 'ATLAS - 密码重置',
    html,
  });
}

/**
 * 发送欢迎邮件
 */
export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<SendEmailResult> {
  // 尝试加载自定义模板，否则使用默认模板
  let template = loadTemplate('welcome');
  if (!template) {
    template = getDefaultWelcomeTemplate();
  }
  
  const html = renderTemplate(template, {
    username: data.username,
    loginUrl: data.loginUrl,
  });
  
  return sendEmail({
    to,
    subject: 'ATLAS - 欢迎使用',
    html,
  });
}

/**
 * 测试邮件配置
 */
export async function testEmailConfig(): Promise<TestEmailResult> {
  const transporter = await createTransporter();
  
  if (!transporter) {
    return {
      success: false,
      error: '邮件服务未配置或已禁用',
    };
  }
  
  const settings = await getUserSettings();
  const emailConfig = settings.email;
  
  try {
    // 验证连接
    await transporter.verify();
    
    let smtpDetails: { host: string; port: number; secure: boolean };
    
    if (emailConfig.provider === 'preset' && emailConfig.preset_provider) {
      const preset = PRESET_SMTP_CONFIG[emailConfig.preset_provider];
      smtpDetails = {
        host: preset.host,
        port: preset.port,
        secure: preset.secure,
      };
    } else if (emailConfig.smtp) {
      smtpDetails = {
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
      };
    } else {
      return {
        success: false,
        error: '无效的 SMTP 配置',
      };
    }
    
    return {
      success: true,
      details: smtpDetails,
    };
  } catch (error) {
    console.error('[EmailService] Connection test failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 检查邮件服务是否可用
 */
export async function isEmailServiceAvailable(): Promise<boolean> {
  const settings = await getUserSettings();
  return settings.email.enabled;
}

/**
 * 获取预设服务商列表
 */
export function getPresetProviders(): Array<{ id: string; name: string; smtp: string; port: number }> {
  return [
    { id: 'qq', name: 'QQ邮箱', smtp: 'smtp.qq.com', port: 465 },
    { id: '163', name: '163邮箱', smtp: 'smtp.163.com', port: 465 },
    { id: 'gmail', name: 'Gmail', smtp: 'smtp.gmail.com', port: 587 },
    { id: 'outlook', name: 'Outlook', smtp: 'smtp.office365.com', port: 587 },
    { id: 'aliyun', name: '阿里企业邮', smtp: 'smtp.mxhichina.com', port: 465 },
  ];
}

