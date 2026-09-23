# solo-6600011 - EEG Brain Wave Visualizer

## Tech
- **Frontend**: React + TypeScript + Recharts + Zustand
- **Backend**: Python + FastAPI + NumPy + SciPy

## Start
```bash
cd backend && pip install -r requirements.txt && python scripts/validate_channels.py && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
```

`npm run dev` and `npm run build` run the frontend channel-config gate first. The backend also fails fast while importing `app.core.channels`, or can be checked explicitly:

```bash
cd backend && python scripts/validate_channels.py
cd frontend && npm run validate:channels
```

The canonical channel definitions are in `config/channels.json`. The first ten channel codes and their order are frozen for existing local recordings; additional channels may only be appended.
