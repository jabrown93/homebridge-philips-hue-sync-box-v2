import { PlatformConfig } from 'homebridge';

export interface HueSyncBoxPlatformConfig extends PlatformConfig {
  syncBoxIpAddress: string;
  syncBoxApiAccessToken: string;
  defaultOnMode: string;
  defaultOffMode: string;
  baseAccessory: 'lightbulb' | 'switch' | 'none';
  tvAccessory: boolean
  tvAccessoryType: 'tv' | 'settopbox' | 'tvstick' | 'audioreceiver'
  tvAccessoryLightbulb: boolean
  modeTvAccessory: boolean
  modeTvAccessoryType: 'tv' | 'settopbox' | 'tvstick' | 'audioreceiver'
  modeTvAccessoryLightbulb: boolean
  intensityTvAccessory: boolean
  intensityTvAccessoryType: 'tv' | 'settopbox' | 'tvstick' | 'audioreceiver'
  intensityTvAccessoryLightbulb: boolean
  entertainmentTvAccessory: boolean
  entertainmentTvAccessoryType: 'tv' | 'settopbox' | 'tvstick' | 'audioreceiver'
  entertainmentTvAccessoryLightbulb: boolean
  isApiEnabled: boolean
  apiPort: number
  apiToken: string
  requestsPerSecond: number
  updateInterval: number
}
