# solo-6600011 - EEG Brain Wave Visualizer

## Tech
- **Frontend**: React + TypeScript + Recharts + Zustand
- **Backend**: Python + FastAPI + NumPy + SciPy
- **通道配置**: `shared/channels.json`（前端、后端和本地校验共用）

## Start
```bash
# 后端：导入和 startup 都会校验 shared/channels.json，配置冲突时拒绝启动
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# 前端：npm run dev 会先执行通道校验，Vite 启动时会再次阻断非法配置
cd frontend && npm install && npm run dev
```

## 通道配置校验
```bash
cd frontend && npm run validate:channels
cd backend && python -m app.core.channel_config
```

校验内容包括：

- 通道编码唯一，且前 10 项必须保持 `Fp1, Fp2, F3, F4, C3, C4, P3, P4, O1, O2` 的历史顺序
- 中文显示名称非空且唯一
- 颜色为唯一的 `#RRGGBB` 值，并由通道配置统一驱动选择器、波形和当前关注展示
- `defaultChannelId` 必须在通道映射中存在
- 新增通道只能追加在 10 个历史通道之后；编码、名称、颜色或默认通道缺失会逐条列出冲突

前端 `npm run build` 会自动执行校验，因此正常构建不依赖人工逐页检查。历史录制仍按录制时保存的通道编码读取；未知编码会以编码本身作为兜底显示，不阻断回放。
