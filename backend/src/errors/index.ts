/**
 * ATLAS 错误处理系统
 * 
 * Phase 3.0: 工程与可维护性
 * 
 * 规范：
 * - 所有错误必须有人类可读消息
 * - 错误必须指向修复路径
 * - 不允许静默失败
 */

// ============================================================
// 基础错误类
// ============================================================

/**
 * ATLAS 基础错误类
 * 
 * 所有 ATLAS 错误都应继承此类
 */
export class ATLASError extends Error {
  /** 错误码 */
  readonly code: string;
  /** 修复建议 */
  readonly suggestion?: string;
  /** 相关上下文 */
  readonly context?: Record<string, unknown>;
  
  constructor(
    code: string,
    message: string,
    options?: {
      suggestion?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ATLASError';
    this.code = code;
    this.suggestion = options?.suggestion;
    this.context = options?.context;
  }
  
  /**
   * 转换为 API 响应格式
   */
  toResponse() {
    return {
      error: true,
      code: this.code,
      message: this.message,
      suggestion: this.suggestion,
      context: this.context,
    };
  }
  
  /**
   * 转换为人类可读字符串
   */
  toHumanReadable(): string {
    let result = `[${this.code}] ${this.message}`;
    if (this.suggestion) {
      result += `\n建议: ${this.suggestion}`;
    }
    return result;
  }
}

// ============================================================
// 解析错误
// ============================================================

/**
 * ADL 解析错误
 */
export class ParseError extends ATLASError {
  constructor(
    message: string,
    options?: {
      file?: string;
      line?: number;
      suggestion?: string;
    }
  ) {
    super('PARSE_ERROR', message, {
      suggestion: options?.suggestion,
      context: {
        file: options?.file,
        line: options?.line,
      },
    });
    this.name = 'ParseError';
  }
}

/**
 * Schema 验证错误
 */
export class ValidationError extends ATLASError {
  constructor(
    message: string,
    options?: {
      anchor?: string;
      field?: string;
      suggestion?: string;
    }
  ) {
    super('VALIDATION_ERROR', message, {
      suggestion: options?.suggestion,
      context: {
        anchor: options?.anchor,
        field: options?.field,
      },
    });
    this.name = 'ValidationError';
  }
}

// ============================================================
// 路径与权限错误
// ============================================================

/**
 * 路径安全错误
 */
export class PathSecurityError extends ATLASError {
  constructor(
    message: string,
    options?: {
      path?: string;
      suggestion?: string;
    }
  ) {
    super('PATH_SECURITY_ERROR', message, {
      suggestion: options?.suggestion || '请使用相对路径，并确保在仓库边界内',
      context: {
        path: options?.path,
      },
    });
    this.name = 'PathSecurityError';
  }
}

/**
 * 权限错误
 */
export class PermissionError extends ATLASError {
  constructor(
    message: string,
    options?: {
      action?: string;
      resource?: string;
      suggestion?: string;
    }
  ) {
    super('PERMISSION_ERROR', message, {
      suggestion: options?.suggestion || '请确认您有执行此操作的权限',
      context: {
        action: options?.action,
        resource: options?.resource,
      },
    });
    this.name = 'PermissionError';
  }
}

// ============================================================
// 资源错误
// ============================================================

/**
 * 资源不存在错误
 */
export class NotFoundError extends ATLASError {
  constructor(
    resourceType: string,
    identifier: string,
    options?: {
      suggestion?: string;
    }
  ) {
    super('NOT_FOUND', `${resourceType} '${identifier}' not found`, {
      suggestion: options?.suggestion || `请检查 ${resourceType} 是否存在`,
      context: {
        resourceType,
        identifier,
      },
    });
    this.name = 'NotFoundError';
  }
}

/**
 * 资源冲突错误
 */
export class ConflictError extends ATLASError {
  constructor(
    message: string,
    options?: {
      suggestion?: string;
      context?: Record<string, unknown>;
    }
  ) {
    super('CONFLICT', message, {
      suggestion: options?.suggestion || '请解决冲突后重试',
      context: options?.context,
    });
    this.name = 'ConflictError';
  }
}

// ============================================================
// Token 错误
// ============================================================

/**
 * Token 解析错误
 */
export class TokenError extends ATLASError {
  constructor(
    message: string,
    options?: {
      tokenPath?: string;
      suggestion?: string;
    }
  ) {
    super('TOKEN_ERROR', message, {
      suggestion: options?.suggestion || '请检查 Token 路径是否正确',
      context: {
        tokenPath: options?.tokenPath,
      },
    });
    this.name = 'TokenError';
  }
}

// ============================================================
// Proposal 错误
// ============================================================

/**
 * Proposal 错误
 */
export class ProposalError extends ATLASError {
  constructor(
    message: string,
    options?: {
      proposalId?: string;
      suggestion?: string;
    }
  ) {
    super('PROPOSAL_ERROR', message, {
      suggestion: options?.suggestion,
      context: {
        proposalId: options?.proposalId,
      },
    });
    this.name = 'ProposalError';
  }
}

// ============================================================
// 错误处理工具
// ============================================================

/**
 * 将未知错误转换为 ATLAS 错误
 */
export function toATLASError(error: unknown): ATLASError {
  if (error instanceof ATLASError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new ATLASError('UNKNOWN_ERROR', error.message, {
      suggestion: '请查看服务器日志获取更多信息',
      cause: error,
    });
  }
  
  return new ATLASError('UNKNOWN_ERROR', String(error), {
    suggestion: '发生了未知错误，请联系管理员',
  });
}

/**
 * 错误日志记录
 */
export function logError(error: ATLASError, context?: string): void {
  console.error(`[ATLAS Error${context ? ` - ${context}` : ''}]`);
  console.error(`  Code: ${error.code}`);
  console.error(`  Message: ${error.message}`);
  if (error.suggestion) {
    console.error(`  Suggestion: ${error.suggestion}`);
  }
  if (error.context) {
    console.error(`  Context:`, error.context);
  }
  if (error.cause) {
    console.error(`  Cause:`, error.cause);
  }
}

/**
 * Express 错误处理中间件
 */
export function errorHandler(
  error: unknown,
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
): void {
  const atlasError = toATLASError(error);
  
  logError(atlasError, `${req.method} ${req.path}`);
  
  // 根据错误类型返回不同的状态码
  let statusCode = 500;
  
  if (atlasError instanceof NotFoundError) {
    statusCode = 404;
  } else if (atlasError instanceof PermissionError) {
    statusCode = 403;
  } else if (atlasError instanceof ValidationError) {
    statusCode = 400;
  } else if (atlasError instanceof PathSecurityError) {
    statusCode = 403;
  } else if (atlasError instanceof ConflictError) {
    statusCode = 409;
  }
  
  res.status(statusCode).json(atlasError.toResponse());
}

// ============================================================
// 导出
// ============================================================

export default {
  ATLASError,
  ParseError,
  ValidationError,
  PathSecurityError,
  PermissionError,
  NotFoundError,
  ConflictError,
  TokenError,
  ProposalError,
  toATLASError,
  logError,
  errorHandler,
};

