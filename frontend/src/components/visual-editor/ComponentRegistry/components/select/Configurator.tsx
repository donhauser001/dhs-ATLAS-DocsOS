/**
 * Select 组件 - 配置表单
 */

import { AlertCircle } from 'lucide-react';
import { ConfiguratorProps, SelectComponentDefinition } from '../../types';
import { OptionEditor } from '../../shared';

export function Configurator({ formData, errors, onUpdateFormData }: ConfiguratorProps) {
    const selectData = formData as SelectComponentDefinition;

    return (
        <>
            <OptionEditor
                options={selectData.options || []}
                onChange={(options) =>
                    onUpdateFormData((prev) => ({ ...prev, options } as SelectComponentDefinition))
                }
            />
            {errors.options && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.options}
                </p>
            )}
        </>
    );
}

export default Configurator;

