import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  Service,
  HAP,
} from 'homebridge';

import { HueSyncBoxPlatformConfig } from './lib/config';
import { PhilipsHueSyncBoxClient } from './lib/philips-hue-sync-box-client';
import Bottleneck from 'bottleneck';
import { SyncBoxDevice } from './device';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HueSyncBoxPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly config: HueSyncBoxPlatformConfig;
  public readonly HAP: HAP;
  // this is used to track restored cached accessories
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  public readonly discoveredCacheUUIDs: string[] = [];

  // This is only required when using Custom Services and Characteristics not support by HomeKit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly CustomServices: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly CustomCharacteristics: any;
  public readonly log: Logging | Console;
  public readonly client: PhilipsHueSyncBoxClient;
  public readonly limiter: Bottleneck;
  public readonly api: API;
  private device: SyncBoxDevice | undefined;

  constructor(
    public readonly logger: Logging,
    public readonly platformConfig: HueSyncBoxPlatformConfig,
    public readonly apiInput: API
  ) {
    if (!apiInput) {
      throw new Error('API is not defined');
    }
    this.config = platformConfig;
    this.api = apiInput;
    this.log = logger ?? console;
    // Checks if all required information is provided
    if (!this.config.syncBoxIpAddress || !this.config.syncBoxApiAccessToken) {
      this.log.error(
        'Missing required configuration parameters syncBoxIpAddress or syncBoxApiAccessToken'
      );
      throw new Error('Missing required configuration parameters');
    }
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;
    this.HAP = this.api.hap;
    this.client = new PhilipsHueSyncBoxClient(this);
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 1000.0 / this.config.requestsPerSecond,
    });

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {
      this.log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      await this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.set(accessory.UUID, accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    const state = await this.client.getState();
    this.device = new SyncBoxDevice(this, state);
    this.limiter.schedule(async () => {
      const state = await this.client.getState();
      this.device?.update(state);
    }, this.config.updateInterval);
  }
}
