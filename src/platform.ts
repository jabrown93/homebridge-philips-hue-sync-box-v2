import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  Service,
  HAP,
  PlatformConfig,
} from 'homebridge';

import { HueSyncBoxPlatformConfig } from './config';
import Bottleneck from 'bottleneck';
import { SyncBoxDevice } from './device';
import { SyncBoxClient } from './lib/client';

export class HueSyncBoxPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly config: HueSyncBoxPlatformConfig;
  public readonly HAP: HAP;
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  public readonly log: Logging | Console;
  public readonly client: SyncBoxClient;
  public readonly limiter: Bottleneck;
  public readonly api: API;
  private device: SyncBoxDevice | undefined;

  constructor(
    public readonly logger: Logging,
    public readonly platformConfig: PlatformConfig,
    public readonly apiInput: API
  ) {
    if (!apiInput) {
      throw new Error('API is not defined');
    }
    this.config = platformConfig as HueSyncBoxPlatformConfig;
    this.api = apiInput;
    this.log = logger ?? console;
    this.log.debug('Config:', this.config);
    this.log.info('Initializing platform:', this.config.name);

    if (!this.config.syncBoxIpAddress || !this.config.syncBoxApiAccessToken) {
      this.log.error('Missing required configuration parameters');
      throw new Error('Missing required configuration parameters');
    }

    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;
    this.HAP = this.api.hap;
    this.client = new SyncBoxClient(this);
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 1000.0 / this.config.requestsPerSecond,
    });

    this.log.info('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', async () => {
      this.log.debug('Executed didFinishLaunching callback');
      await this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.set(accessory.UUID, accessory);
  }

  async discoverDevices() {
    const state = await this.client.getState();
    this.device = new SyncBoxDevice(this, state);
    this.device.init();
    this.limiter.schedule(async () => {
      const state = await this.client.getState();
      this.device?.update(state);
    }, this.config.updateInterval);
  }
}
