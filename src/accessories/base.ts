import { Execution, State } from '../state';
import {
  type CharacteristicValue,
  PlatformAccessory,
  UnknownContext,
} from 'homebridge';
import { HueSyncBoxPlatform } from '../platform';
import { SyncBoxClient } from '../lib/client';

export abstract class BaseHueSyncBoxDevice {
  protected readonly platform: HueSyncBoxPlatform;
  public readonly accessory: PlatformAccessory;
  protected readonly client: SyncBoxClient;
  protected state: State;

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

  public abstract update(state: State): void;
}
