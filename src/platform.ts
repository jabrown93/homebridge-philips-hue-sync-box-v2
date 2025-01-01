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
import { SyncBoxDevice } from './device';
import { SyncBoxClient } from './lib/client';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

export class HueSyncBoxPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly config: HueSyncBoxPlatformConfig;
  public readonly HAP: HAP;
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  public readonly log: Logging | Console;
  public readonly client: SyncBoxClient;
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
    this.client = new SyncBoxClient(this.log, this.config);

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
    this.log.debug('existing devices:', this.accessories);
    const state = await this.client.getState();
    this.device = new SyncBoxDevice(this, state);
    const devices = this.device.discoverDevices();
    // loop over the discovered devices and register each one if it has not already been registered
    const uuids = devices.map(device => {
      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const newAccessory = device.accessory;
      const uuid = device.accessory.UUID;
      this.log.debug('UUID:', uuid);
      this.log.debug('accessories contains:', this.accessories.has(uuid));
      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.get(uuid);
      if (existingAccessory) {
        this.log.debug('Updating existing accessory:', existingAccessory.displayName);
        this.api.updatePlatformAccessories([existingAccessory]);
      } else {
        this.log.info('Registering new accessory:', newAccessory.context.kind);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          newAccessory,
        ]);
      }
      return uuid;
    });

    this.accessories.forEach(existingAccessory => {
      if (!uuids.includes(existingAccessory.UUID)) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          existingAccessory,
        ]);
        this.log.info(
          'Removing existing accessory from cache:',
          existingAccessory.displayName
        );
      }
    });

    const externalAccessories = this.device.getExternalAccessories();
    externalAccessories.forEach(externalAccessory => {
      const uuid = externalAccessory.UUID;
      const existingAccessory = this.accessories.get(uuid);
      if (!existingAccessory) {
        this.api.publishExternalAccessories(PLUGIN_NAME, [externalAccessory]);
      }
    });

    this.device?.update(state);
    setInterval(async () => {
      this.log.debug('Updating state');
      const state = await this.client.getState();
      this.device?.update(state);
    }, this.config.updateInterval);
  }
}
