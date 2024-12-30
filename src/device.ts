import { HueSyncBoxPlatform } from './platform';
import { HdmiInput, State } from './lib/state';
import type { PlatformAccessory, Service } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

export class SyncBoxDevice {
  private readonly UUIDGen;
  private readonly Accessory;
  private readonly Service;
  private readonly Characteristic;
  private readonly platform: HueSyncBoxPlatform;
  private state: State;
  private externalAccessories: PlatformAccessory[] = [];
  private unusedDeviceAccessories: PlatformAccessory[] = [];
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

  constructor(platform: HueSyncBoxPlatform, state: State) {
    this.platform = platform;
    this.state = state;
    this.UUIDGen = platform.api.hap.uuid;
    this.Accessory = platform.api.platformAccessory;
    this.Service = platform.api.hap.Service;
    this.Characteristic = platform.api.hap.Characteristic;
    this.unusedDeviceAccessories = [...this.platform.accessories.values()];
    if (!state.device) {
      throw new Error('Device is not defined');
    }

    // Gets the main light bulb accessory
    let lightBulbAccessory;
    if (this.platform.config.baseAccessory === 'lightbulb') {
      lightBulbAccessory = this.unusedDeviceAccessories.find(a => {
        return a.context.kind === 'LightBulbAccessory';
      });
      if (lightBulbAccessory) {
        this.unusedDeviceAccessories.splice(
          this.unusedDeviceAccessories.indexOf(lightBulbAccessory),
          1
        );
      } else {
        platform.log.info('Adding new accessory with kind LightBulbAccessory.');
        lightBulbAccessory = new this.Accessory(
          state.device.name,
          this.UUIDGen.generate('LightBulbAccessory')
        );
        lightBulbAccessory.context.kind = 'LightBulbAccessory';
        this.newDeviceAccessories.push(lightBulbAccessory);
      }
      this.deviceAccessories.push(lightBulbAccessory);

      this.mainAccessory = lightBulbAccessory;
    }

    // Gets the main switch accessory
    let switchAccessory;
    if (platform.config.baseAccessory === 'switch') {
      switchAccessory = this.unusedDeviceAccessories.find(a => {
        return a.context.kind === 'SwitchAccessory';
      });
      if (switchAccessory) {
        this.unusedDeviceAccessories.splice(
          this.unusedDeviceAccessories.indexOf(switchAccessory),
          1
        );
      } else {
        platform.log.debug('Adding new accessory with kind SwitchAccessory.');
        switchAccessory = new this.Accessory(
          state.device.name,
          this.UUIDGen.generate('SwitchAccessory')
        );
        switchAccessory.context.kind = 'SwitchAccessory';
        this.newDeviceAccessories.push(switchAccessory);
      }
      this.deviceAccessories.push(switchAccessory);

      this.mainAccessory = switchAccessory;
    }

    // Gets the tv accessory
    let tvAccessory;
    if (platform.config.tvAccessory) {
      platform.log.debug('Setting up accessory with kind TVAccessory.');
      tvAccessory = new this.Accessory(
        state.device.name,
        this.UUIDGen.generate('TVAccessory')
      );
      switch (platform.config.tvAccessoryType) {
        case 'settopbox':
          tvAccessory.category =
            this.platform.api.hap.Categories.TV_SET_TOP_BOX;
          break;
        case 'tvstick':
          tvAccessory.category =
            this.platform.api.hap.Categories.TV_STREAMING_STICK;
          break;
        case 'audioreceiver':
          tvAccessory.category =
            this.platform.api.hap.Categories.AUDIO_RECEIVER;
          break;
        default:
          tvAccessory.category = this.platform.api.hap.Categories.TELEVISION;
          break;
      }
      tvAccessory.context.kind = 'TVAccessory';
      this.externalAccessories.push(tvAccessory);
      this.deviceAccessories.push(tvAccessory);
    }

    // Gets the tv accessory
    let modeTvAccessory;
    if (platform.config.modeTvAccessory) {
      platform.log.debug('Setting up accessory with kind ModeTVAccessory.');
      modeTvAccessory = new this.Accessory(
        state.device.name,
        this.UUIDGen.generate('ModeTVAccessory')
      );
      switch (platform.config.modeTvAccessoryType) {
        case 'settopbox':
          modeTvAccessory.category =
            this.platform.api.hap.Categories.TV_SET_TOP_BOX;
          break;
        case 'tvstick':
          modeTvAccessory.category =
            this.platform.api.hap.Categories.TV_STREAMING_STICK;
          break;
        case 'audioreceiver':
          modeTvAccessory.category =
            this.platform.api.hap.Categories.AUDIO_RECEIVER;
          break;
        default:
          modeTvAccessory.category =
            this.platform.api.hap.Categories.TELEVISION;
          break;
      }
      modeTvAccessory.context.kind = 'ModeTVAccessory';
      this.externalAccessories.push(modeTvAccessory);
      this.deviceAccessories.push(modeTvAccessory);
    }

    // Gets the tv accessory
    let intensityTvAccessory;
    if (platform.config.intensityTvAccessory) {
      platform.log.debug(
        'Adding new accessory with kind IntensityTVAccessory.'
      );
      intensityTvAccessory = new this.Accessory(
        state.device.name,
        this.UUIDGen.generate('IntensityTVAccessory')
      );
      switch (platform.config.intensityTvAccessoryType) {
        case 'settopbox':
          intensityTvAccessory.category =
            this.platform.api.hap.Categories.TV_SET_TOP_BOX;
          break;
        case 'tvstick':
          intensityTvAccessory.category =
            this.platform.api.hap.Categories.TV_STREAMING_STICK;
          break;
        case 'audioreceiver':
          intensityTvAccessory.category =
            this.platform.api.hap.Categories.AUDIO_RECEIVER;
          break;
        default:
          intensityTvAccessory.category =
            this.platform.api.hap.Categories.TELEVISION;
          break;
      }
      intensityTvAccessory.context.kind = 'IntensityTVAccessory';
      this.externalAccessories.push(intensityTvAccessory);
      this.deviceAccessories.push(intensityTvAccessory);
    }

    // Gets the tv accessory
    let entertainmentTvAccessory;
    if (platform.config.entertainmentTvAccessory) {
      platform.log.debug(
        'Adding new accessory with kind EntertainmentTVAccessory.'
      );
      entertainmentTvAccessory = new this.Accessory(
        state.device.name,
        this.UUIDGen.generate('EntertainmentTVAccessory')
      );
      switch (platform.config.entertainmentTvAccessoryType) {
        case 'settopbox':
          entertainmentTvAccessory.category =
            this.platform.api.hap.Categories.TV_SET_TOP_BOX;
          break;
        case 'tvstick':
          entertainmentTvAccessory.category =
            this.platform.api.hap.Categories.TV_STREAMING_STICK;
          break;
        case 'audioreceiver':
          entertainmentTvAccessory.category =
            this.platform.api.hap.Categories.AUDIO_RECEIVER;
          break;
        default:
          entertainmentTvAccessory.category =
            this.platform.api.hap.Categories.TELEVISION;
          break;
      }
      entertainmentTvAccessory.context.kind = 'EntertainmentTVAccessory';
      this.externalAccessories.push(entertainmentTvAccessory);
      this.deviceAccessories.push(entertainmentTvAccessory);
    }

    // Registers the newly created accessories
    platform.api.registerPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      this.newDeviceAccessories
    );

    // Removes all unused accessories
    for (let i = 0; i < this.unusedDeviceAccessories.length; i++) {
      const unusedDeviceAccessory = this.unusedDeviceAccessories[i];
      platform.log.debug(
        'Removing unused accessory with kind ' +
          unusedDeviceAccessory.context.kind +
          '.'
      );
      platform.accessories.delete(unusedDeviceAccessory.UUID);
    }
    platform.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      this.unusedDeviceAccessories
    );

    // Updates the accessory information
    for (let i = 0; i < this.deviceAccessories.length; i++) {
      const deviceAccessory = this.deviceAccessories[i];
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
          state.device.firmwareVersion
        );

      // Applies a custom serial number as otherwise issues with matching in HomeKit could occur
      if (deviceAccessory.context.kind === 'TVAccessory') {
        accessoryInformationService.setCharacteristic(
          this.Characteristic.SerialNumber,
          state.device.uniqueId + '-T'
        );
      } else if (deviceAccessory.context.kind === 'ModeTVAccessory') {
        accessoryInformationService.setCharacteristic(
          this.Characteristic.SerialNumber,
          state.device.uniqueId + '-M'
        );
      } else if (deviceAccessory.context.kind === 'IntensityTVAccessory') {
        accessoryInformationService.setCharacteristic(
          this.Characteristic.SerialNumber,
          state.device.uniqueId + '-I'
        );
      } else if (deviceAccessory.context.kind === 'EntertainmentTVAccessory') {
        accessoryInformationService.setCharacteristic(
          this.Characteristic.SerialNumber,
          state.device.uniqueId + '-E'
        );
      } else {
        accessoryInformationService.setCharacteristic(
          this.Characteristic.SerialNumber,
          state.device.uniqueId
        );
      }
    }

    // Handles the lightbulb accessory if it is enabled
    if (lightBulbAccessory) {
      // Updates the light bulb service
      // @ts-expect-error no subtype
      let lightBulbService = lightBulbAccessory.getServiceById(
        this.Service.Lightbulb
      );
      if (!lightBulbService) {
        lightBulbService = lightBulbAccessory.addService(
          this.Service.Lightbulb
        );
      }

      // Stores the light bulb service
      this.lightBulbService = lightBulbService;

      // Subscribes for changes of the on characteristic
      lightBulbService
        .getCharacteristic(this.Characteristic.On)
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            lightBulbService.getCharacteristic(this.Characteristic.On).value ===
            value
          ) {
            if (value) {
              platform.log.debug('Switch state is already ON');
            } else {
              platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
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
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({ mode: onMode });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to ON');
                }
              );
          } else {
            platform.log.debug('Switch state to OFF');
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({
                  mode: platform.config.defaultOffMode,
                });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to OFF');
                }
              );
          }

          // Performs the callback
          callback(null);
        });

      // Subscribes for changes of the brightness characteristic
      lightBulbService
        .getCharacteristic(this.Characteristic.Brightness)
        .on('set', (value, callback) => {
          // Saves the changes
          platform.log.debug('Switch brightness to ' + value);
          platform.limiter
            .schedule(() => {
              return platform.client.updateExecution({
                brightness: Math.round(((value as number) / 100.0) * 200),
              });
            })
            .then(
              () => {},
              () => {
                platform.log.debug('Failed to switch brightness to ' + value);
              }
            );

          // Performs the callback
          callback(null);
        });
    }

    // Handles the switch accessory if it is enabled
    if (switchAccessory) {
      // Updates the switch service
      // @ts-expect-error no subtype
      let switchService = switchAccessory.getServiceById(this.Service.Switch);
      if (!switchService) {
        switchService = switchAccessory.addService(this.Service.Switch);
      }

      // Stores the switch service
      this.switchService = switchService;

      // Subscribes for changes of the on characteristic
      switchService
        .getCharacteristic(this.Characteristic.On)
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            switchService.getCharacteristic(this.Characteristic.On).value ===
            value
          ) {
            if (value) {
              platform.log.debug('Switch state is already ON');
            } else {
              platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
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
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({ mode: onMode });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to ON');
                }
              );
          } else {
            platform.log.debug('Switch state to OFF');
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({
                  mode: platform.config.defaultOffMode,
                });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to OFF');
                }
              );
          }

          // Performs the callback
          callback(null);
        });
    }

    // Handles the TV accessory if it is enabled
    if (tvAccessory) {
      // Updates tv service
      // @ts-expect-error no subtype
      let tvService = tvAccessory.getServiceById(this.Service.Television);
      if (!tvService) {
        tvService = tvAccessory.addService(this.Service.Television);

        // Sets the TV name
        if (this.mainAccessory) {
          tvService.setCharacteristic(
            this.Characteristic.ConfiguredName,
            this.mainAccessory.context.tvAccessoryConfiguredName ||
              state.device.name
          );
          tvService
            .getCharacteristic(this.Characteristic.ConfiguredName)
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              this.mainAccessory.context.tvAccessoryConfiguredName = value;
              callback(null);
            });
        } else {
          tvService.setCharacteristic(
            this.Characteristic.ConfiguredName,
            state.device.name
          );
        }
      }

      // Register HDMI sources
      const hdmiInputServices: Service[] = [];
      for (let i = 1; i <= 4; i++) {
        let hdmiInputService = tvAccessory.getServiceById(
          this.Service.InputSource,
          'HDMI ' + i
        );
        if (!hdmiInputService) {
          hdmiInputService = tvAccessory.addService(
            this.Service.InputSource,
            'hdmi' + i,
            'HDMI ' + i
          );

          // Sets the TV name
          // @ts-expect-error need to use dynamic property
          const hdmiState: HdmiInput = this.state.hdmi[`input${i}`];
          const hdmiName = hdmiState.name || 'HDMI ' + i;

          hdmiInputService
            .setCharacteristic(this.Characteristic.ConfiguredName, hdmiName)
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
        hdmiInputService
          .setCharacteristic(this.Characteristic.Identifier, i)
          .setCharacteristic(
            this.Characteristic.InputSourceType,
            this.Characteristic.InputSourceType.HDMI
          );

        // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
        tvService.addLinkedService(hdmiInputService);
        hdmiInputServices.push(hdmiInputService);
      }

      // Sets sleep discovery characteristic (which is always discoverable as Homebridge is always running)
      tvService.setCharacteristic(
        this.Characteristic.SleepDiscoveryMode,
        this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

      // Handles on/off events
      tvService
        .getCharacteristic(this.Characteristic.Active)
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            tvService.getCharacteristic(this.Characteristic.Active).value ===
            value
          ) {
            if (value) {
              platform.log.debug('Switch state is already ON');
            } else {
              platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
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
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({ mode: onMode });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to ON');
                }
              );
          } else {
            platform.log.debug('Switch state to OFF');
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({
                  mode: platform.config.defaultOffMode,
                });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to OFF');
                }
              );
          }

          // Performs the callback
          callback(null);
        });

      // Handles input source changes
      tvService
        .getCharacteristic(this.Characteristic.ActiveIdentifier)
        .on('set', (value, callback) => {
          // Saves the changes
          platform.log.debug('Switch hdmi source to input' + value);
          platform.limiter
            .schedule(() => {
              return platform.client.updateExecution({
                hdmiSource: 'input' + value,
              });
            })
            .then(
              () => {},
              () => {
                platform.log.debug(
                  'Failed to switch hdmi source to input' + value
                );
              }
            );

          // Performs the callback
          callback(null);
        });

      // Handles showing/hiding of sources
      for (let i = 0; i < hdmiInputServices.length; i++) {
        hdmiInputServices[i]
          .getCharacteristic(this.Characteristic.TargetVisibilityState)
          .on('set', (value, callback) => {
            if (value === this.Characteristic.TargetVisibilityState.SHOWN) {
              hdmiInputServices[i].setCharacteristic(
                this.Characteristic.CurrentVisibilityState,
                this.Characteristic.CurrentVisibilityState.SHOWN
              );
            } else {
              hdmiInputServices[i].setCharacteristic(
                this.Characteristic.CurrentVisibilityState,
                this.Characteristic.CurrentVisibilityState.HIDDEN
              );
            }

            // Performs the callback
            callback(null);
          });
      }

      // Handles remote key input
      tvService
        .getCharacteristic(this.Characteristic.RemoteKey)
        .on('set', (value, callback) => {
          platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case this.Characteristic.RemoteKey.ARROW_UP:
              platform.log.debug('Increase brightness by 25%');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    brightness: Math.min(
                      200,
                      this.state.execution.brightness + 50
                    ),
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to increase brightness by 25%');
                  }
                );
              break;

            case this.Characteristic.RemoteKey.ARROW_DOWN:
              platform.log.debug('Decrease brightness by 25%');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    brightness: Math.max(
                      0,
                      this.state.execution.brightness - 50
                    ),
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to decrease brightness by 25%');
                  }
                );
              break;

            case this.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              // @ts-expect-error need to use dynamic property
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'subtle',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'high':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'moderate',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'intense':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'high',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              // @ts-expect-error need to use dynamic property
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'moderate',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'moderate':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'high',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'high':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'intense',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'intense':
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.SELECT:
              this.platform.log.debug('Toggle mode');
              switch (this.state.execution.mode) {
                case 'video':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'music' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'music':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'game' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'game':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        mode: 'passthrough',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'passthrough':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'video' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.PLAY_PAUSE:
              platform.log.debug('Toggle switch state');
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: platform.config.defaultOffMode,
                    });
                  })
                  .then(
                    () => {},
                    () => {
                      platform.log.debug('Failed to toggle switch state');
                    }
                  );
              } else {
                let onMode = platform.config.defaultOnMode;
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
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({ mode: onMode });
                  })
                  .then(
                    () => {},
                    () => {
                      platform.log.debug('Failed to toggle switch state');
                    }
                  );
              }
              break;

            case this.Characteristic.RemoteKey.INFORMATION:
              this.platform.log.debug('Toggle hdmi source');
              switch (this.state.execution.hdmiSource) {
                case 'input1':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input2',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input2':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input3',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input3':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input4',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input4':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input1',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
              }
              break;
          }

          // Performs the callback
          callback(null);
        });

      // Stores the tv service
      this.tvService = tvService;

      // Handles the lightbulb accessory if it is enabled
      if (platform.config.tvAccessoryLightbulb) {
        // Updates the light bulb service
        // @ts-expect-error no subtype
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
          .on('set', (value, callback) => {
            // Ignores changes if the new value equals the old value
            if (
              tvAccessoryLightBulbService.getCharacteristic(
                this.Characteristic.On
              ).value === value
            ) {
              if (value) {
                platform.log.debug('Switch state is already ON');
              } else {
                platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              platform.log.debug('Switch state to ON');
              let onMode = platform.config.defaultOnMode;
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
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({ mode: onMode });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to switch state to ON');
                  }
                );
            } else {
              platform.log.debug('Switch state to OFF');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    mode: platform.config.defaultOffMode,
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to switch state to OFF');
                  }
                );
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        tvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            platform.log.debug('Switch brightness to ' + value);
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch brightness to ' + value);
                }
              );

            // Performs the callback
            callback(null);
          });
      }
    }

    // Handles the mode TV accessory if it is enabled
    if (modeTvAccessory) {
      // Updates tv service
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
              state.device.name
          );
          modeTvService
            .getCharacteristic(this.Characteristic.ConfiguredName)
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              this.mainAccessory.context.modeTvAccessoryConfiguredName = value;
              callback(null);
            });
        } else {
          modeTvService.setCharacteristic(
            this.Characteristic.ConfiguredName,
            state.device.name
          );
        }
      }

      // Register mode input sources
      const modeInputServices: Service[] = [];
      const modes = ['none', 'Video', 'Music', 'Game', 'Passthrough'];
      for (let i = 1; i <= 4; i++) {
        let modeInputService = modeTvAccessory.getServiceById(
          this.Service.InputSource,
          'MODE ' + i
        );
        if (!modeInputService) {
          modeInputService = modeTvAccessory.addService(
            this.Service.InputSource,
            'mode' + i,
            'MODE ' + i
          );

          // Sets the TV name
          modeInputService
            .setCharacteristic(this.Characteristic.ConfiguredName, modes[i])
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
        modeInputService
          .setCharacteristic(this.Characteristic.Identifier, i)
          .setCharacteristic(
            this.Characteristic.InputSourceType,
            this.Characteristic.InputSourceType.HDMI
          );

        // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
        modeTvService.addLinkedService(modeInputService);
        modeInputServices.push(modeInputService);
      }

      // Sets sleep discovery characteristic (which is always discoverable as Homebridge is always running)
      modeTvService.setCharacteristic(
        this.Characteristic.SleepDiscoveryMode,
        this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

      // Handles on/off events
      modeTvService
        .getCharacteristic(this.Characteristic.Active)
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            modeTvService.getCharacteristic(this.Characteristic.Active)
              .value === value
          ) {
            if (value) {
              platform.log.debug('Switch state is already ON');
            } else {
              platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
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
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({ mode: onMode });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to ON');
                }
              );
          } else {
            platform.log.debug('Switch state to OFF');
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({
                  mode: platform.config.defaultOffMode,
                });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to OFF');
                }
              );
          }

          // Performs the callback
          callback(null);
        });

      // Handles input source changes
      modeTvService
        .getCharacteristic(this.Characteristic.ActiveIdentifier)
        .on('set', (value, callback) => {
          // Saves the changes
          let mode = '';
          switch (value) {
            case 1:
              mode = 'video';
              break;
            case 2:
              mode = 'music';
              break;
            case 3:
              mode = 'game';
              break;
            case 4:
              mode = 'passthrough';
              break;
          }
          platform.log.debug('Switch mode to ' + mode);
          platform.limiter
            .schedule(() => {
              return platform.client.updateExecution({ mode: mode });
            })
            .then(
              () => {},
              () => {
                platform.log.debug('Failed to switch mode to ' + mode);
              }
            );

          // Performs the callback
          callback(null);
        });

      // Handles showing/hiding of sources
      for (let i = 0; i < modeInputServices.length; i++) {
        modeInputServices[i]
          .getCharacteristic(this.Characteristic.TargetVisibilityState)
          .on('set', (value, callback) => {
            if (value === this.Characteristic.TargetVisibilityState.SHOWN) {
              modeInputServices[i].setCharacteristic(
                this.Characteristic.CurrentVisibilityState,
                this.Characteristic.CurrentVisibilityState.SHOWN
              );
            } else {
              modeInputServices[i].setCharacteristic(
                this.Characteristic.CurrentVisibilityState,
                this.Characteristic.CurrentVisibilityState.HIDDEN
              );
            }

            // Performs the callback
            callback(null);
          });
      }

      // Handles remote key input
      modeTvService
        .getCharacteristic(this.Characteristic.RemoteKey)
        .on('set', (value, callback) => {
          platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case this.Characteristic.RemoteKey.ARROW_UP:
              platform.log.debug('Increase brightness by 25%');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    brightness: Math.min(
                      200,
                      this.state.execution.brightness + 50
                    ),
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to increase brightness by 25%');
                  }
                );
              break;

            case this.Characteristic.RemoteKey.ARROW_DOWN:
              platform.log.debug('Decrease brightness by 25%');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    brightness: Math.max(
                      0,
                      this.state.execution.brightness - 50
                    ),
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to decrease brightness by 25%');
                  }
                );
              break;

            case this.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              // @ts-expect-error need to use dynamic property
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'subtle',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'high':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'moderate',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'intense':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'high',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              // @ts-expect-error need to use dynamic property
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'moderate',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'moderate':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'high',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'high':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'intense',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'intense':
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.SELECT:
              this.platform.log.debug('Toggle mode');
              switch (this.state.execution.mode) {
                case 'video':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'music' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'music':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'game' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'game':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        mode: 'passthrough',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'passthrough':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'video' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.PLAY_PAUSE:
              platform.log.debug('Toggle switch state');
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: platform.config.defaultOffMode,
                    });
                  })
                  .then(
                    () => {},
                    () => {
                      platform.log.debug('Failed to toggle switch state');
                    }
                  );
              } else {
                let onMode = platform.config.defaultOnMode;
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
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({ mode: onMode });
                  })
                  .then(
                    () => {},
                    () => {
                      platform.log.debug('Failed to toggle switch state');
                    }
                  );
              }
              break;

            case this.Characteristic.RemoteKey.INFORMATION:
              this.platform.log.debug('Toggle hdmi source');
              switch (this.state.execution.hdmiSource) {
                case 'input1':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input2',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input2':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input3',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input3':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input4',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input4':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input1',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
              }
              break;
          }

          // Performs the callback
          callback(null);
        });

      // Stores the tv service
      this.modeTvService = modeTvService;

      // Handles the lightbulb accessory if it is enabled
      if (platform.config.modeTvAccessoryLightbulb) {
        // Updates the light bulb service
        // @ts-expect-error no subtype
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
          .on('set', (value, callback) => {
            // Ignores changes if the new value equals the old value
            if (
              modeTvAccessoryLightBulbService.getCharacteristic(
                this.Characteristic.On
              ).value === value
            ) {
              if (value) {
                platform.log.debug('Switch state is already ON');
              } else {
                platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              platform.log.debug('Switch state to ON');
              let onMode = platform.config.defaultOnMode;
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
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({ mode: onMode });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to switch state to ON');
                  }
                );
            } else {
              platform.log.debug('Switch state to OFF');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    mode: platform.config.defaultOffMode,
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to switch state to OFF');
                  }
                );
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        modeTvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            platform.log.debug('Switch brightness to ' + value);
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch brightness to ' + value);
                }
              );

            // Performs the callback
            callback(null);
          });
      }
    }

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
              state.device.name
          );
          intensityTvService
            .getCharacteristic(this.Characteristic.ConfiguredName)
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              this.mainAccessory.context.intensityTvAccessoryConfiguredName =
                value;
              callback(null);
            });
        } else {
          intensityTvService.setCharacteristic(
            this.Characteristic.ConfiguredName,
            state.device.name
          );
        }
      }

      // Register intensity input sources
      const intensityInputServices: Service[] = [];
      const intensities = ['none', 'Subtle', 'Moderate', 'High', 'Intense'];
      for (let i = 1; i <= 4; i++) {
        let intensityInputService = intensityTvAccessory.getServiceById(
          this.Service.InputSource,
          'INTENSITY ' + i
        );
        if (!intensityInputService) {
          intensityInputService = intensityTvAccessory.addService(
            this.Service.InputSource,
            'intensity' + i,
            'INTENSITY ' + i
          );

          // Sets the TV name
          intensityInputService
            .setCharacteristic(
              this.Characteristic.ConfiguredName,
              intensities[i]
            )
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
        intensityInputService
          .setCharacteristic(this.Characteristic.Identifier, i)
          .setCharacteristic(
            this.Characteristic.InputSourceType,
            this.Characteristic.InputSourceType.HDMI
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
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            intensityTvService.getCharacteristic(this.Characteristic.Active)
              .value === value
          ) {
            if (value) {
              platform.log.debug('Switch state is already ON');
            } else {
              platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
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
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({ mode: onMode });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to ON');
                }
              );
          } else {
            platform.log.debug('Switch state to OFF');
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({
                  mode: platform.config.defaultOffMode,
                });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to OFF');
                }
              );
          }

          // Performs the callback
          callback(null);
        });

      // Handles input source changes
      intensityTvService
        .getCharacteristic(this.Characteristic.ActiveIdentifier)
        .on('set', (value, callback) => {
          // Saves the changes
          let intensity = '';
          switch (value) {
            case 1:
              intensity = 'subtle';
              break;
            case 2:
              intensity = 'moderate';
              break;
            case 3:
              intensity = 'high';
              break;
            case 4:
              intensity = 'intense';
              break;
          }
          platform.log.debug('Switch intensity to ' + intensity);
          platform.limiter
            .schedule(() => {
              return platform.client.updateExecution({ intensity: intensity });
            })
            .then(
              () => {},
              () => {
                platform.log.debug(
                  'Failed to switch intensity to ' + intensity
                );
              }
            );

          // Performs the callback
          callback(null);
        });

      // Handles showing/hiding of sources
      for (let i = 0; i < intensityInputServices.length; i++) {
        intensityInputServices[i]
          .getCharacteristic(this.Characteristic.TargetVisibilityState)
          .on('set', (value, callback) => {
            if (value === this.Characteristic.TargetVisibilityState.SHOWN) {
              intensityInputServices[i].setCharacteristic(
                this.Characteristic.CurrentVisibilityState,
                this.Characteristic.CurrentVisibilityState.SHOWN
              );
            } else {
              intensityInputServices[i].setCharacteristic(
                this.Characteristic.CurrentVisibilityState,
                this.Characteristic.CurrentVisibilityState.HIDDEN
              );
            }

            // Performs the callback
            callback(null);
          });
      }

      // Handles remote key input
      intensityTvService
        .getCharacteristic(this.Characteristic.RemoteKey)
        .on('set', (value, callback) => {
          platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case this.Characteristic.RemoteKey.ARROW_UP:
              platform.log.debug('Increase brightness by 25%');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    brightness: Math.min(
                      200,
                      this.state.execution.brightness + 50
                    ),
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to increase brightness by 25%');
                  }
                );
              break;

            case this.Characteristic.RemoteKey.ARROW_DOWN:
              platform.log.debug('Decrease brightness by 25%');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    brightness: Math.max(
                      0,
                      this.state.execution.brightness - 50
                    ),
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to decrease brightness by 25%');
                  }
                );
              break;

            case this.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              // @ts-expect-error need to use dynamic property
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'subtle',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'high':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'moderate',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'intense':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'high',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              // @ts-expect-error need to use mode as key
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'moderate',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'moderate':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'high',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'high':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'intense',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'intense':
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.SELECT:
              this.platform.log.debug('Toggle mode');
              switch (this.state.execution.mode) {
                case 'video':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'music' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'music':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'game' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'game':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        mode: 'passthrough',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'passthrough':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'video' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.PLAY_PAUSE:
              platform.log.debug('Toggle switch state');
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: platform.config.defaultOffMode,
                    });
                  })
                  .then(
                    () => {},
                    () => {
                      platform.log.debug('Failed to toggle switch state');
                    }
                  );
              } else {
                let onMode = platform.config.defaultOnMode;
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
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({ mode: onMode });
                  })
                  .then(
                    () => {},
                    () => {
                      platform.log.debug('Failed to toggle switch state');
                    }
                  );
              }
              break;

            case this.Characteristic.RemoteKey.INFORMATION:
              this.platform.log.debug('Toggle hdmi source');
              switch (this.state.execution.hdmiSource) {
                case 'input1':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input2',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input2':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input3',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input3':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input4',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input4':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input1',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
              }
              break;
          }

          // Performs the callback
          callback(null);
        });

      // Stores the tv service
      this.intensityTvService = intensityTvService;

      // Handles the lightbulb accessory if it is enabled
      if (platform.config.intensityTvAccessoryLightbulb) {
        // Updates the light bulb service
        // @ts-expect-error no subtype
        let intensityTvAccessoryLightBulbService =
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
          .on('set', (value, callback) => {
            // Ignores changes if the new value equals the old value
            if (
              intensityTvAccessoryLightBulbService.getCharacteristic(
                this.Characteristic.On
              ).value === value
            ) {
              if (value) {
                platform.log.debug('Switch state is already ON');
              } else {
                platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              platform.log.debug('Switch state to ON');
              let onMode = platform.config.defaultOnMode;
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
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({ mode: onMode });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to switch state to ON');
                  }
                );
            } else {
              platform.log.debug('Switch state to OFF');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    mode: platform.config.defaultOffMode,
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to switch state to OFF');
                  }
                );
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        intensityTvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            platform.log.debug('Switch brightness to ' + value);
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch brightness to ' + value);
                }
              );

            // Performs the callback
            callback(null);
          });
      }
    }

    // Handles the entertainment area TV accessory if it is enabled
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
              state.device.name
          );
          entertainmentTvService
            .getCharacteristic(this.Characteristic.ConfiguredName)
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              this.mainAccessory.context.entertainmentTvAccessoryConfiguredName =
                value;
              callback(null);
            });
        } else {
          entertainmentTvService.setCharacteristic(
            this.Characteristic.ConfiguredName,
            state.device.name
          );
        }
      }

      // Register input sources
      const entertainmentInputServices: Service[] = [];
      let i = 1;
      for (const groupId in this.state.hue.groups) {
        const group = this.state.hue.groups[groupId];

        let entertainmentInputService = entertainmentTvAccessory.getServiceById(
          this.Service.InputSource,
          'AREA ' + i
        );
        if (!entertainmentInputService) {
          entertainmentInputService = entertainmentTvAccessory.addService(
            this.Service.InputSource,
            'area' + i,
            'AREA ' + i
          );

          // Sets the TV name
          entertainmentInputService
            .setCharacteristic(this.Characteristic.ConfiguredName, group.name)
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
        entertainmentInputService
          .setCharacteristic(this.Characteristic.Identifier, i)
          .setCharacteristic(
            this.Characteristic.InputSourceType,
            this.Characteristic.InputSourceType.HDMI
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
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            entertainmentTvService.getCharacteristic(this.Characteristic.Active)
              .value === value
          ) {
            if (value) {
              platform.log.debug('Switch state is already ON');
            } else {
              platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
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
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({ mode: onMode });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to ON');
                }
              );
          } else {
            platform.log.debug('Switch state to OFF');
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({
                  mode: platform.config.defaultOffMode,
                });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch state to OFF');
                }
              );
          }

          // Performs the callback
          callback(null);
        });

      // Handles input source changes
      entertainmentTvService
        .getCharacteristic(this.Characteristic.ActiveIdentifier)
        .on('set', (value, callback) => {
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

          // @ts-expect-error need to use this as a key
          const group = this.state.hue.groups[groupId];

          // Saves the changes
          platform.log.debug('Switch entertainment area to ' + group.name);
          platform.limiter
            .schedule(() => {
              return platform.client.updateHue({ groupId: groupId });
            })
            .then(
              () => {},
              () => {
                platform.log.debug(
                  'Failed to switch entertainment area to ' + group.name
                );
              }
            );

          // Performs the callback
          callback(null);
        });

      // Handles showing/hiding of sources
      for (let i = 0; i < entertainmentInputServices.length; i++) {
        entertainmentInputServices[i]
          .getCharacteristic(this.Characteristic.TargetVisibilityState)
          .on('set', (value, callback) => {
            if (value === this.Characteristic.TargetVisibilityState.SHOWN) {
              entertainmentInputServices[i].setCharacteristic(
                this.Characteristic.CurrentVisibilityState,
                this.Characteristic.CurrentVisibilityState.SHOWN
              );
            } else {
              entertainmentInputServices[i].setCharacteristic(
                this.Characteristic.CurrentVisibilityState,
                this.Characteristic.CurrentVisibilityState.HIDDEN
              );
            }

            // Performs the callback
            callback(null);
          });
      }

      // Handles remote key input
      entertainmentTvService
        .getCharacteristic(this.Characteristic.RemoteKey)
        .on('set', (value, callback) => {
          platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case this.Characteristic.RemoteKey.ARROW_UP:
              platform.log.debug('Increase brightness by 25%');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    brightness: Math.min(
                      200,
                      this.state.execution.brightness + 50
                    ),
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to increase brightness by 25%');
                  }
                );
              break;

            case this.Characteristic.RemoteKey.ARROW_DOWN:
              platform.log.debug('Decrease brightness by 25%');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    brightness: Math.max(
                      0,
                      this.state.execution.brightness - 50
                    ),
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to decrease brightness by 25%');
                  }
                );
              break;

            case this.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              // @ts-expect-error need to use this as a key
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'subtle',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'high':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'moderate',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'intense':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'high',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              // @ts-expect-error need to use this as a key
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'moderate',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'moderate':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'high',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'high':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        intensity: 'intense',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle intensity');
                      }
                    );
                  break;
                case 'intense':
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.SELECT:
              this.platform.log.debug('Toggle mode');
              switch (this.state.execution.mode) {
                case 'video':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'music' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'music':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'game' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'game':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        mode: 'passthrough',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
                case 'passthrough':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({ mode: 'video' });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to toggle mode');
                      }
                    );
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.PLAY_PAUSE:
              platform.log.debug('Toggle switch state');
              if (
                this.state.execution.mode !== 'powersave' &&
                this.state.execution.mode !== 'passthrough'
              ) {
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: platform.config.defaultOffMode,
                    });
                  })
                  .then(
                    () => {},
                    () => {
                      platform.log.debug('Failed to toggle switch state');
                    }
                  );
              } else {
                let onMode = platform.config.defaultOnMode;
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
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({ mode: onMode });
                  })
                  .then(
                    () => {},
                    () => {
                      platform.log.debug('Failed to toggle switch state');
                    }
                  );
              }
              break;

            case this.Characteristic.RemoteKey.INFORMATION:
              this.platform.log.debug('Toggle hdmi source');
              switch (this.state.execution.hdmiSource) {
                case 'input1':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input2',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input2':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input3',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input3':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input4',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
                case 'input4':
                  platform.limiter
                    .schedule(() => {
                      return platform.client.updateExecution({
                        hdmiSource: 'input1',
                      });
                    })
                    .then(
                      () => {},
                      () => {
                        platform.log.debug('Failed to switch hdmi source');
                      }
                    );
                  break;
              }
              break;
          }

          // Performs the callback
          callback(null);
        });

      // Stores the tv service
      this.entertainmentTvService = entertainmentTvService;

      // Handles the lightbulb accessory if it is enabled
      if (platform.config.entertainmentTvAccessoryLightbulb) {
        // Updates the light bulb service
        // @ts-expect-error no subtype
        let entertainmentTvAccessoryLightBulbService =
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
          .on('set', (value, callback) => {
            // Ignores changes if the new value equals the old value
            if (
              entertainmentTvAccessoryLightBulbService.getCharacteristic(
                this.Characteristic.On
              ).value === value
            ) {
              if (value) {
                platform.log.debug('Switch state is already ON');
              } else {
                platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              platform.log.debug('Switch state to ON');
              let onMode = platform.config.defaultOnMode;
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
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({ mode: onMode });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to switch state to ON');
                  }
                );
            } else {
              platform.log.debug('Switch state to OFF');
              platform.limiter
                .schedule(() => {
                  return platform.client.updateExecution({
                    mode: platform.config.defaultOffMode,
                  });
                })
                .then(
                  () => {},
                  () => {
                    platform.log.debug('Failed to switch state to OFF');
                  }
                );
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        entertainmentTvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            platform.log.debug('Switch brightness to ' + value);
            platform.limiter
              .schedule(() => {
                return platform.client.updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                });
              })
              .then(
                () => {},
                () => {
                  platform.log.debug('Failed to switch brightness to ' + value);
                }
              );

            // Performs the callback
            callback(null);
          });
      }
    }

    // Publishes the external accessories (i.e. the TV accessories)
    if (this.externalAccessories.length > 0) {
      platform.api.publishExternalAccessories(
        PLUGIN_NAME,
        this.externalAccessories
      );
    }

    // Updates the state initially
    this.update(state);
  }

  public update(state: State): void {
    // Stores the latest state
    this.state = state;

    // Updates the corresponding service
    if (this.lightBulbService) {
      // Updates the on characteristic
      this.platform.log.debug('Updated state to ' + state.execution.mode);
      this.lightBulbService.updateCharacteristic(
        this.Characteristic.On,
        state.execution.mode !== 'powersave' &&
          state.execution.mode !== 'passthrough'
      );

      // Updates the brightness characteristic
      this.platform.log.debug(
        'Updated brightness to ' + state.execution.brightness
      );
      this.lightBulbService.updateCharacteristic(
        this.Characteristic.Brightness,
        Math.round((state.execution.brightness / 200.0) * 100)
      );
    }

    // Updates the corresponding service
    if (this.switchService) {
      // Updates the on characteristic
      this.platform.log.debug('Updated state to ' + state.execution.mode);
      this.switchService.updateCharacteristic(
        this.Characteristic.On,
        state.execution.mode !== 'powersave' &&
          state.execution.mode !== 'passthrough'
      );
    }

    // Updates the corresponding service of the TV accessory
    if (this.tvService) {
      // Updates the on characteristic
      this.platform.log.debug('Updated state to ' + state.execution.mode);
      this.tvService.updateCharacteristic(
        this.Characteristic.Active,
        state.execution.mode !== 'powersave'
      );

      // Updates the HDMI input characteristic
      this.platform.log.debug(
        'Updated HDMI input to ' + state.execution.hdmiSource
      );
      this.tvService.updateCharacteristic(
        this.Characteristic.ActiveIdentifier,
        parseInt(state.execution.hdmiSource.replace('input', ''))
      );

      // Updates the corresponding service
      if (this.tvAccessoryLightBulbService) {
        // Updates the on characteristic
        this.platform.log.debug('Updated state to ' + state.execution.mode);
        this.tvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.On,
          state.execution.mode !== 'powersave' &&
            state.execution.mode !== 'passthrough'
        );

        // Updates the brightness characteristic
        this.platform.log.debug(
          'Updated brightness to ' + state.execution.brightness
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
      this.platform.log.debug('Updated state to ' + state.execution.mode);
      this.modeTvService.updateCharacteristic(
        this.Characteristic.Active,
        state.execution.mode !== 'powersave'
      );

      // Updates the mode input characteristic
      this.platform.log.debug('Updated mode to ' + state.execution.mode);
      switch (state.execution.mode) {
        case 'video':
          this.modeTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            1
          );
          break;
        case 'music':
          this.modeTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            2
          );
          break;
        case 'game':
          this.modeTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            3
          );
          break;
        case 'passthrough':
          this.modeTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            4
          );
          break;
      }

      // Updates the corresponding service
      if (this.modeTvAccessoryLightBulbService) {
        // Updates the on characteristic
        this.platform.log.debug('Updated state to ' + state.execution.mode);
        this.modeTvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.On,
          state.execution.mode !== 'powersave' &&
            state.execution.mode !== 'passthrough'
        );

        // Updates the brightness characteristic
        this.platform.log.debug(
          'Updated brightness to ' + state.execution.brightness
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
      this.platform.log.debug('Updated state to ' + state.execution.mode);
      this.intensityTvService.updateCharacteristic(
        this.Characteristic.Active,
        state.execution.mode !== 'powersave'
      );

      // Gets the current mode or the last sync mode to set the intensity
      let mode = 'video';
      if (
        state.execution.mode !== 'powersave' &&
        state.execution.mode !== 'passthrough'
      ) {
        mode = state.execution.mode;
      } else if (state.execution.lastSyncMode) {
        mode = state.execution.lastSyncMode;
      }

      // Updates the intensity input characteristic
      // @ts-expect-error need to use mode as a key
      this.platform.log.debug(
        'Updated intensity to ' + state.execution[mode].intensity
      );
      // @ts-expect-error need to use mode as a key
      switch (state.execution[mode].intensity) {
        case 'subtle':
          this.intensityTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            1
          );
          break;
        case 'moderate':
          this.intensityTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            2
          );
          break;
        case 'high':
          this.intensityTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            3
          );
          break;
        case 'intense':
          this.intensityTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            4
          );
          break;
      }

      // Updates the corresponding service
      if (this.intensityTvAccessoryLightBulbService) {
        // Updates the on characteristic
        this.platform.log.debug('Updated state to ' + state.execution.mode);
        this.intensityTvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.On,
          state.execution.mode !== 'powersave' &&
            state.execution.mode !== 'passthrough'
        );

        // Updates the brightness characteristic
        this.platform.log.debug(
          'Updated brightness to ' + state.execution.brightness
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
      this.platform.log.debug('Updated state to ' + state.execution.mode);
      this.entertainmentTvService.updateCharacteristic(
        this.Characteristic.Active,
        state.execution.mode !== 'powersave'
      );

      // Gets the ID of the group based on the index
      let index = 1;
      for (const currentGroupId in this.state.hue.groups) {
        if (currentGroupId === state.hue.groupId) {
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
        this.platform.log.debug('Updated state to ' + state.execution.mode);
        this.entertainmentTvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.On,
          state.execution.mode !== 'powersave' &&
            state.execution.mode !== 'passthrough'
        );

        // Updates the brightness characteristic
        this.platform.log.debug(
          'Updated brightness to ' + state.execution.brightness
        );
        this.entertainmentTvAccessoryLightBulbService.updateCharacteristic(
          this.Characteristic.Brightness,
          Math.round((state.execution.brightness / 200.0) * 100)
        );
      }
    }
  }
}
