/**
 * 版本号工具函数
 */

import type { ParsedVersion } from './types';

// 版本号格式正则
export const VERSION_REGEX = /^\d+\.\d+(\.\d+)?$/;

/**
 * 解析版本号字符串
 */
export function parseVersion(versionStr: string): ParsedVersion {
  const cleaned = String(versionStr || '1.0').replace(/^["']|["']$/g, '');
  const parts = cleaned.split('.').map(p => parseInt(p, 10) || 0);

  return {
    major: parts[0] || 1,
    minor: parts[1] || 0,
    patch: parts.length > 2 ? parts[2] : undefined,
    raw: cleaned,
  };
}

/**
 * 格式化版本号
 */
export function formatVersion(parsed: ParsedVersion): string {
  if (parsed.patch !== undefined) {
    return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  }
  return `${parsed.major}.${parsed.minor}`;
}

/**
 * 递增主版本号
 */
export function incrementMajor(parsed: ParsedVersion): string {
  return formatVersion({
    ...parsed,
    major: parsed.major + 1,
    minor: 0,
    patch: parsed.patch !== undefined ? 0 : undefined,
  });
}

/**
 * 递增次版本号
 */
export function incrementMinor(parsed: ParsedVersion): string {
  return formatVersion({
    ...parsed,
    minor: parsed.minor + 1,
    patch: parsed.patch !== undefined ? 0 : undefined,
  });
}

/**
 * 验证版本号格式
 */
export function isValidVersion(version: string): boolean {
  return VERSION_REGEX.test(version.trim());
}

/**
 * 获取版本号错误信息
 */
export function getVersionError(version: string): string | null {
  if (!version.trim()) {
    return '版本号不能为空';
  }
  if (!VERSION_REGEX.test(version.trim())) {
    return '格式错误，应为 x.y 或 x.y.z（如 1.0、2.1.3）';
  }
  return null;
}

/**
 * 格式化日期
 */
export function formatDate(isoString: string | undefined): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return isoString;
  }
}

