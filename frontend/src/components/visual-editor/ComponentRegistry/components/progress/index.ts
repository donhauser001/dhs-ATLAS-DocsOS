/**
 * Progress 组件 - 注册入口
 */

import { RegisteredComponent } from '../../types';
import { meta, createDefault } from './config';
import { Control } from './Control';
import { Configurator } from './Configurator';

const ProgressComponent: RegisteredComponent = {
    meta,
    createDefault,
    Control,
    Configurator,
};

export default ProgressComponent;


