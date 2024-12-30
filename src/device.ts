import { HueSyncBoxPlatform } from './platform';
import { Execution, HdmiInput, State } from './state';
import type {
  PlatformAccessory,
  Service,
  UnknownContext,
  Characteristic,
  CharacteristicValue,
} from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

export class SyncBoxDevice {
  private readonly UUIDGen;
  private readonly Accessory: typeof PlatformAccessory;
  private readonly Service: typeof Service;
  private readonly Characteristic: typeof Characteristic;
  private readonly platform: HueSyncBoxPlatform;
  private state: State;
  private externalAccessories: PlatformAccessory[] = [];
  private readonly unusedDeviceAccessories: Map<string, PlatformAccessory>;
  private newDeviceAccessories: PlatformAccessory[] = [];
  private deviceAccessories: PlatformAccessory[] = [];
  private mainAccessory: PlatformAccessory | undefined;
  private lightBulbService: Service | undefined;
  private switchService: Service | undefined;
  private tvService: Service | undefined;
  private tvAccessoryLightBulbService: Service | undefined;
  private modeTvService: Service | undefined;
  private modeTvAccessoryLightBulbService: Service | undefined;
  private intensityTvService: Service | undefined;
  private intensityTvAccessoryLightBulbService: Service | undefined;
  private entertainmentTvService: Service | undefined;
  private entertainmentTvAccessoryLightBulbService: Service | undefined;

  private readonly _powersave = 'powersave';
  private readonly _passthrough = 'passthrough';
  private readonly _video = 'video';
  private readonly _lightbulb = 'lightbulb';
  private readonly _switch = 'switch';
  private readonly tvAccessoryTypesToCategory: object;
  private accessoryUuidSuffix: object = {
    TVAccessory: '-T',
    ModeTVAccessory: '-M',
    IntensityModeTVAccessory: '-I',
    EntertainmentModeTVAccessory: '-E',
  };

  private readonly intensityToNumber: Map<string, number> = new Map([
    ['subtle', 1],
    ['moderate', 2],
    ['high', 3],
    ['intense', 4],
  ]);

  private readonly numberToIntensity: Map<number, string> = new Map([
    [1, 'subtle'],
    [2, 'moderate'],
    [3, 'high'],
    [4, 'intense'],
  ]);

  private readonly modeToNumber: Map<string, number> = new Map([
    ['video', 1],
    ['music', 2],
    ['game', 3],
    ['passthrough', 4],
  ]);

  private readonly numberToMode: Map<number, string> = new Map([
    [1, 'video'],
    [2, 'music'],
    [3, 'game'],
    [4, 'passthrough'],
  ]);

  constructor(platform: HueSyncBoxPlatform, state: State) {
    this.platform = platform;
    this.state = state;
    this.UUIDGen = this.platform.api.hap.uuid;
    this.Accessory = this.platform.api.platformAccessory;
    this.Service = this.platform.api.hap.Service;
    this.Characteristic = this.platform.api.hap.Characteristic;
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

  private getLightBulbAccessory(): PlatformAccessory | null {
    let lightBulbAccessory: PlatformAccessory;
    if (this.platform.config.baseAccessory !== this._lightbulb) {
      return null;
    }

    // find the key of the accessory with lightbulb

    lightBulbAccessory = this.unusedDeviceAccessories[this._lightBulbAccessory];
    if (lightBulbAccessory) {
      this.unusedDeviceAccessories.delete(this._lightBulbAccessory);
    } else {
      this.platform.log.info(
        'Adding new accessory with kind LightBulbAccessory.'
      );
      lightBulbAccessory = new this.Accessory(
        this.state.device.name,
        this.UUIDGen.generate(this._lightBulbAccessory)
      );
      lightBulbAccessory.context.kind = this._lightBulbAccessory;
      this.newDeviceAccessories.push(lightBulbAccessory);
    }
    this.deviceAccessories.push(lightBulbAccessory);

    this.mainAccessory = lightBulbAccessory;

    return lightBulbAccessory;
  }

  private readonly _switchAccessory = 'SwitchAccessory';

  private getSwitchAccessory(): PlatformAccessory | null {
    let switchAccessory: PlatformAccessory;
    if (this.platform.config.baseAccessory === this._switch) {
      return null;
    }
    switchAccessory = this.unusedDeviceAccessories[this._switchAccessory];
    if (switchAccessory) {
      this.unusedDeviceAccessories.delete(this._switchAccessory);
    } else {
      this.platform.log.debug(
        'Adding new accessory with kind SwitchAccessory.'
      );
      switchAccessory = new this.Accessory(
        this.state.device.name,
        this.UUIDGen.generate(this._switchAccessory)
      );
      switchAccessory.context.kind = this._switchAccessory;
      this.newDeviceAccessories.push(switchAccessory);
    }
    this.deviceAccessories.push(switchAccessory);

    this.mainAccessory = switchAccessory;
    return switchAccessory;
  }

  public init(): void {
    // Gets the main light bulb accessory
    const lightBulbAccessory = this.getLightBulbAccessory();

    // Gets the main switch accessory
    const switchAccessory = this.getSwitchAccessory();

    // Gets the tv accessory
    const tvAccessory = this.getTvAccessory();

    // Gets the tv accessory
    const modeTvAccessory = this.getModeTvAccessory();

    // Gets the tv accessory
    const intensityTvAccessory = this.getIntensityTvAccessory();

    // Gets the tv accessory
    const entertainmentTvAccessory = this.getEntertainmentTvAccssory();

    // Registers the newly created accessories
    this.platform.api.registerPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      this.newDeviceAccessories
    );

    // Removes all unused accessories
    for (const key in this.unusedDeviceAccessories) {
      const unused = this.unusedDeviceAccessories[key];
      this.platform.log.debug(
        'Removing unused accessory with kind ' + unused.context.kind + '.'
      );
      this.platform.accessories.delete(unused.UUID);
    }
    this.platform.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      Array.from(this.unusedDeviceAccessories.values())
    );

    // Updates the accessory information
    for (const deviceAccessory of this.deviceAccessories) {
      let accessoryInformationService = deviceAccessory.getService(
        this.Service.AccessoryInformation
      );
      if (!accessoryInformationService) {
        accessoryInformationService = deviceAccessory.addService(
          this.Service.AccessoryInformation
        );
      }
      accessoryInformationService
        .setCharacteristic(this.Characteristic.Manufacturer, 'Philips')
        .setCharacteristic(this.Characteristic.Model, 'Sync Box')
        .setCharacteristic(
          this.Characteristic.FirmwareRevision,
          this.state.device.firmwareVersion
        );

      const kind = deviceAccessory.context.kind;
      let suffix = '';
      if (kind in this.accessoryUuidSuffix) {
        suffix = this.accessoryUuidSuffix[kind];
      }

      accessoryInformationService.setCharacteristic(
        this.Characteristic.SerialNumber,
        this.state.device.uniqueId + suffix
      );
    }

    // Handles the lightbulb accessory if it is enabled
    this.handleLightBulb(lightBulbAccessory);
    this.handleSwitch(switchAccessory);

    // Handles the TV accessory if it is enabled
    this.handleTv(tvAccessory);

    // Handles the mode TV accessory if it is enabled
    this.handleModeTv(modeTvAccessory);
    this.handleIntensityTv(intensityTvAccessory);

    // Handles the entertainment area TV accessory if it is enabled
    this.handleEntertainmentTv(entertainmentTvAccessory);

    // Publishes the external accessories (i.e. the TV accessories)
    if (this.externalAccessories.length > 0) {
      this.platform.api.publishExternalAccessories(
        PLUGIN_NAME,
        this.externalAccessories
      );
    }

    // Updates the state initially
    this.update(this.state);
  }

  private handleTv(tvAccessory: PlatformAccessory | null) {
    if (!tvAccessory) {
      return;
    }
    const tvService = this.getTvService(tvAccessory);
    const hdmiInputServices: Service[] = [];
    for (let i = 1; i <= 4; i++) {
      // Sets the TV name
      const hdmiState: HdmiInput = this.state.hdmi[`input${i}`];
      const hdmiName = hdmiState.name || 'HDMI ' + i;
      const hdmiInputService = this.getInputService(
        tvAccessory,
        hdmiName,
        hdmiName
      );

      // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
      tvService.addLinkedService(hdmiInputService);
      hdmiInputServices.push(hdmiInputService);
    }
    tvService.setCharacteristic(
      this.Characteristic.SleepDiscoveryMode,
      this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
    );
    tvService
      .getCharacteristic(this.Characteristic.Active)
      .onSet(this.setServiceActive(tvService).bind(this));
    tvService
      .getCharacteristic(this.Characteristic.ActiveIdentifier)
      .onSet(async value => {
        return await this.updateExecution({
          hdmiSource: 'input' + value,
        });
      });

    for (let i = 0; i < hdmiInputServices.length; i++) {
      hdmiInputServices[i]
        .getCharacteristic(this.Characteristic.TargetVisibilityState)
        .onSet(this.setVisibility(hdmiInputServices[i]));
    }
    tvService
      .getCharacteristic(this.Characteristic.RemoteKey)
      .onSet(this.handleRemoteButton.bind(this));
    this.tvService = tvService;
    if (this.platform.config.tvAccessoryLightbulb) {
      // Updates the light bulb service

      // @ts-expect-error // already checked
      let tvAccessoryLightBulbService = tvAccessory.getServiceById(
        this.Service.Lightbulb
      );
      if (!tvAccessoryLightBulbService) {
        tvAccessoryLightBulbService = tvAccessory.addService(
          this.Service.Lightbulb
        );
      }

      // Stores the light bulb service
      this.tvAccessoryLightBulbService = tvAccessoryLightBulbService;

      // Subscribes for changes of the on characteristic
      tvAccessoryLightBulbService
        .getCharacteristic(this.Characteristic.On)
        .onSet(this.setServiceActive(tvAccessoryLightBulbService).bind(this));

      // Subscribes for changes of the brightness characteristic
      tvAccessoryLightBulbService
        .getCharacteristic(this.Characteristic.Brightness)
        .onSet(this.setBrightness.bind(this));
    }
  }

  private setVisibility(service: Service) {
    return (value: CharacteristicValue) => {
      service.setCharacteristic(
        this.Characteristic.CurrentVisibilityState,
        value
      );
    };
  }

  private async setBrightness(value: CharacteristicValue) {
    this.platform.log.debug('Switch brightness to ' + value);
    await this.updateExecution({
      brightness: Math.round(((value as number) / 100.0) * 200),
    });
  }

  private setServiceActive(service: Service) {
    return async (value: CharacteristicValue) => {
      const currentVal =
        service.getCharacteristic(this.Characteristic.Active).value ||
        service.getCharacteristic(this.Characteristic.On).value;
      // Ignores changes if the new value equals the old value
      if (currentVal === value) {
        return;
      }
      let mode: string;
      // Saves the changes
      if (value) {
        this.platform.log.debug('Switch state to ON');
        mode = this.platform.config.defaultOnMode;
        if (mode === 'lastSyncMode') {
          mode = this?.state?.execution?.lastSyncMode || this._video;
        }
      } else {
        this.platform.log.debug('Switch state to OFF');
        mode = this.platform.config.defaultOffMode;
      }
      await this.updateExecution({
        mode,
      });
    };
  }

  private getTvService(tvAccessory: PlatformAccessory<UnknownContext>) {
    let tvService = tvAccessory.getServiceById(this.Service.Television, 'TV');
    if (!tvService) {
      tvService = tvAccessory.addService(this.Service.Television, 'TV', 'TV');

      // Sets the TV name
      if (this.mainAccessory) {
        tvService.setCharacteristic(
          this.Characteristic.ConfiguredName,
          this.mainAccessory.context.tvAccessoryConfiguredName ||
            this.state.device.name
        );
        tvService
          .getCharacteristic(this.Characteristic.ConfiguredName)
          .onSet(value => {
            // @ts-expect-error already checked
            this.mainAccessory.context.tvAccessoryConfiguredName = value;
          });
      } else {
        tvService.setCharacteristic(
          this.Characteristic.ConfiguredName,
          this.state.device.name
        );
      }
    }
    return tvService;
  }

  private handleModeTv(modeTvAccessory: PlatformAccessory | null) {
    if (!modeTvAccessory) {
      return;
    }
    let modeTvService = modeTvAccessory.getServiceById(
      this.Service.Television,
      'ModeTVAccessory'
    );
    if (!modeTvService) {
      modeTvService = modeTvAccessory.addService(
        this.Service.Television,
        'Mode',
        'ModeTVAccessory'
      );

      // Sets the TV name
      if (this.mainAccessory) {
        modeTvService.setCharacteristic(
          this.Characteristic.ConfiguredName,
          this.mainAccessory.context.modeTvAccessoryConfiguredName ||
            this.state.device.name
        );
        modeTvService
          .getCharacteristic(this.Characteristic.ConfiguredName)
          .onSet(value => {
            // @ts-expect-error already checked
            this.mainAccessory.context.modeTvAccessoryConfiguredName = value;
          });
      } else {
        modeTvService.setCharacteristic(
          this.Characteristic.ConfiguredName,
          this.state.device.name
        );
      }
    }
    const modeInputServices: Service[] = [];
    for (let i = 1; i <= 4; i++) {
      const position = 'MODE ' + i;
      const name = this.numberToMode[i];
      const modeInputService = this.getInputService(
        modeTvAccessory,
        name,
        position
      );
      // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
      modeTvService.addLinkedService(modeInputService);
      modeInputServices.push(modeInputService);
    }
    modeTvService.setCharacteristic(
      this.Characteristic.SleepDiscoveryMode,
      this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
    );
    modeTvService
      .getCharacteristic(this.Characteristic.Active)
      .onSet(this.setServiceActive(modeTvService).bind(this));
    modeTvService
      .getCharacteristic(this.Characteristic.ActiveIdentifier)
      .onSet(async (value: CharacteristicValue) => {
        const mode = this.numberToMode[value as number];
        this.platform.log.debug('Switch mode to ' + mode);
        return await this.updateExecution({
          mode,
        });
      });
    this.updateSources(modeInputServices);
    modeTvService
      .getCharacteristic(this.Characteristic.RemoteKey)
      .onSet(this.handleRemoteButton);
    this.modeTvService = modeTvService;
    if (this.platform.config.modeTvAccessoryLightbulb) {
      // Updates the light bulb service
      // @ts-expect-error // already checked
      let modeTvAccessoryLightBulbService = modeTvAccessory.getServiceById(
        this.Service.Lightbulb
      );
      if (!modeTvAccessoryLightBulbService) {
        modeTvAccessoryLightBulbService = modeTvAccessory.addService(
          this.Service.Lightbulb
        );
      }

      // Stores the light bulb service
      this.modeTvAccessoryLightBulbService = modeTvAccessoryLightBulbService;

      // Subscribes for changes of the on characteristic
      modeTvAccessoryLightBulbService
        .getCharacteristic(this.Characteristic.On)
        .onSet(
          this.setServiceActive(modeTvAccessoryLightBulbService).bind(this)
        );

      // Subscribes for changes of the brightness characteristic
      modeTvAccessoryLightBulbService
        .getCharacteristic(this.Characteristic.Brightness)
        .onSet(this.setBrightness.bind(this));
    }
  }

  private async updateExecution(execution: Partial<Execution>) {
    try {
      return await this.platform.client.updateExecution(execution);
    } catch (e) {
      this.platform.log.debug('Failed to update execution', e);
    }
  }

  private updateSources(modeInputServices: Service[]) {
    // Handles showing/hiding of sources
    for (let i = 0; i < modeInputServices.length; i++) {
      modeInputServices[i]
        .getCharacteristic(this.Characteristic.TargetVisibilityState)
        .onSet(this.setVisibility(modeInputServices[i]));
    }
  }

  private async handleRemoteButton(value: CharacteristicValue) {
    this.platform.log.debug('Remote key pressed: ' + value);

    let mode: string;
    switch (value) {
      case this.Characteristic.RemoteKey.ARROW_UP:
        this.platform.log.debug('Increase brightness by 25%');
        await this.updateExecution({
          brightness: Math.min(200, this.state.execution.brightness + 50),
        });
        break;

      case this.Characteristic.RemoteKey.ARROW_DOWN:
        this.platform.log.debug('Decrease brightness by 25%');
        await this.updateExecution({
          brightness: Math.max(0, this.state.execution.brightness - 50),
        });
        break;

      case this.Characteristic.RemoteKey.ARROW_LEFT: {
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

      case this.Characteristic.RemoteKey.ARROW_RIGHT: {
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

      case this.Characteristic.RemoteKey.SELECT: {
        this.platform.log.debug('Toggle mode');
        const currentMode = this.state.execution.mode;
        const nextMode = (this.modeToNumber[currentMode] % 4) + 1;
        await this.updateExecution({
          mode: this.numberToMode[nextMode],
        });
        break;
      }

      case this.Characteristic.RemoteKey.PLAY_PAUSE:
        this.platform.log.debug('Toggle switch state');
        if (
          this.state.execution.mode !== this._powersave &&
          this.state.execution.mode !== this._passthrough
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
              onMode = this._video;
            }
          }

          await this.updateExecution({
            mode: onMode,
          });
        }
        break;

      case this.Characteristic.RemoteKey.INFORMATION: {
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

  private getMode() {
    let mode = this._video;
    if (
      this.state.execution.mode !== this._powersave &&
      this.state.execution.mode !== this._passthrough
    ) {
      mode = this.state.execution.mode;
    } else if (this.state.execution.lastSyncMode) {
      mode = this.state.execution.lastSyncMode;
    }
    return mode;
  }

  private handleIntensityTv(intensityTvAccessory: PlatformAccessory | null) {
    // Handles the intensity TV accessory if it is enabled
    if (intensityTvAccessory) {
      // Updates tv service
      let intensityTvService = intensityTvAccessory.getServiceById(
        this.Service.Television,
        'IntensityTVAccessory'
      );
      if (!intensityTvService) {
        intensityTvService = intensityTvAccessory.addService(
          this.Service.Television,
          'Intensity',
          'IntensityTVAccessory'
        );

        // Sets the TV name
        if (this.mainAccessory) {
          intensityTvService.setCharacteristic(
            this.Characteristic.ConfiguredName,
            this.mainAccessory.context.intensityTvAccessoryConfiguredName ||
              this.state.device.name
          );
          intensityTvService
            .getCharacteristic(this.Characteristic.ConfiguredName)
            .onSet((value: CharacteristicValue) => {
              // @ts-expect-error already checked
              this.mainAccessory.context.intensityTvAccessoryConfiguredName =
                value;
            });
        } else {
          intensityTvService.setCharacteristic(
            this.Characteristic.ConfiguredName,
            this.state.device.name
          );
        }
      }

      // Register intensity input sources
      const intensityInputServices: Service[] = [];
      for (let i = 1; i < this.numberToIntensity.size; i++) {
        const position = 'INTENSITY ' + i;
        const intensityInputService = this.getInputService(
          intensityTvAccessory,
          this.numberToIntensity[i],
          position
        );

        // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
        intensityTvService.addLinkedService(intensityInputService);
        intensityInputServices.push(intensityInputService);
      }

      // Sets sleep discovery characteristic (which is always discoverable as Homebridge is always running)
      intensityTvService.setCharacteristic(
        this.Characteristic.SleepDiscoveryMode,
        this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

      // Handles on/off events
      intensityTvService
        .getCharacteristic(this.Characteristic.Active)
        .onSet(this.setServiceActive(intensityTvService).bind(this));

      // Handles input source changes
      intensityTvService
        .getCharacteristic(this.Characteristic.ActiveIdentifier)
        .onSet(async (value: CharacteristicValue) => {
          const mode = this.getMode();
          const intensity = this.numberToIntensity[value as number] || '';
          this.platform.log.debug('Switch intensity to ' + intensity);
          const body = {};
          body[mode] = {
            intensity,
          };
          return await this.updateExecution(body);
        });

      this.updateSources(intensityInputServices);

      // Handles remote key input
      intensityTvService
        .getCharacteristic(this.Characteristic.RemoteKey)
        .onSet(this.handleRemoteButton.bind(this));

      // Stores the tv service
      this.intensityTvService = intensityTvService;

      // Handles the lightbulb accessory if it is enabled
      if (this.platform.config.intensityTvAccessoryLightbulb) {
        // Updates the light bulb service
        let intensityTvAccessoryLightBulbService =
          // @ts-expect-error // already checked
          intensityTvAccessory.getServiceById(this.Service.Lightbulb);
        if (!intensityTvAccessoryLightBulbService) {
          intensityTvAccessoryLightBulbService =
            intensityTvAccessory.addService(this.Service.Lightbulb);
        }

        // Stores the light bulb service
        this.intensityTvAccessoryLightBulbService =
          intensityTvAccessoryLightBulbService;

        // Subscribes for changes of the on characteristic
        intensityTvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.On)
          .onSet(
            this.setServiceActive(intensityTvAccessoryLightBulbService).bind(
              this
            )
          );

        // Subscribes for changes of the brightness characteristic
        intensityTvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.Brightness)
          .onSet(this.setBrightness.bind(this));
      }
    }
  }

  private getInputService(
    tvAccessory: PlatformAccessory,
    name: string,
    position: string
  ): Service {
    let inputService = tvAccessory.getServiceById(
      this.Service.InputSource,
      position
    );
    if (!inputService) {
      inputService = tvAccessory.addService(
        this.Service.InputSource,
        position.toLowerCase().replace(' ', ''),
        position
      );

      // Sets the TV name
      inputService
        .setCharacteristic(this.Characteristic.ConfiguredName, name)
        .setCharacteristic(
          this.Characteristic.IsConfigured,
          this.Characteristic.IsConfigured.CONFIGURED
        )
        .setCharacteristic(
          this.Characteristic.CurrentVisibilityState,
          this.Characteristic.CurrentVisibilityState.SHOWN
        )
        .setCharacteristic(
          this.Characteristic.TargetVisibilityState,
          this.Characteristic.TargetVisibilityState.SHOWN
        );
    }
    inputService
      .setCharacteristic(
        this.Characteristic.Identifier,
        position[position.length - 1]
      )
      .setCharacteristic(
        this.Characteristic.InputSourceType,
        this.Characteristic.InputSourceType.HDMI
      );

    return inputService;
  }

  private handleEntertainmentTv(
    entertainmentTvAccessory: PlatformAccessory | null
  ) {
    if (entertainmentTvAccessory) {
      // Updates tv service
      let entertainmentTvService = entertainmentTvAccessory.getServiceById(
        this.Service.Television,
        'EntertainmentTVAccessory'
      );
      if (!entertainmentTvService) {
        entertainmentTvService = entertainmentTvAccessory.addService(
          this.Service.Television,
          'Entertainment Area',
          'EntertainmentTVAccessory'
        );

        // Sets the TV name
        if (this.mainAccessory) {
          entertainmentTvService.setCharacteristic(
            this.Characteristic.ConfiguredName,
            this.mainAccessory.context.entertainmentTvAccessoryConfiguredName ||
              this.state.device.name
          );
          entertainmentTvService
            .getCharacteristic(this.Characteristic.ConfiguredName)
            .onSet((value: CharacteristicValue) => {
              // @ts-expect-error already checked
              this.mainAccessory.context.entertainmentTvAccessoryConfiguredName =
                value;
            });
        } else {
          entertainmentTvService.setCharacteristic(
            this.Characteristic.ConfiguredName,
            this.state.device.name
          );
        }
      }

      // Register input sources
      const entertainmentInputServices: Service[] = [];
      let i = 1;

      for (const groupId in this.state.hue.groups) {
        const group = this.state.hue.groups[groupId];
        const name = group.name;
        const position = 'AREA ' + i;

        const entertainmentInputService = this.getInputService(
          entertainmentTvAccessory,
          name,
          position
        );

        // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
        entertainmentTvService.addLinkedService(entertainmentInputService);
        entertainmentInputServices.push(entertainmentInputService);

        i++;
      }

      // Sets sleep discovery characteristic (which is always discoverable as Homebridge is always running)
      entertainmentTvService.setCharacteristic(
        this.Characteristic.SleepDiscoveryMode,
        this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

      // Handles on/off events
      entertainmentTvService
        .getCharacteristic(this.Characteristic.Active)
        .onSet(this.setServiceActive(entertainmentTvService).bind(this));

      // Handles input source changes
      entertainmentTvService
        .getCharacteristic(this.Characteristic.ActiveIdentifier)
        .onSet(async value => {
          // Gets the ID of the group based on the index
          let groupId: string | null = null;
          let i = 1;
          for (const currentGroupId in this.state.hue.groups) {
            if (i === value) {
              groupId = currentGroupId;
              break;
            }
            i++;
          }

          // @ts-expect-error need to use self as a key
          const group = this.state.hue.groups[groupId];
          if (!group || !groupId) {
            return;
          }
          // Saves the changes
          this.platform.log.debug('Switch entertainment area to ' + group.name);
          try {
            await this.platform.client.updateHue({
              groupId: groupId,
            });
          } catch (e) {
            this.platform.log.debug(
              'Failed to switch entertainment area to ' + group.name,
              e
            );
          }
        });

      this.updateSources(entertainmentInputServices);

      // Handles remote key input
      entertainmentTvService
        .getCharacteristic(this.Characteristic.RemoteKey)
        .onSet(this.handleRemoteButton.bind(this));

      // Stores the tv service
      this.entertainmentTvService = entertainmentTvService;

      // Handles the lightbulb accessory if it is enabled
      if (this.platform.config.entertainmentTvAccessoryLightbulb) {
        // Updates the light bulb service
        let entertainmentTvAccessoryLightBulbService =
          // @ts-expect-error // already checked
          entertainmentTvAccessory.getServiceById(this.Service.Lightbulb);
        if (!entertainmentTvAccessoryLightBulbService) {
          entertainmentTvAccessoryLightBulbService =
            entertainmentTvAccessory.addService(this.Service.Lightbulb);
        }

        // Stores the light bulb service
        this.entertainmentTvAccessoryLightBulbService =
          entertainmentTvAccessoryLightBulbService;

        // Subscribes for changes of the on characteristic
        entertainmentTvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.On)
          .onSet(
            this.setServiceActive(
              entertainmentTvAccessoryLightBulbService
            ).bind(this)
          );

        // Subscribes for changes of the brightness characteristic
        entertainmentTvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.Brightness)
          .onSet(this.setBrightness.bind(this));
      }
    }
  }

  private handleSwitch(
    switchAccessory: PlatformAccessory<UnknownContext> | null
  ) {
    // Handles the switch accessory if it is enabled
    if (!switchAccessory) {
      return;
    }
    // @ts-expect-error  already checked
    let switchService = switchAccessory.getServiceById(this.Service.Switch);
    if (!switchService) {
      switchService = switchAccessory.addService(this.Service.Switch);
    }
    this.switchService = switchService;
    switchService
      .getCharacteristic(this.Characteristic.On)
      .onSet(this.setServiceActive(switchService).bind(this));
  }

  private handleLightBulb(
    lightBulbAccessory: PlatformAccessory<UnknownContext> | null
  ) {
    if (!lightBulbAccessory) {
      return;
    }
    // @ts-expect-error  already checked
    let lightBulbService = lightBulbAccessory.getServiceById(
      this.Service.Lightbulb
    );
    if (!lightBulbService) {
      lightBulbService = lightBulbAccessory.addService(this.Service.Lightbulb);
    }
    this.lightBulbService = lightBulbService;
    lightBulbService
      .getCharacteristic(this.Characteristic.On)
      .onSet(this.setServiceActive(lightBulbService).bind(this));
    lightBulbService
      .getCharacteristic(this.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));
  }

  private getEntertainmentTvAccssory() {
    if (!this.platform.config.entertainmentTvAccessory) {
      return null;
    }
    return this.getBaseTvAccessory(
      'EntertainmentTVAccessory',
      this.platform.config.entertainmentTvAccessoryType
    );
  }

  private getIntensityTvAccessory() {
    if (!this.platform.config.intensityTvAccessory) {
      return null;
    }
    return this.getBaseTvAccessory(
      'IntensityTVAccessory',
      this.platform.config.intensityTvAccessoryType
    );
  }

  private getModeTvAccessory() {
    if (!this.platform.config.modeTvAccessory) {
      return null;
    }
    return this.getBaseTvAccessory(
      'ModeTVAccessory',
      this.platform.config.modeTvAccessoryType
    );
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
    this.deviceAccessories.push(accessory);
    return accessory;
  }

  private getTvAccessory() {
    if (!this.platform.config.tvAccessory) {
      return null;
    }
    return this.getBaseTvAccessory(
      'TVAccessory',
      this.platform.config.tvAccessoryType
    );
  }

  public update(state: State): void {
    // Stores the latest state
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    this.state = state;

    // Updates the corresponding service
    if (this.lightBulbService) {
      // Updates the on characteristic
      this.platform.log.debug('Updated state to ' + this.state.execution.mode);
      this.lightBulbService.updateCharacteristic(
        this.Characteristic.On,
        this.state.execution.mode !== this._powersave &&
          this.state.execution.mode !== this._passthrough
      );

      // Updates the brightness characteristic
      this.platform.log.debug(
        'Updated brightness to ' + this.state.execution.brightness
      );
      this.lightBulbService.updateCharacteristic(
        this.Characteristic.Brightness,
        Math.round((state.execution.brightness / 200.0) * 100)
      );
    }

    // Updates the corresponding service
    if (this.switchService) {
      // Updates the on characteristic
      this.platform.log.debug('Updated state to ' + this.state.execution.mode);
      this.switchService.updateCharacteristic(
        this.Characteristic.On,
        this.state.execution.mode !== this._powersave &&
          this.state.execution.mode !== this._passthrough
      );
    }

    // Updates the corresponding service of the TV accessory
    if (this.tvService) {
      // Updates the on characteristic
      this.platform.log.debug('Updated state to ' + this.state.execution.mode);
      this.tvService.updateCharacteristic(
        this.Characteristic.Active,
        this.state.execution.mode !== this._powersave
      );

      // Updates the HDMI input characteristic
      this.platform.log.debug(
        'Updated HDMI input to ' + this.state.execution.hdmiSource
      );
      this.tvService.updateCharacteristic(
        this.Characteristic.ActiveIdentifier,
        parseInt(state.execution.hdmiSource.replace('input', ''))
      );

      // Updates the corresponding service
      if (this.tvAccessoryLightBulbService) {
        // Updates the on characteristic
        this.platform.log.debug(
          'Updated state to ' + this.state.execution.mode
        );
        this.tvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.On,
          this.state.execution.mode !== this._powersave &&
            this.state.execution.mode !== this._passthrough
        );

        // Updates the brightness characteristic
        this.platform.log.debug(
          'Updated brightness to ' + this.state.execution.brightness
        );
        this.tvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.Brightness,
          Math.round((state.execution.brightness / 200.0) * 100)
        );
      }
    }

    // Updates the corresponding service of the mode TV accessory
    if (this.modeTvService) {
      // Updates the on characteristic
      this.platform.log.debug('Updated state to ' + this.state.execution.mode);
      this.modeTvService.updateCharacteristic(
        this.Characteristic.Active,
        this.state.execution.mode !== this._powersave
      );

      // Updates the mode input characteristic
      this.platform.log.debug('Updated mode to ' + this.state.execution.mode);
      this.modeTvService.updateCharacteristic(
        this.Characteristic.ActiveIdentifier,
        this.modeToNumber[state.execution.mode]
      );

      // Updates the corresponding service
      if (this.modeTvAccessoryLightBulbService) {
        // Updates the on characteristic
        this.platform.log.debug(
          'Updated state to ' + this.state.execution.mode
        );
        this.modeTvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.On,
          this.state.execution.mode !== this._powersave &&
            this.state.execution.mode !== this._passthrough
        );

        // Updates the brightness characteristic
        this.platform.log.debug(
          'Updated brightness to ' + this.state.execution.brightness
        );
        this.modeTvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.Brightness,
          Math.round((state.execution.brightness / 200.0) * 100)
        );
      }
    }

    // Updates the corresponding service of the intensity TV accessory
    if (this.intensityTvService) {
      // Updates the on characteristic
      this.platform.log.debug('Updated state to ' + this.state.execution.mode);
      this.intensityTvService.updateCharacteristic(
        this.Characteristic.Active,
        this.state.execution.mode !== this._powersave
      );

      // Gets the current mode or the last sync mode to set the intensity
      const mode = this.getMode();

      // Updates the intensity input characteristic
      this.platform.log.debug(
        'Updated intensity to ' + this.state.execution[mode].intensity
      );
      const brightness =
        this.intensityToNumber[state.execution[mode].intensity];
      if (brightness) {
        this.intensityTvService.updateCharacteristic(
          this.Characteristic.ActiveIdentifier,
          brightness
        );
      }

      // Updates the corresponding service
      if (this.intensityTvAccessoryLightBulbService) {
        // Updates the on characteristic
        this.platform.log.debug(
          'Updated state to ' + this.state.execution.mode
        );
        this.intensityTvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.On,
          this.state.execution.mode !== this._powersave &&
            this.state.execution.mode !== this._passthrough
        );

        // Updates the brightness characteristic
        this.platform.log.debug(
          'Updated brightness to ' + this.state.execution.brightness
        );
        this.intensityTvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.Brightness,
          Math.round((state.execution.brightness / 200.0) * 100)
        );
      }
    }

    // Updates the corresponding service of the entertainment area TV accessory
    if (this.entertainmentTvService) {
      // Updates the on characteristic
      this.platform.log.debug('Updated state to ' + this.state.execution.mode);
      this.entertainmentTvService.updateCharacteristic(
        this.Characteristic.Active,
        this.state.execution.mode !== this._powersave
      );

      // Gets the ID of the group based on the index
      let index = 1;
      for (const currentGroupId in this.state.hue.groups) {
        if (currentGroupId === this.state.hue.groupId) {
          break;
        }
        index++;
      }

      // Updates the input characteristic
      this.entertainmentTvService.updateCharacteristic(
        this.Characteristic.ActiveIdentifier,
        index
      );

      // Updates the corresponding service
      if (this.entertainmentTvAccessoryLightBulbService) {
        // Updates the on characteristic
        this.platform.log.debug(
          'Updated state to ' + this.state.execution.mode
        );
        this.entertainmentTvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.On,
          this.state.execution.mode !== this._powersave &&
            this.state.execution.mode !== this._passthrough
        );

        // Updates the brightness characteristic
        this.platform.log.debug(
          'Updated brightness to ' + this.state.execution.brightness
        );
        this.entertainmentTvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.Brightness,
          Math.round((state.execution.brightness / 200.0) * 100)
        );
      }
    }
  }
}
