# EEG 通道配置

`channels.json` 是前后端唯一的 EEG 通道配置来源。

## 配置结构

```json
{
  "id": "Fp1",
  "displayName": "左前额",
  "color": "#1565c0"
}
```

- `id`：持久化到接口数据和本地录制中的通道编码，不随显示名称变化。
- `displayName`：通道选择、波形、频段、脑状态和录制回放页面使用的中文名称。
- `color`：该通道在各展示模块中的统一颜色，使用 `#RRGGBB` 格式。
- `defaultChannelId`：实时模式的默认关注通道，必须存在于 `channels` 中。

## 增加通道

新通道只能追加在十个历史通道之后：

```text
Fp1, Fp2, F3, F4, C3, C4, P3, P4, O1, O2
```

前 10 项的编码和顺序用于兼容已保存的本地录制和历史数据，不能调换、删除或改名编码。修改中文名称或颜色时只更新对应字段即可。

## 校验入口

```bash
cd frontend && npm run validate:channels
cd backend && python -m app.core.channel_config
```

前端开发启动、Vite 直接启动/构建和 `npm run build` 都会校验；后端导入配置及 FastAPI startup 也会校验。校验失败会列出全部冲突并退出，避免非法配置进入部署环境。
