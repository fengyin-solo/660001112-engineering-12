import json
import re
import sys
from functools import lru_cache
from pathlib import Path
from typing import Any

CHANNEL_CONFIG_PATH = Path(__file__).resolve().parents[3] / 'shared' / 'channels.json'
REQUIRED_CHANNELS = ('Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2')
CHANNEL_ID_PATTERN = re.compile(r'^[A-Za-z]+\d+[A-Za-z]*$')
HEX_COLOR_PATTERN = re.compile(r'^#[0-9a-fA-F]{6}$')


def _is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def load_channel_config(config_path: Path = CHANNEL_CONFIG_PATH) -> dict[str, Any]:
    with config_path.open(encoding='utf-8') as config_file:
        return json.load(config_file)


def validate_channel_config(config: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    def add_error(message: str) -> None:
        errors.append(message)

    if not isinstance(config, dict):
        return ['通道配置必须是对象。']

    if not isinstance(config.get('version'), int) or config['version'] < 1:
        add_error('version 必须是大于等于 1 的整数。')

    default_channel_id = config.get('defaultChannelId')
    if not _is_non_empty_string(default_channel_id):
        add_error('defaultChannelId 缺失或不是非空字符串。')

    channels = config.get('channels')
    if not isinstance(channels, list) or not channels:
        errors.append('channels 必须是非空数组。')
        return errors

    ids: set[str] = set()
    display_names: set[str] = set()
    colors: set[str] = set()
    actual_ids: list[str] = []

    for index, channel in enumerate(channels, start=1):
        position = f'第 {index} 项'
        if not isinstance(channel, dict):
            add_error(f'{position} 通道必须是对象。')
            continue

        channel_id = channel.get('id')
        if not _is_non_empty_string(channel_id):
            add_error(f'{position} 缺少通道编码 id。')
        else:
            channel_id = channel_id.strip()
            actual_ids.append(channel_id)
            if not CHANNEL_ID_PATTERN.fullmatch(channel_id):
                add_error(f'通道编码 {channel_id} 格式非法，应采用字母开头并包含数字的 EEG 编码，例如 Fp1。')
            if channel_id in ids:
                add_error(f'通道编码重复：{channel_id}。')
            ids.add(channel_id)

        display_name = channel.get('displayName')
        if not _is_non_empty_string(display_name):
            add_error(f'通道 {channel_id or position} 缺少显示名称 displayName。')
        else:
            display_name = display_name.strip()
            if display_name in display_names:
                add_error(f'通道显示名称重复：{display_name}。')
            display_names.add(display_name)

        color = channel.get('color')
        if not _is_non_empty_string(color):
            add_error(f'通道 {channel_id or position} 缺少颜色 color。')
        else:
            color = color.strip()
            if not HEX_COLOR_PATTERN.fullmatch(color):
                add_error(f'通道 {channel_id} 的颜色 {color} 非法，必须使用 #RRGGBB 格式。')
            else:
                normalized_color = color.lower()
                if normalized_color in colors:
                    add_error(f'通道 {channel_id} 的颜色重复：{color}。')
                colors.add(normalized_color)

    for index, expected_id in enumerate(REQUIRED_CHANNELS):
        actual_id = actual_ids[index] if index < len(actual_ids) else '缺失'
        if actual_id != expected_id:
            add_error(f'历史通道顺序错误：第 {index + 1} 项应为 {expected_id}，实际为 {actual_id}。')

    for index, actual_id in enumerate(actual_ids[len(REQUIRED_CHANNELS):], start=len(REQUIRED_CHANNELS) + 1):
        if actual_id in REQUIRED_CHANNELS:
            add_error(f'第 {index} 项的历史通道 {actual_id} 只能保留在前 {len(REQUIRED_CHANNELS)} 项，不能追加到新增通道区域。')

    if _is_non_empty_string(default_channel_id) and default_channel_id.strip() not in ids:
        add_error(f'defaultChannelId={default_channel_id} 在 channels 中没有对应映射。')

    return errors


def format_channel_config_errors(errors: list[str]) -> str:
    return '\n'.join([
        f'通道配置校验失败（{len(errors)} 项冲突）：',
        *[f'- {error}' for error in errors],
    ])


@lru_cache(maxsize=1)
def get_channel_config() -> dict[str, Any]:
    try:
        config = load_channel_config()
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f'通道配置读取失败：{exc}') from exc

    errors = validate_channel_config(config)
    if errors:
        raise RuntimeError(format_channel_config_errors(errors))
    return config


def get_channel_definitions() -> tuple[dict[str, Any], ...]:
    return tuple(get_channel_config()['channels'])


def get_channels() -> tuple[str, ...]:
    return tuple(channel['id'] for channel in get_channel_definitions())


def get_channel(channel_id: str) -> dict[str, Any] | None:
    for channel in get_channel_definitions():
        if channel['id'] == channel_id:
            return channel
    return None


if __name__ == '__main__':
    try:
        config_path = Path(sys.argv[1]) if len(sys.argv) > 1 else CHANNEL_CONFIG_PATH
        loaded_config = load_channel_config(config_path)
        config_errors = validate_channel_config(loaded_config)
        if config_errors:
            raise RuntimeError(format_channel_config_errors(config_errors))
    except (OSError, json.JSONDecodeError, RuntimeError) as exc:
        print(exc)
        raise SystemExit(1) from exc
    print(f'通道配置校验通过：{len(loaded_config["channels"])} 个通道。')
