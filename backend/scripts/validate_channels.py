import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.channels import CONFIG_PATH, validate_channel_config

__all__ = []

if __name__ == '__main__':
    import json

    config_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else CONFIG_PATH
    with config_path.open(encoding='utf-8') as file:
        config = json.load(file)
    errors = validate_channel_config(config)

    if errors:
        print('通道配置校验失败，已阻止服务启动：')
        for error in errors:
            print(f'- {error}')
        raise SystemExit(1)

    print(f'通道配置校验通过：{config_path}，共 {len(config["channels"])} 个通道')
