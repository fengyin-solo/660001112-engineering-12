import React from 'react';
import { useEEGStore } from '../store/eeg';
import {
  CHANNELS,
  getChannel,
  getChannelDisplayName,
  getEffectiveChannelId,
} from '../config/channels';

export const ChannelSelector: React.FC = () => {
  const {
    selectedChannel,
    setChannel,
    playbackMode,
    activeRecording,
  } = useEEGStore();
  const activeChannelId = getEffectiveChannelId(
    selectedChannel,
    playbackMode ? activeRecording?.channel : undefined,
  );
  const activeChannel = getChannel(activeChannelId);
  const activeColor = activeChannel?.color ?? '#607d8b';

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#90caf9' }}>通道选择</h3>
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(21, 101, 192, 0.2)',
        borderRadius: '8px',
        border: `2px solid ${activeColor}`,
      }}>
        <div style={{ fontSize: '11px', color: '#90caf9', marginBottom: '4px' }}>
          {playbackMode ? '回放通道' : '当前关注'}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>
          {activeChannelId}
        </div>
        <div style={{ fontSize: '12px', color: activeColor, marginTop: '2px' }}>
          {getChannelDisplayName(activeChannelId)}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {CHANNELS.map(ch => {
          const isSelected = activeChannelId === ch;
          const channel = getChannel(ch);
          return (
            <button
              key={ch}
              disabled={playbackMode}
              onClick={() => setChannel(ch)}
              title={getChannelDisplayName(ch)}
              style={{
                padding: isSelected ? '8px 14px' : '6px 12px',
                borderRadius: '16px',
                border: isSelected ? `2px solid ${channel?.color ?? '#64b5f6'}` : '1px solid #37474f',
                background: isSelected ? channel?.color ?? '#1565c0' : '#1e293b',
                color: isSelected ? '#fff' : '#94a3b8',
                cursor: playbackMode ? 'not-allowed' : 'pointer',
                opacity: playbackMode && !isSelected ? 0.6 : 1,
                fontSize: isSelected ? '13px' : '12px',
                fontWeight: isSelected ? 700 : 400,
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 2px 8px ${channel?.color ?? '#1565c0'}80` : 'none',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {ch}
            </button>
          );
        })}
      </div>
    </div>
  );
};
