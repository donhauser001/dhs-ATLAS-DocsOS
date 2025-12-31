import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { getRepoPath } from '../git/git-service.js';

export interface Transition {
  event: string;
  target: string;
  guard?: string;
  description?: string;
}

export interface State {
  display: string;
  icon: string;
  color: string;
  transitions?: Transition[];
}

export interface StateMachine {
  name: string;
  initial: string;
  states: Record<string, State>;
}

// 缓存已加载的状态机
let stateMachineCache: Map<string, StateMachine> = new Map();

/**
 * 加载所有状态机定义
 */
export async function loadStateMachines(): Promise<void> {
  const smDir = path.join(getRepoPath(), 'workspace/状态机');

  try {
    const files = await fs.readdir(smDir);

    for (const file of files) {
      if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;

      const filePath = path.join(smDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = yaml.parse(content) as StateMachine;

      if (parsed.name) {
        stateMachineCache.set(parsed.name, parsed);
      }
    }

    console.log(`[StateMachine] 已加载 ${stateMachineCache.size} 个状态机`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('[StateMachine] 状态机目录不存在，跳过加载');
    } else {
      throw error;
    }
  }
}

/**
 * 获取所有状态机
 */
export async function getStateMachines(): Promise<StateMachine[]> {
  return Array.from(stateMachineCache.values());
}

/**
 * 获取单个状态机
 */
export async function getStateMachine(name: string): Promise<StateMachine | null> {
  return stateMachineCache.get(name) || null;
}

/**
 * 检查是否可以流转
 */
export function canTransition(
  machine: StateMachine,
  currentState: string,
  event: string
): boolean {
  const state = machine.states[currentState];
  if (!state || !state.transitions) return false;

  return state.transitions.some((t) => t.event === event);
}

/**
 * 获取流转后的状态
 */
export function getNextState(
  machine: StateMachine,
  currentState: string,
  event: string
): string | null {
  const state = machine.states[currentState];
  if (!state || !state.transitions) return null;

  const transition = state.transitions.find((t) => t.event === event);
  return transition ? transition.target : null;
}

/**
 * 获取当前状态可用的事件
 */
export function getAvailableEvents(
  machine: StateMachine,
  currentState: string
): Array<{ event: string; target: string; description?: string }> {
  const state = machine.states[currentState];
  if (!state || !state.transitions) return [];

  return state.transitions.map((t) => ({
    event: t.event,
    target: t.target,
    description: t.description,
  }));
}

/**
 * 获取状态显示信息
 */
export function getStateDisplay(
  machine: StateMachine,
  stateName: string
): { display: string; icon: string; color: string } | null {
  const state = machine.states[stateName];
  if (!state) return null;

  return {
    display: state.display,
    icon: state.icon,
    color: state.color,
  };
}

/**
 * 重新加载状态机
 */
export async function reloadStateMachines(): Promise<void> {
  stateMachineCache.clear();
  await loadStateMachines();
}

