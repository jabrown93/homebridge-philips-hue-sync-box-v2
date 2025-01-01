import { BaseHueSyncBoxDevice } from './base';
import {
  type CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';
import { HueSyncBoxPlatform } from '../platform';
import { SyncBoxClient } from '../lib/client';
import { State } from '../state';
import { PASSTHROUGH, POWER_SAVE } from '../lib/constants';

export abstract class BaseTvDevice extends BaseHueSyncBoxDevice {
  protected lightBulbService?: Service;
  protected inputServices: Service[] = [];

  protected readonly intensityToNumber: Map<string, number> = new Map([
    ['subtle', 1],
    ['moderate', 2],
    ['high', 3],
    ['intense', 4],
  ]);

  protected readonly numberToIntensity: Map<number, string> = new Map([
    [1, 'subtle'],
    [2, 'moderate'],
    [3, 'high'],
    [4, 'intense'],
  ]);

  protected readonly modeToNumber: Map<string, number> = new Map([
    ['video', 1],
    ['music', 2],
    ['game', 3],
    ['passthrough', 4],
  ]);

  protected readonly numberToMode: Map<number, string> = new Map([
    [1, 'video'],
    [2, 'music'],
    [3, 'game'],
    [4, 'passthrough'],
  ]);

  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected client: SyncBoxClient,
    protected state: State
  ) {
    super(platform, accessory, client, state);
    this.createInputServices();
    this.createLightBulbService();
    this.service.setCharacteristic(
      this.platform.Characteristic.SleepDiscoveryMode,
      this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
    );
    this.service
      .getCharacteristic(this.platform.Characteristic.RemoteKey)
      .onSet(this.handleRemoteButton.bind(this));
  }

  protected abstract createInputServices(): void;

  protected abstract isLightBulbEnabled(): boolean;

  protected createLightBulbService(): void {
    if (!this.isLightBulbEnabled()) {
      return;
    }
    this.lightBulbService =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    // Stores the light bulb service

    // Subscribes for changes of the on characteristic
    this.lightBulbService
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOnLightBulb.bind(this));

    // Subscribes for changes of the brightness characteristic
    this.lightBulbService
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));
  }

  setOnLightBulb(value: CharacteristicValue) {
    if (!this.lightBulbService) {
      return;
    }
    this.platform.log.debug('Set On ->', value);
    const currentVal = this.lightBulbService.getCharacteristic(
      this.platform.Characteristic.On
    ).value;
    return this.updateMode(currentVal, value);
  }

  protected getServiceType() {
    return this.platform.Service.Television;
  }

  protected async handleRemoteButton(value: CharacteristicValue) {
    this.platform.log.debug('Remote key pressed: ' + value);

    let mode: string;
    switch (value) {
      case this.platform.Characteristic.RemoteKey.ARROW_UP:
        this.platform.log.debug('Increase brightness by 25%');
        await this.updateExecution({
          brightness: Math.min(200, this.state.execution.brightness + 50),
        });
        break;

      case this.platform.Characteristic.RemoteKey.ARROW_DOWN:
        this.platform.log.debug('Decrease brightness by 25%');
        await this.updateExecution({
          brightness: Math.max(0, this.state.execution.brightness - 50),
        });
        break;

      case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {
        // Gets the current mode or the last sync mode to set the intensity
        mode = this.getMode();

        this.platform.log.debug('Toggle intensity');
        const currentIntensity = this.state.execution[mode].intensity;
        const nextLowestIntensity =
          this.intensityToNumber[currentIntensity] - 1;
        if (nextLowestIntensity < 1) {
          break;
        }
        const nextIntensity = this.numberToIntensity[nextLowestIntensity];
        const body = {};
        body[mode] = {
          intensity: nextIntensity,
        };
        await this.updateExecution(body);
        break;
      }

      case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {
        // Gets the current mode or the last sync mode to set the intensity
        mode = this.getMode();

        this.platform.log.debug('Toggle intensity');
        const currentIntensity = this.state.execution[mode].intensity;
        const nextHighestIntensity =
          this.intensityToNumber[currentIntensity] + 1;
        if (nextHighestIntensity > 4) {
          break;
        }
        const nextIntensity = this.numberToIntensity[nextHighestIntensity];
        const body = {};
        body[mode] = {
          intensity: nextIntensity,
        };
        await this.updateExecution(body);
        break;
      }

      case this.platform.Characteristic.RemoteKey.SELECT: {
        this.platform.log.debug('Toggle mode');
        const currentMode = this.state.execution.mode;
        const nextMode = (this.modeToNumber[currentMode] % 4) + 1;
        await this.updateExecution({
          mode: this.numberToMode[nextMode],
        });
        break;
      }

      case this.platform.Characteristic.RemoteKey.PLAY_PAUSE:
        this.platform.log.debug('Toggle switch state');
        if (
          this.state.execution.mode !== POWER_SAVE &&
          this.state.execution.mode !== PASSTHROUGH
        ) {
          await this.updateExecution({
            mode: this.platform.config.defaultOffMode,
          });
        } else {
          let onMode = this.platform.config.defaultOnMode;
          if (onMode === 'lastSyncMode') {
            if (
              this.state &&
              this.state.execution &&
              this.state.execution.lastSyncMode
            ) {
              onMode = this.state.execution.lastSyncMode;
            } else {
              onMode = 'video';
            }
          }

          await this.updateExecution({
            mode: onMode,
          });
        }
        break;

      case this.platform.Characteristic.RemoteKey.INFORMATION: {
        this.platform.log.debug('Toggle hdmi source');
        const hdmiSource = this.state.execution.hdmiSource;
        const currentSourcePosition = parseInt(hdmiSource.replace('input', ''));
        const nextSourcePosition = (currentSourcePosition % 4) + 1;
        await this.updateExecution({
          hdmiSource: 'input' + nextSourcePosition,
        });
        break;
      }
    }
  }

  protected updateSources(modeInputServices: Service[]) {
    // Handles showing/hiding of sources
    for (let i = 0; i < modeInputServices.length; i++) {
      modeInputServices[i]
        .getCharacteristic(this.platform.Characteristic.TargetVisibilityState)
        .onSet(this.setVisibility(modeInputServices[i]));
    }
  }

  public update(state: State): void {
    super.update(state);
    this.updateTv();
    this.updateLightBulb();
  }

  protected abstract updateTv(): void;

  private updateLightBulb(): void {
    if (!this.lightBulbService) {
      return;
    }
    this.platform.log.debug('Updated state to ' + this.state.execution.mode);
    this.lightBulbService.updateCharacteristic(
      this.platform.Characteristic.On,
      this.state.execution.mode !== POWER_SAVE &&
        this.state.execution.mode !== PASSTHROUGH
    );
    this.platform.log.debug(
      'Updated brightness to ' + this.state.execution.brightness
    );
    this.lightBulbService.updateCharacteristic(
      this.platform.Characteristic.Brightness,
      Math.round((this.state.execution.brightness / 200.0) * 100)
    );
  }
}