import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

CONFIG_PATH = Path(__file__).resolve().parents[3] / 'config' / 'channels.json'
BASELINE_CHANNELS = ('Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2')
CODE_PATTERN = re.compile(r'^[A-Za-z]+[0-9]+$')
COLOR_PATTERN = re.compile(r'^#[0-9A-F]{6}$')
ALLOWED_TOP_LEVEL_KEYS = {'schemaVersion', 'defaultChannel', 'channels'}
ALLOWED_CHANNEL_KEYS = {'code', 'displayName', 'color'}


def validate_channel_config(config: object) -> list[str]:
    errors: list[str] = []

    if not isinstance(config, dict):
        return ['channels.json 顶层必须是对象']

    typed_config: dict[str, Any] = config

    for key in typed_config:
        if key not in ALLOWED_TOP_LEVEL_KEYS:
            errors.append(f'存在未知配置项: {key}')

    schema_version = typed_config.get('schemaVersion')
    if not isinstance(schema_version, int) or isinstance(schema_version, bool) or schema_version < 1:
        errors.append('schemaVersion 必须是大于等于 1 的整数')

    channels = typed_config.get('channels')
    if not isinstance(channels, list):
        errors.append('channels 必须是数组')
        return errors

    if len(channels) < len(BASELINE_CHANNELS):
        errors.append(f'通道数量不能少于历史兼容所需的 {len(BASELINE_CHANNELS)} 个，当前为 {len(channels)} 个')

    codes: set[str] = set()
    display_names: set[str] = set()
    colors: set[str] = set()

    for index, channel in enumerate(channels):
        location = f'channels[{index}]'
        if not isinstance(channel, dict):
            errors.append(f'{location} 必须是对象')
            continue

        channel_item: dict[str, Any] = channel
        for key in channel_item:
            if key not in ALLOWED_CHANNEL_KEYS:
                errors.append(f'{location} 存在未知字段: {key}')

        code = channel_item.get('code')
        if not isinstance(code, str) or not CODE_PATTERN.fullmatch(code):
            errors.append(f'{location}.code 必须使用标准通道编码，例如 Fp1')
        elif code in codes:
            errors.append(f'通道编码重复: {code}')
        else:
            codes.add(code)

        display_name = channel_item.get('displayName')
        label = code if isinstance(code, str) else index
        if not isinstance(display_name, str) or not display_name.strip():
            errors.append(f'{location}({label}) 缺少非空 displayName')
        elif display_name in display_names:
            errors.append(f'通道显示名称重复: {display_name}')
        else:
            display_names.add(display_name)

        color = channel_item.get('color')
        if not isinstance(color, str) or not COLOR_PATTERN.fullmatch(color):
            errors.append(f'{location}({label}) 的 color 必须是 #RRGGBB 格式')
        else:
            normalized_color = color
            if normalized_color in colors:
                errors.append(f'通道颜色重复: {code} 使用了 {color}')
            colors.add(normalized_color)

    actual_baseline = []
    for i in range(len(BASELINE_CHANNELS)):
        channel = channels[i] if i < len(channels) else None
        actual_baseline.append(channel.get('code') if isinstance(channel, dict) else None)
    for index, expected_code in enumerate(BASELINE_CHANNELS):
        actual_code = actual_baseline[index]
        if actual_code != expected_code:
            errors.append(
                f'前 {len(BASELINE_CHANNELS)} 个历史通道顺序必须固定为 {", ".join(BASELINE_CHANNELS)}；'
                f'第 {index + 1} 个应为 {expected_code}，实际为 {actual_code or "缺失"}'
            )
            break

    default_channel = typed_config.get('defaultChannel')
    if not isinstance(default_channel, str) or default_channel not in codes:
        errors.append(f'defaultChannel 必须引用 channels 中已有的通道编码，当前为: {default_channel}')

    missing_baseline = [code for code in BASELINE_CHANNELS if code not in codes]
    if missing_baseline:
        errors.append(f'缺少历史回放兼容通道: {", ".join(missing_baseline)}')

    return errors


@lru_cache(maxsize=1)
def load_channel_config() -> dict[str, Any]:
    try:
        with CONFIG_PATH.open(encoding='utf-8') as file:
            config = json.load(file)
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f'无法读取通道配置 {CONFIG_PATH}: {error}') from error

    errors = validate_channel_config(config)
    if errors:
        detail = '\n- '.join(errors)
        raise RuntimeError(f'通道配置校验失败，已阻止服务启动：\n- {detail}')

    return config


CHANNEL_CONFIGS: tuple[dict[str, Any], ...] = tuple(load_channel_config()['channels'])
CHANNELS: tuple[str, ...] = tuple(channel['code'] for channel in CHANNEL_CONFIGS)
CHANNEL_NAMES: dict[str, str] = {channel['code']: channel['displayName'] for channel in CHANNEL_CONFIGS}
CHANNEL_COLORS: dict[str, str] = {channel['code']: channel['color'] for channel in CHANNEL_CONFIGS}
DEFAULT_CHANNEL: str = load_channel_config()['defaultChannel']
