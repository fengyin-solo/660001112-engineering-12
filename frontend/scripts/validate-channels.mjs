import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const configPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(scriptDir, '../../config/channels.json');
const baselineChannels = ['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2'];
const allowedTopLevelKeys = new Set(['schemaVersion', 'defaultChannel', 'channels']);
const codePattern = /^[A-Za-z]+[0-9]+$/;
const colorPattern = /^#[0-9A-F]{6}$/;

export function validateChannelConfig(config) {
  const errors = [];

  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    return ['channels.json 顶层必须是对象'];
  }

  for (const key of Object.keys(config)) {
    if (!allowedTopLevelKeys.has(key)) {
      errors.push(`存在未知配置项: ${key}`);
    }
  }

  if (!Number.isInteger(config.schemaVersion) || config.schemaVersion < 1) {
    errors.push('schemaVersion 必须是大于等于 1 的整数');
  }

  if (!Array.isArray(config.channels)) {
    errors.push('channels 必须是数组');
    return errors;
  }

  if (config.channels.length < baselineChannels.length) {
    errors.push(`通道数量不能少于历史兼容所需的 ${baselineChannels.length} 个，当前为 ${config.channels.length} 个`);
  }

  const codes = new Set();
  const displayNames = new Set();
  const colors = new Set();

  config.channels.forEach((channel, index) => {
    const location = `channels[${index}]`;

    if (channel === null || typeof channel !== 'object' || Array.isArray(channel)) {
      errors.push(`${location} 必须是对象`);
      return;
    }

    const allowedKeys = new Set(['code', 'displayName', 'color']);
    for (const key of Object.keys(channel)) {
      if (!allowedKeys.has(key)) {
        errors.push(`${location} 存在未知字段: ${key}`);
      }
    }

    if (typeof channel.code !== 'string' || !codePattern.test(channel.code)) {
      errors.push(`${location}.code 必须使用标准通道编码，例如 Fp1`);
    } else if (codes.has(channel.code)) {
      errors.push(`通道编码重复: ${channel.code}`);
    } else {
      codes.add(channel.code);
    }

    if (typeof channel.displayName !== 'string' || channel.displayName.trim() === '') {
      errors.push(`${location}(${channel.code ?? index}) 缺少非空 displayName`);
    } else if (displayNames.has(channel.displayName)) {
      errors.push(`通道显示名称重复: ${channel.displayName}`);
    } else {
      displayNames.add(channel.displayName);
    }

    if (typeof channel.color !== 'string' || !colorPattern.test(channel.color)) {
      errors.push(`${location}(${channel.code ?? index}) 的 color 必须是 #RRGGBB 格式`);
    } else {
      const normalizedColor = channel.color;
      if (colors.has(normalizedColor)) {
        errors.push(`通道颜色重复: ${channel.code} 使用了 ${channel.color}`);
      }
      colors.add(normalizedColor);
    }
  });

  const actualBaseline = baselineChannels.map((_, index) => config.channels[index]?.code);
  const mismatchIndex = baselineChannels.findIndex((code, index) => code !== actualBaseline[index]);
  if (mismatchIndex !== -1) {
    errors.push(
      `前 ${baselineChannels.length} 个历史通道顺序必须固定为 ${baselineChannels.join(', ')}；` +
      `第 ${mismatchIndex + 1} 个应为 ${baselineChannels[mismatchIndex]}，实际为 ${actualBaseline[mismatchIndex] ?? '缺失'}`
    );
  }

  const configuredDefault = config.defaultChannel;
  if (typeof configuredDefault !== 'string' || !codes.has(configuredDefault)) {
    errors.push(`defaultChannel 必须引用 channels 中已有的通道编码，当前为: ${String(configuredDefault)}`);
  }

  const missingBaseline = baselineChannels.filter(code => !codes.has(code));
  if (missingBaseline.length > 0) {
    errors.push(`缺少历史回放兼容通道: ${missingBaseline.join(', ')}`);
  }

  return errors;
}

function loadAndValidate() {
  let rawConfig;
  try {
    rawConfig = fs.readFileSync(configPath, 'utf8');
  } catch (error) {
    return [`无法读取通道配置 ${configPath}: ${error.message}`];
  }

  try {
    return validateChannelConfig(JSON.parse(rawConfig));
  } catch (error) {
    return [`channels.json 不是合法 JSON: ${error.message}`];
  }
}

const errors = loadAndValidate();
if (errors.length > 0) {
  console.error('通道配置校验失败，已阻止启动或构建：');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`通道配置校验通过：${configPath}`);
