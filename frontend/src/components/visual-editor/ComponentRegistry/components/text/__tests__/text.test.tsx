/**
 * Text 组件测试
 * 
 * 测试覆盖：
 * - config.ts: createDefault 函数
 * - Control.tsx: 渲染、值变更、禁用状态
 * - Configurator.tsx: 配置项变更
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Control } from '../Control';
import { Configurator } from '../Configurator';
import { createDefault, meta } from '../config';
import type { TextComponentDefinition } from '../../../types';

describe('Text 组件', () => {
  describe('config', () => {
    it('createDefault 应返回正确的默认值', () => {
      const result = createDefault('test-id');
      
      expect(result).toEqual({
        type: 'text',
        id: 'test-id',
        label: '新文本',
      });
    });

    it('meta 应包含正确的组件信息', () => {
      expect(meta.type).toBe('text');
      expect(meta.name).toBe('单行文本');
      expect(meta.hasOptions).toBe(false);
    });
  });

  describe('Control', () => {
    const baseComponent: TextComponentDefinition = {
      type: 'text',
      id: 'test',
      label: '测试文本',
      placeholder: '请输入',
    };

    it('应正确渲染输入框', () => {
      render(
        <Control 
          component={baseComponent} 
          value="" 
          onChange={() => {}} 
        />
      );
      
      const input = screen.getByPlaceholderText('请输入');
      expect(input).toBeInTheDocument();
    });

    it('应显示当前值', () => {
      render(
        <Control 
          component={baseComponent} 
          value="测试值" 
          onChange={() => {}} 
        />
      );
      
      const input = screen.getByDisplayValue('测试值');
      expect(input).toBeInTheDocument();
    });

    it('应在输入时调用 onChange', () => {
      const handleChange = vi.fn();
      
      render(
        <Control 
          component={baseComponent} 
          value="" 
          onChange={handleChange} 
        />
      );
      
      const input = screen.getByPlaceholderText('请输入');
      fireEvent.change(input, { target: { value: '新值' } });
      
      expect(handleChange).toHaveBeenCalledWith('新值');
    });

    it('应在清空时调用 onChange(null)', () => {
      const handleChange = vi.fn();
      
      render(
        <Control 
          component={baseComponent} 
          value="原值" 
          onChange={handleChange} 
        />
      );
      
      const input = screen.getByDisplayValue('原值');
      fireEvent.change(input, { target: { value: '' } });
      
      expect(handleChange).toHaveBeenCalledWith(null);
    });

    it('禁用状态应正确显示', () => {
      render(
        <Control 
          component={baseComponent} 
          value="" 
          onChange={() => {}} 
          disabled 
        />
      );
      
      const input = screen.getByPlaceholderText('请输入');
      expect(input).toBeDisabled();
    });

    it('应遵守 maxLength 限制', () => {
      const componentWithMaxLength: TextComponentDefinition = {
        ...baseComponent,
        maxLength: 10,
      };
      
      render(
        <Control 
          component={componentWithMaxLength} 
          value="" 
          onChange={() => {}} 
        />
      );
      
      const input = screen.getByPlaceholderText('请输入');
      expect(input).toHaveAttribute('maxLength', '10');
    });
  });

  describe('Configurator', () => {
    const baseFormData: TextComponentDefinition = {
      type: 'text',
      id: 'test',
      label: '测试',
    };

    it('应渲染配置表单', () => {
      render(
        <Configurator 
          formData={baseFormData} 
          errors={{}}
          onUpdateFormData={() => {}} 
        />
      );
      
      expect(screen.getByText('占位文本')).toBeInTheDocument();
      expect(screen.getByText('最大长度（可选）')).toBeInTheDocument();
    });

    it('应在修改占位文本时调用 onUpdateFormData', () => {
      const handleUpdate = vi.fn();
      
      render(
        <Configurator 
          formData={baseFormData} 
          errors={{}}
          onUpdateFormData={handleUpdate} 
        />
      );
      
      const placeholderInput = screen.getByPlaceholderText('请输入...');
      fireEvent.change(placeholderInput, { target: { value: '新占位符' } });
      
      expect(handleUpdate).toHaveBeenCalled();
    });

    it('应在修改最大长度时调用 onUpdateFormData', () => {
      const handleUpdate = vi.fn();
      
      render(
        <Configurator 
          formData={baseFormData} 
          errors={{}}
          onUpdateFormData={handleUpdate} 
        />
      );
      
      const maxLengthInput = screen.getByPlaceholderText('不限制');
      fireEvent.change(maxLengthInput, { target: { value: '100' } });
      
      expect(handleUpdate).toHaveBeenCalled();
    });
  });
});

