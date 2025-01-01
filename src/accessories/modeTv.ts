import { BaseHueSyncBoxDevice } from './base';
import type {
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';
import { HueSyncBoxPlatform } from '../platform';
import { SyncBoxClient } from '../lib/client';
import { State } from '../state';
import { BaseTvDevice } from './baseTv';

export class ModeDevice extends BaseTvDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected client: SyncBoxClient,
    protected state: State
  ) {
    super(platform, accessory, client, state);
    this.service
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet(async (value: CharacteristicValue) => {
        const mode = this.numberToMode[value as number];
        this.platform.log.debug('Switch mode to ' + mode);
        return await this.updateExecution({
          mode,
        });
      });
  }

  protected createInputServices() {
    const modeInputServices: Service[] = [];
    for (let i = 1; i <= 4; i++) {
      const position = 'MODE ' + i;
      const name = this.numberToMode[i];
      const modeInputService = this.getInputService(name, position);
      // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
      this.service.addLinkedService(modeInputService);
      modeInputServices.push(modeInputService);
    }
    this.updateSources(modeInputServices);
  }

  protected getSuffix(): string {
    return '-M';
  }

  protected getServiceSubType(): string | undefined {
    return 'ModeAccessory';
  }

  protected getServiceName(): string | undefined {
    return 'Mode';
  }

  protected isLightBulbEnabled(): boolean {
    return this.platform.config.modeTvAccessoryLightbulb;
  }

  updateTv(): void {
    // Updates the mode characteristic
    this.platform.log.debug('Updated mode to ' + this.state.execution.mode);
    this.service.updateCharacteristic(
      this.platform.Characteristic.ActiveIdentifier,
      this.modeToNumber[this.state.execution.mode]
    );
  }
}
