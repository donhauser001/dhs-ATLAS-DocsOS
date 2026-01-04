/**
 * Tags 组件 - 注册入口
 */

import { RegisteredComponent } from '../../types';
import { meta, createDefault } from './config';
import { Control } from './Control';
import { Configurator } from './Configurator';

const TagsComponent: RegisteredComponent = {
    meta,
    createDefault,
    Control,
    Configurator,
};

export default TagsComponent;

