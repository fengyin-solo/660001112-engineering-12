from fastapi import APIRouter, HTTPException
from ..core.channel_config import get_channels
from ..services.eeg_processor import generate_mock_eeg, compute_band_power, compute_spectrogram, compute_brain_state, compute_correlation, SAMPLE_RATE

CHANNELS = get_channels()
router = APIRouter(prefix="/eeg", tags=["eeg"])


def get_channel_data(channel: str, duration: float = 5.0) -> tuple[dict, list[float]]:
    data = generate_mock_eeg(duration)
    if channel not in data['data']:
        raise HTTPException(status_code=404, detail=f'Unknown channel: {channel}')
    return data, data['data'][channel]


@router.get("/stream")
async def stream_eeg(duration: float = 5.0):
    return generate_mock_eeg(duration)


@router.get("/bands/{channel}")
async def band_power(channel: str):
    _, channel_data = get_channel_data(channel)
    return {'channel': channel, 'bands': compute_band_power(channel_data, SAMPLE_RATE)}


@router.get("/brain-state/{channel}")
async def brain_state(channel: str):
    _, channel_data = get_channel_data(channel)
    return {'channel': channel, 'state': compute_brain_state(channel_data, SAMPLE_RATE)}


@router.get("/spectrogram/{channel}")
async def spectrogram(channel: str):
    _, channel_data = get_channel_data(channel)
    return {'channel': channel, 'spectrogram': compute_spectrogram(channel_data, SAMPLE_RATE)}


@router.get("/correlation/{channel}")
async def correlation(channel: str, duration: float = 3.0):
    data, _ = get_channel_data(channel, duration)
    return compute_correlation(channel, data['data'], SAMPLE_RATE)


@router.get("/channels")
async def list_channels():
    return {'channels': list(CHANNELS)}


@router.get("/sample/{channel}")
async def full_sample(channel: str, duration: float = 3.0):
    data, channel_data = get_channel_data(channel, duration)
    return {
        'channel': channel,
        'eeg': data,
        'bands': compute_band_power(channel_data, SAMPLE_RATE),
        'brainState': compute_brain_state(channel_data, SAMPLE_RATE),
        'correlation': compute_correlation(channel, data['data'], SAMPLE_RATE)
    }
