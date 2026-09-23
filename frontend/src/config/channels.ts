import channelConfig from '../../../shared/channels.json';

export interface ChannelConfig {
  id: string;
  displayName: string;
  color: string;
}

export interface EEGChannelConfig {
  version: number;
  defaultChannelId: string;
  channels: ChannelConfig[];
}

export const eegChannelConfig = channelConfig as EEGChannelConfig;
export const CHANNELS = eegChannelConfig.channels.map(channel => channel.id);
export const DEFAULT_CHANNEL_ID = eegChannelConfig.defaultChannelId;

const channelById = new Map(
  eegChannelConfig.channels.map(channel => [channel.id, channel])
);

export const getChannel = (channelId: string): ChannelConfig | undefined => (
  channelById.get(channelId)
);

export const getChannelDisplayName = (channelId: string): string => (
  getChannel(channelId)?.displayName ?? channelId
);

export const getChannelColor = (channelId: string): string => (
  getChannel(channelId)?.color ?? '#607d8b'
);

export const getEffectiveChannelId = (
  selectedChannelId: string,
  playbackChannelId?: string,
): string => playbackChannelId ?? selectedChannelId;
