import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const CHANNEL_CONFIG_PATH = path.resolve(SCRIPT_DIR, '../../shared/channels.json');

export const REQUIRED_CHANNELS = [
  'Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2',
];

const CHANNEL_ID_PATTERN = /^[A-Za-z]+\d+[A-Za-z]*$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export function loadChannelConfig(configPath = CHANNEL_CONFIG_PATH) {
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw);
}

export function validateChannelConfig(config) {
  const errors = [];
  const addError = (message) => errors.push(message);

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return ['通道配置必须是对象。'];
  }
  if (!Number.isInteger(config.version) || config.version < 1) {
    addError('version 必须是大于等于 1 的整数。');
  }
  if (!isNonEmptyString(config.defaultChannelId)) {
    addError('defaultChannelId 缺失或不是非空字符串。');
  }
  if (!Array.isArray(config.channels) || config.channels.length === 0) {
    addError('channels 必须是非空数组。');
    return errors;
  }

  const ids = new Set();
  const displayNames = new Set();
  const colors = new Set();
  const actualIds = [];

  config.channels.forEach((channel, index) => {
    const position = `第 ${index + 1} 项`;

    if (!channel || typeof channel !== 'object' || Array.isArray(channel)) {
      addError(`${position} 通道必须是对象。`);
      return;
    }
    if (!isNonEmptyString(channel.id)) {
      addError(`${position} 缺少通道编码 id。`);
    } else {
      const id = channel.id.trim();
      actualIds.push(id);
      if (!CHANNEL_ID_PATTERN.test(id)) {
        addError(`通道编码 ${id} 格式非法，应采用字母开头并包含数字的 EEG 编码，例如 Fp1。`);
      }
      if (ids.has(id)) {
        addError(`通道编码重复：${id}。`);
      }
      ids.add(id);
    }

    if (!isNonEmptyString(channel.displayName)) {
      addError(`通道 ${channel.id ?? position} 缺少显示名称 displayName。`);
    } else {
      const displayName = channel.displayName.trim();
      if (displayNames.has(displayName)) {
        addError(`通道显示名称重复：${displayName}。`);
      }
      displayNames.add(displayName);
    }

    if (!isNonEmptyString(channel.color)) {
      addError(`通道 ${channel.id ?? position} 缺少颜色 color。`);
    } else {
      const color = channel.color.trim();
      if (!HEX_COLOR_PATTERN.test(color)) {
        addError(`通道 ${channel.id ?? position} 的颜色 ${color} 非法，必须使用 #RRGGBB 格式。`);
      } else {
        const normalizedColor = color.toLowerCase();
        if (colors.has(normalizedColor)) {
          addError(`通道 ${channel.id} 的颜色重复：${color}。`);
        }
        colors.add(normalizedColor);
      }
    }
  });

  REQUIRED_CHANNELS.forEach((expectedId, index) => {
    const actualId = actualIds[index];
    if (actualId !== expectedId) {
      addError(`历史通道顺序错误：第 ${index + 1} 项应为 ${expectedId}，实际为 ${actualId ?? '缺失'}。`);
    }
  });

  actualIds.forEach((id, index) => {
    if (index >= REQUIRED_CHANNELS.length && REQUIRED_CHANNELS.includes(id)) {
      addError(`历史通道 ${id} 只能保留在前 ${REQUIRED_CHANNELS.length} 项，不能追加到新增通道区域。`);
    }
  });

  if (isNonEmptyString(config.defaultChannelId) && !ids.has(config.defaultChannelId.trim())) {
    addError(`defaultChannelId=${config.defaultChannelId} 在 channels 中没有对应映射。`);
  }

  return errors;
}

export function formatChannelConfigErrors(errors) {
  return [`通道配置校验失败（${errors.length} 项冲突）：`, ...errors.map((error) => `- ${error}`)].join('\n');
}

function main() {
  try {
    const configPath = process.argv[2] ? path.resolve(process.argv[2]) : CHANNEL_CONFIG_PATH;
    const config = loadChannelConfig(configPath);
    const errors = validateChannelConfig(config);
    if (errors.length > 0) {
      console.error(formatChannelConfigErrors(errors));
      process.exit(1);
    }
    console.log(`通道配置校验通过：${config.channels.length} 个通道。`);
  } catch (error) {
    console.error(`通道配置校验失败：${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
