import type {
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';

import { HueSyncBoxPlatform } from '../platform';
import { State } from '../state';
import { SyncBoxClient } from '../lib/client';
import { BaseHueSyncBoxDevice } from './base';
import { PASSTHROUGH, POWER_SAVE } from '../lib/constants';

export class SwitchDevice extends BaseHueSyncBoxDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected client: SyncBoxClient,
    protected state: State
  ) {
    super(platform, accessory, client, state);
  }

  protected getPowerCharacteristic() {
    return this.platform.Characteristic.On;
  }

  protected getServiceType() {
    return this.platform.Service.Switch;
  }
}
