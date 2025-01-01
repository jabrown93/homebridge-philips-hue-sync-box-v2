import { HueSyncBoxPlatform } from './platform';
import { State } from './state';
import type { PlatformAccessory } from 'homebridge';
import { SwitchDevice } from './accessories/switch';
import { BaseHueSyncBoxDevice } from './accessories/base';
import { LightbulbDevice } from './accessories/lightbulb';
import { TvDevice } from './accessories/tv';
import { ModeDevice } from './accessories/modeTv';
import { IntensityTvDevice } from './accessories/intensityTv';
import { EntertainmentTvDevice } from './accessories/entertainmentTv';

export class SyncBoxDevice {
  private readonly UUIDGen;
  private readonly Accessory: typeof PlatformAccessory;
  private readonly platform: HueSyncBoxPlatform;
  private state: State;
  private externalAccessories: PlatformAccessory[] = [];
  private readonly unusedDeviceAccessories: Map<string, PlatformAccessory>;

  private syncBoxDevices: BaseHueSyncBoxDevice[] = [];
  private readonly _lightbulb = 'lightbulb';
  private readonly _switch = 'switch';

  private tvAccessoryTypesToCategory: Record<string, number>;

  constructor(platform: HueSyncBoxPlatform, state: State) {
    this.platform = platform;
    this.state = state;
    this.UUIDGen = this.platform.api.hap.uuid;
    this.Accessory = this.platform.api.platformAccessory;
    this.unusedDeviceAccessories = new Map();
    for (const key in this.platform.accessories) {
      this.unusedDeviceAccessories.set(key, this.platform.accessories[key]);
    }
    if (!state.device) {
      throw new Error('Device is not defined');
    }

    this.tvAccessoryTypesToCategory = {
      settopbox: this.platform.api.hap.Categories.TV_SET_TOP_BOX,
      tvstick: this.platform.api.hap.Categories.TV_STREAMING_STICK,
      audioreceiver: this.platform.api.hap.Categories.AUDIO_RECEIVER,
      television: this.platform.api.hap.Categories.TELEVISION,
    };
  }

  private readonly _lightBulbAccessory = 'LightBulbAccessory';

  private getLightBulbAccessory(): PlatformAccessory {
    // find the key of the accessory with lightbulb

    const lightBulbAccessory = new this.Accessory(
      this.state.device.name,
      this.UUIDGen.generate(this._lightBulbAccessory)
    );
    lightBulbAccessory.context.kind = this._lightBulbAccessory;
    return lightBulbAccessory;
  }

  private readonly _switchAccessory = 'SwitchAccessory';

  private getSwitchAccessory(): PlatformAccessory {
    this.platform.log.debug('Adding new accessory with kind SwitchAccessory.');
    const switchAccessory = new this.Accessory(
      this.state.device.name,
      this.UUIDGen.generate(this._switchAccessory)
    );
    switchAccessory.context.kind = this._switchAccessory;
    return switchAccessory;
  }

  public discoverDevices(): BaseHueSyncBoxDevice[] {
    this.platform.log.debug('Discovering devices');
    const devices: BaseHueSyncBoxDevice[] = [];
    if (this.platform.config.baseAccessory === this._switch) {
      const switchAccessory = this.getSwitchAccessory();
      const switchDevice = new SwitchDevice(
        this.platform,
        switchAccessory,
        this.platform.client,
        this.state
      );
      devices.push(switchDevice);
      this.syncBoxDevices.push(switchDevice);
    }

    if (this.platform.config.baseAccessory === this._lightbulb) {
      const accessory = this.getLightBulbAccessory();
      const device = new LightbulbDevice(
        this.platform,
        accessory,
        this.platform.client,
        this.state
      );
      devices.push(device);
      this.syncBoxDevices.push(device);
    }

    if (this.platform.config.tvAccessory) {
      const tvAccessory = this.getBaseTvAccessory(
        'TVAccessory',
        this.platform.config.tvAccessoryType
      );
      const device = new TvDevice(
        this.platform,
        tvAccessory,
        this.platform.client,
        this.state
      );

      devices.push(device);
      this.syncBoxDevices.push(device);
    }

    if (this.platform.config.modeTvAccessory) {
      const accessory = this.getBaseTvAccessory(
        'ModeTVAccessory',
        this.platform.config.modeTvAccessoryType
      );
      const device = new ModeDevice(
        this.platform,
        accessory,
        this.platform.client,
        this.state
      );
      devices.push(device);
      this.syncBoxDevices.push(device);
    }

    if (this.platform.config.intensityTvAccessory) {
      const accessory = this.getBaseTvAccessory(
        'IntensityTVAccessory',
        this.platform.config.intensityTvAccessoryType
      );
      const device = new IntensityTvDevice(
        this.platform,
        accessory,
        this.platform.client,
        this.state
      );
      devices.push(device);
      this.syncBoxDevices.push(device);
    }

    if (this.platform.config.entertainmentTvAccessory) {
      const accessory = this.getBaseTvAccessory(
        'EntertainmentTVAccessory',
        this.platform.config.entertainmentTvAccessoryType
      );
      const device = new EntertainmentTvDevice(
        this.platform,
        accessory,
        this.platform.client,
        this.state
      );
      devices.push(device);
      this.syncBoxDevices.push(device);
    }
    return devices;
  }

  public getExternalAccessories(): PlatformAccessory[] {
    return this.externalAccessories;
  }

  private getBaseTvAccessory(accessoryName: string, accessoryType: string) {
    this.platform.log.debug(
      'Setting up accessory ' +
        accessoryName +
        ' with kind ' +
        accessoryType +
        '.'
    );
    const accessory = new this.Accessory(
      this.state.device.name,
      this.UUIDGen.generate(accessoryName)
    );
    accessory.category = this.tvAccessoryTypesToCategory[accessoryType];
    accessory.context.kind = accessoryType;
    this.externalAccessories.push(accessory);
    return accessory;
  }

  public update(state: State) {
    this.platform.log.debug('Updating state called');
    for (const accessory of this.syncBoxDevices) {
      this.platform.log.debug(
        'Updating accessory ' + accessory.accessory.displayName
      );
      accessory.update(state);
    }
  }
}
