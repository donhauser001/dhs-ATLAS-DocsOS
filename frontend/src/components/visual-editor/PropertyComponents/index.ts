/**
 * 属性组件库 - 导出所有组件
 */

export * from './types';

// 组件导出
export { TextComponent } from './TextComponent';
export { SelectComponent } from './SelectComponent';
export { RatingComponent } from './RatingComponent';
export { DateComponent } from './DateComponent';
export { CheckboxComponent } from './CheckboxComponent';
export { NumberComponent } from './NumberComponent';
export { TextareaComponent } from './TextareaComponent';

// 组件列表（用于注册）
import { TextComponent } from './TextComponent';
import { SelectComponent } from './SelectComponent';
import { RatingComponent } from './RatingComponent';
import { DateComponent } from './DateComponent';
import { CheckboxComponent } from './CheckboxComponent';
import { NumberComponent } from './NumberComponent';
import { TextareaComponent } from './TextareaComponent';

import type { PropertyComponent } from '@/types/property';

/**
 * 所有内置组件列表
 */
export const builtinComponents: PropertyComponent[] = [
  TextComponent,
  TextareaComponent,
  NumberComponent,
  SelectComponent,
  CheckboxComponent,
  RatingComponent,
  DateComponent,
];

/**
 * 根据 ID 获取组件
 */
export function getBuiltinComponent(id: string): PropertyComponent | undefined {
  return builtinComponents.find(c => c.id === id);
}

