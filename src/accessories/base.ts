import { Execution, State } from '../state';
import {
  Characteristic,
  type CharacteristicValue,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';
import { HueSyncBoxPlatform } from '../platform';
import { SyncBoxClient } from '../lib/client';
import { PASSTHROUGH, POWER_SAVE } from '../lib/constants';

export abstract class BaseHueSyncBoxDevice {
  protected readonly platform: HueSyncBoxPlatform;
  public readonly accessory: PlatformAccessory;
  protected readonly client: SyncBoxClient;
  protected state: State;
  protected service: Service;

  tvAccessoryTypesToCategory: Record<string, number>;

  constructor(
    platform: HueSyncBoxPlatform,
    accessory: PlatformAccessory,
    client: SyncBoxClient,
    state: State
  ) {
    this.platform = platform;
    this.accessory = accessory;
    this.client = client;
    this.state = state;

    const existingService =
      this.getServiceSubType() !== undefined
        ? this.accessory.getService(this.getServiceType())
        : this.accessory.getServiceById(
            this.getServiceType(),
            this.getServiceSubType() as string
          );

    this.service =
      existingService ||
      this.accessory.addService(
        this.getServiceType(),
        this.getServiceName(),
        this.getServiceSubType()
      );

    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.displayName
    );

    this.service
      .getCharacteristic(this.getPowerCharacteristic())
      .onSet(this.handlePowerCharacteristicSet.bind(this)); // SET - bind to the `setOn` method below

    this.tvAccessoryTypesToCategory = {
      settopbox: this.platform.api.hap.Categories.TV_SET_TOP_BOX,
      tvstick: this.platform.api.hap.Categories.TV_STREAMING_STICK,
      audioreceiver: this.platform.api.hap.Categories.AUDIO_RECEIVER,
      television: this.platform.api.hap.Categories.TELEVISION,
    };

    const accessoryInformationService =
      this.accessory.getService(this.platform.Service.AccessoryInformation) ||
      this.accessory.addService(this.platform.Service.AccessoryInformation);

    accessoryInformationService
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Philips')
      .setCharacteristic(this.platform.Characteristic.Model, 'Sync Box')
      .setCharacteristic(
        this.platform.Characteristic.FirmwareRevision,
        this.state.device.firmwareVersion
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.state.device.uniqueId + this.getSuffix()
      );
  }

  protected abstract getServiceType();

  protected getServiceSubType(): string | undefined {
    return undefined;
  }

  protected getServiceName(): string | undefined {
    return undefined;
  }

  protected updateMode(
    currentVal: CharacteristicValue | null,
    newValue: CharacteristicValue
  ) {
    this.platform.log.debug('Switch state to ' + newValue);
    console.log('well it was called');
    // Ignores changes if the new value equals the old value
    if (currentVal === newValue) {
      return;
    }
    let mode: string;
    // Saves the changes
    if (newValue) {
      this.platform.log.debug('Switch state to ON');
      mode = this.platform.config.defaultOnMode;
      if (mode === 'lastSyncMode') {
        mode = this?.state?.execution?.lastSyncMode || 'video';
      }
    } else {
      this.platform.log.debug('Switch state to OFF');
      mode = this.platform.config.defaultOffMode;
    }
    return this.updateExecution({
      mode,
    });
  }

  protected async updateExecution(execution: Partial<Execution>) {
    try {
      return await this.platform.client.updateExecution(execution);
    } catch (e) {
      this.platform.log.debug('Failed to update execution', e);
    }
  }

  protected async setBrightness(value: CharacteristicValue) {
    this.platform.log.debug('Switch brightness to ' + value);
    await this.updateExecution({
      brightness: Math.round(((value as number) / 100.0) * 200),
    });
  }

  public update(state: State): void {
    // Updates the on characteristic
    this.state = state;
    this.platform.log.debug('Updated state to ' + this.state.execution.mode);
    this.service.updateCharacteristic(
      this.platform.Characteristic.On,
      this.state.execution.mode !== POWER_SAVE &&
        this.state.execution.mode !== PASSTHROUGH
    );
  }

  protected getSuffix(): string {
    return '';
  }

  protected getMode() {
    let mode = 'video';
    if (
      this.state.execution.mode !== POWER_SAVE &&
      this.state.execution.mode !== PASSTHROUGH
    ) {
      mode = this.state.execution.mode;
    } else if (this.state.execution.lastSyncMode) {
      mode = this.state.execution.lastSyncMode;
    }
    return mode;
  }

  protected getInputService(name: string, position: string): Service {
    const inputService =
      this.accessory.getServiceById(
        this.platform.Service.InputSource,
        position
      ) ||
      this.accessory.addService(
        this.platform.Service.InputSource,
        position.toLowerCase().replace(' ', ''),
        position
      );

    // Sets the TV name
    inputService
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, name)
      .setCharacteristic(
        this.platform.Characteristic.IsConfigured,
        this.platform.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.Characteristic.CurrentVisibilityState,
        this.platform.Characteristic.CurrentVisibilityState.SHOWN
      )
      .setCharacteristic(
        this.platform.Characteristic.TargetVisibilityState,
        this.platform.Characteristic.TargetVisibilityState.SHOWN
      );
    inputService
      .setCharacteristic(
        this.platform.Characteristic.Identifier,
        position[position.length - 1]
      )
      .setCharacteristic(
        this.platform.Characteristic.InputSourceType,
        this.platform.Characteristic.InputSourceType.HDMI
      );

    return inputService;
  }

  protected setVisibility(service: Service) {
    return (value: CharacteristicValue) => {
      service.setCharacteristic(
        this.platform.Characteristic.CurrentVisibilityState,
        value
      );
    };
  }

  protected getPowerCharacteristic(): WithUUID<new () => Characteristic> {
    return this.platform.Characteristic.Active;
  }

  protected handlePowerCharacteristicSet(value: CharacteristicValue) {
    this.platform.log.debug('Set On ->', value);
    const currentVal = this.service.getCharacteristic(
      this.getPowerCharacteristic()
    ).value;
    return this.updateMode(currentVal, value);
  }
}
