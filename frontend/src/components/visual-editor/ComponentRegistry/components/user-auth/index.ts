/**
 * User Auth 组件 - 注册入口
 * 
 * Phase 4.2: 用户认证字段组复合组件
 */

import { RegisteredComponent } from '../../types';
import { meta, createDefault } from './config';
import { Control } from './Control';
import { Configurator } from './Configurator';

const UserAuthComponent: RegisteredComponent = {
    meta,
    createDefault,
    Control,
    Configurator,
};

export default UserAuthComponent;

