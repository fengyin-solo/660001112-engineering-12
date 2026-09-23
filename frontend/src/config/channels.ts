import rawChannelConfig from '../../../config/channels.json';

export interface ChannelConfig {
  code: string;
  displayName: string;
  color: string;
}

interface ChannelConfigFile {
  schemaVersion: number;
  defaultChannel: string;
  channels: ChannelConfig[];
}

const channelConfigFile = rawChannelConfig as ChannelConfigFile;

export const CHANNEL_CONFIGS: readonly ChannelConfig[] = channelConfigFile.channels;
export const CHANNEL_CODES: readonly string[] = CHANNEL_CONFIGS.map(channel => channel.code);
export const CHANNEL_NAME_MAP: Readonly<Record<string, string>> = Object.fromEntries(
  CHANNEL_CONFIGS.map(channel => [channel.code, channel.displayName])
);
export const CHANNEL_COLOR_MAP: Readonly<Record<string, string>> = Object.fromEntries(
  CHANNEL_CONFIGS.map(channel => [channel.code, channel.color])
);
export const DEFAULT_CHANNEL = channelConfigFile.defaultChannel;

export const isKnownChannel = (channel: string): boolean => CHANNEL_NAME_MAP[channel] !== undefined;

export const getChannelDisplayName = (channel: string): string =>
  CHANNEL_NAME_MAP[channel] ?? channel;

export const getChannelColor = (channel: string): string =>
  CHANNEL_COLOR_MAP[channel] ?? '#1565c0';
