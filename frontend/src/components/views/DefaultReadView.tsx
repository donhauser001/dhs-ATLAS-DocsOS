/**
 * DefaultReadView - 默认阅读视图
 * 
 * 通用的文档阅读渲染
 */

import { useLabels } from '@/providers/LabelProvider';
import type { ViewProps } from '@/registry/types';

export function DefaultReadView({ document }: ViewProps) {
  const { resolveLabel, isHidden } = useLabels();

  return (
    <div className="p-6 max-w-4xl">
      {/* Frontmatter 元数据 */}
      {document.frontmatter && Object.keys(document.frontmatter).length > 0 && (
        <div className="mb-6 p-4 bg-muted rounded-lg text-sm">
          <div className="font-medium mb-2">文档元数据</div>
          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            {Object.entries(document.frontmatter).map(([key, value]) => {
              // 跳过敏感字段
              if (isHidden(key)) return null;

              // 特殊处理 atlas 对象
              if (key === 'atlas' && typeof value === 'object' && value !== null) {
                const atlas = value as Record<string, unknown>;
                return (
                  <div key={key} className="col-span-2 border-t pt-2 mt-2">
                    <div className="font-medium mb-1">功能声明</div>
                    <div className="grid grid-cols-2 gap-2 pl-2">
                      {atlas.function ? (
                        <div>
                          <span className="opacity-70">功能类型:</span>{' '}
                          <span className="text-foreground">{resolveLabel(atlas.function as string).label}</span>
                        </div>
                      ) : null}
                      {atlas.entity_type ? (
                        <div>
                          <span className="opacity-70">实体类型:</span>{' '}
                          <span className="text-foreground">{resolveLabel(atlas.entity_type as string).label}</span>
                        </div>
                      ) : null}
                      {atlas.capabilities && (
                        <div className="col-span-2">
                          <span className="opacity-70">功能能力:</span>{' '}
                          <span className="text-foreground">
                            {typeof atlas.capabilities === 'string'
                              ? atlas.capabilities.split(',').map(c => resolveLabel(c.trim()).label).join(', ')
                              : Array.isArray(atlas.capabilities)
                                ? atlas.capabilities.map((cap: string) => resolveLabel(cap).label).join(', ')
                                : String(atlas.capabilities)
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // 普通字段
              const resolved = resolveLabel(key);
              return (
                <div key={key}>
                  <span className="opacity-70">{resolved.label}:</span>{' '}
                  <span className="text-foreground">{String(value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Blocks 内容 */}
      <div className="space-y-6">
        {document.blocks.map((block) => (
          <div key={block.anchor} id={block.anchor} className="scroll-mt-20">
            {/* Block 标题 */}
            {block.title && (
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                {block.title}
                {block.anchor && (
                  <span className="text-xs text-muted-foreground font-mono">
                    #{block.anchor}
                  </span>
                )}
              </h2>
            )}

            {/* Machine Zone */}
            {block.machine && Object.keys(block.machine).length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(block.machine).map(([key, value]) => {
                    if (isHidden(key)) return null;
                    const resolved = resolveLabel(key);
                    return (
                      <div key={key} className="flex flex-col">
                        <span className="text-muted-foreground text-xs">{resolved.label}</span>
                        <span className="font-medium">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Human Zone */}
            {block.body && (
              <div className="prose prose-slate max-w-none">
                <div dangerouslySetInnerHTML={{ __html: block.body }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DefaultReadView;

