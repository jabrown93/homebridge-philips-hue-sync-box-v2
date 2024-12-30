import { HueSyncBoxPlatform } from './platform';
import { HdmiInput, State } from './state';
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

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // Gets the main light bulb accessory
    let lightBulbAccessory;
    if (self.platform.config.baseAccessory === 'lightbulb') {
      lightBulbAccessory = self.unusedDeviceAccessories.find(a => {
        return a.context.kind === 'LightBulbAccessory';
      });
      if (lightBulbAccessory) {
        self.unusedDeviceAccessories.splice(
          self.unusedDeviceAccessories.indexOf(lightBulbAccessory),
          1
        );
      } else {
        self.platform.log.info(
          'Adding new accessory with kind LightBulbAccessory.'
        );
        lightBulbAccessory = new self.Accessory(
          state.device.name,
          self.UUIDGen.generate('LightBulbAccessory')
        );
        lightBulbAccessory.context.kind = 'LightBulbAccessory';
        self.newDeviceAccessories.push(lightBulbAccessory);
      }
      self.deviceAccessories.push(lightBulbAccessory);

      self.mainAccessory = lightBulbAccessory;
    }

    // Gets the main switch accessory
    let switchAccessory;
    if (platform.config.baseAccessory === 'switch') {
      switchAccessory = self.unusedDeviceAccessories.find(a => {
        return a.context.kind === 'SwitchAccessory';
      });
      if (switchAccessory) {
        self.unusedDeviceAccessories.splice(
          self.unusedDeviceAccessories.indexOf(switchAccessory),
          1
        );
      } else {
        self.platform.log.debug(
          'Adding new accessory with kind SwitchAccessory.'
        );
        switchAccessory = new self.Accessory(
          state.device.name,
          self.UUIDGen.generate('SwitchAccessory')
        );
        switchAccessory.context.kind = 'SwitchAccessory';
        self.newDeviceAccessories.push(switchAccessory);
      }
      self.deviceAccessories.push(switchAccessory);

      self.mainAccessory = switchAccessory;
    }

    // Gets the tv accessory
    let tvAccessory;
    if (platform.config.tvAccessory) {
      self.platform.log.debug('Setting up accessory with kind TVAccessory.');
      tvAccessory = new self.Accessory(
        state.device.name,
        self.UUIDGen.generate('TVAccessory')
      );
      switch (platform.config.tvAccessoryType) {
        case 'settopbox':
          tvAccessory.category =
            self.platform.api.hap.Categories.TV_SET_TOP_BOX;
          break;
        case 'tvstick':
          tvAccessory.category =
            self.platform.api.hap.Categories.TV_STREAMING_STICK;
          break;
        case 'audioreceiver':
          tvAccessory.category =
            self.platform.api.hap.Categories.AUDIO_RECEIVER;
          break;
        default:
          tvAccessory.category = self.platform.api.hap.Categories.TELEVISION;
          break;
      }
      tvAccessory.context.kind = 'TVAccessory';
      self.externalAccessories.push(tvAccessory);
      self.deviceAccessories.push(tvAccessory);
    }

    // Gets the tv accessory
    let modeTvAccessory;
    if (platform.config.modeTvAccessory) {
      self.platform.log.debug(
        'Setting up accessory with kind ModeTVAccessory.'
      );
      modeTvAccessory = new self.Accessory(
        state.device.name,
        self.UUIDGen.generate('ModeTVAccessory')
      );
      switch (platform.config.modeTvAccessoryType) {
        case 'settopbox':
          modeTvAccessory.category =
            self.platform.api.hap.Categories.TV_SET_TOP_BOX;
          break;
        case 'tvstick':
          modeTvAccessory.category =
            self.platform.api.hap.Categories.TV_STREAMING_STICK;
          break;
        case 'audioreceiver':
          modeTvAccessory.category =
            self.platform.api.hap.Categories.AUDIO_RECEIVER;
          break;
        default:
          modeTvAccessory.category =
            self.platform.api.hap.Categories.TELEVISION;
          break;
      }
      modeTvAccessory.context.kind = 'ModeTVAccessory';
      self.externalAccessories.push(modeTvAccessory);
      self.deviceAccessories.push(modeTvAccessory);
    }

    // Gets the tv accessory
    let intensityTvAccessory;
    if (platform.config.intensityTvAccessory) {
      self.platform.log.debug(
        'Adding new accessory with kind IntensityTVAccessory.'
      );
      intensityTvAccessory = new self.Accessory(
        state.device.name,
        self.UUIDGen.generate('IntensityTVAccessory')
      );
      switch (platform.config.intensityTvAccessoryType) {
        case 'settopbox':
          intensityTvAccessory.category =
            self.platform.api.hap.Categories.TV_SET_TOP_BOX;
          break;
        case 'tvstick':
          intensityTvAccessory.category =
            self.platform.api.hap.Categories.TV_STREAMING_STICK;
          break;
        case 'audioreceiver':
          intensityTvAccessory.category =
            self.platform.api.hap.Categories.AUDIO_RECEIVER;
          break;
        default:
          intensityTvAccessory.category =
            self.platform.api.hap.Categories.TELEVISION;
          break;
      }
      intensityTvAccessory.context.kind = 'IntensityTVAccessory';
      self.externalAccessories.push(intensityTvAccessory);
      self.deviceAccessories.push(intensityTvAccessory);
    }

    // Gets the tv accessory
    let entertainmentTvAccessory;
    if (platform.config.entertainmentTvAccessory) {
      self.platform.log.debug(
        'Adding new accessory with kind EntertainmentTVAccessory.'
      );
      entertainmentTvAccessory = new self.Accessory(
        state.device.name,
        self.UUIDGen.generate('EntertainmentTVAccessory')
      );
      switch (platform.config.entertainmentTvAccessoryType) {
        case 'settopbox':
          entertainmentTvAccessory.category =
            self.platform.api.hap.Categories.TV_SET_TOP_BOX;
          break;
        case 'tvstick':
          entertainmentTvAccessory.category =
            self.platform.api.hap.Categories.TV_STREAMING_STICK;
          break;
        case 'audioreceiver':
          entertainmentTvAccessory.category =
            self.platform.api.hap.Categories.AUDIO_RECEIVER;
          break;
        default:
          entertainmentTvAccessory.category =
            self.platform.api.hap.Categories.TELEVISION;
          break;
      }
      entertainmentTvAccessory.context.kind = 'EntertainmentTVAccessory';
      self.externalAccessories.push(entertainmentTvAccessory);
      self.deviceAccessories.push(entertainmentTvAccessory);
    }

    // Registers the newly created accessories
    platform.api.registerPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      self.newDeviceAccessories
    );

    // Removes all unused accessories
    for (let i = 0; i < self.unusedDeviceAccessories.length; i++) {
      const unusedDeviceAccessory = self.unusedDeviceAccessories[i];
      self.platform.log.debug(
        'Removing unused accessory with kind ' +
          unusedDeviceAccessory.context.kind +
          '.'
      );
      platform.accessories.delete(unusedDeviceAccessory.UUID);
    }
    platform.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      self.unusedDeviceAccessories
    );

    // Updates the accessory information
    for (let i = 0; i < self.deviceAccessories.length; i++) {
      const deviceAccessory = self.deviceAccessories[i];
      let accessoryInformationService = deviceAccessory.getService(
        self.Service.AccessoryInformation
      );
      if (!accessoryInformationService) {
        accessoryInformationService = deviceAccessory.addService(
          self.Service.AccessoryInformation
        );
      }
      accessoryInformationService
        .setCharacteristic(self.Characteristic.Manufacturer, 'Philips')
        .setCharacteristic(self.Characteristic.Model, 'Sync Box')
        .setCharacteristic(
          self.Characteristic.FirmwareRevision,
          state.device.firmwareVersion
        );

      // Applies a custom serial number as otherwise issues with matching in HomeKit could occur
      if (deviceAccessory.context.kind === 'TVAccessory') {
        accessoryInformationService.setCharacteristic(
          self.Characteristic.SerialNumber,
          state.device.uniqueId + '-T'
        );
      } else if (deviceAccessory.context.kind === 'ModeTVAccessory') {
        accessoryInformationService.setCharacteristic(
          self.Characteristic.SerialNumber,
          state.device.uniqueId + '-M'
        );
      } else if (deviceAccessory.context.kind === 'IntensityTVAccessory') {
        accessoryInformationService.setCharacteristic(
          self.Characteristic.SerialNumber,
          state.device.uniqueId + '-I'
        );
      } else if (deviceAccessory.context.kind === 'EntertainmentTVAccessory') {
        accessoryInformationService.setCharacteristic(
          self.Characteristic.SerialNumber,
          state.device.uniqueId + '-E'
        );
      } else {
        accessoryInformationService.setCharacteristic(
          self.Characteristic.SerialNumber,
          state.device.uniqueId
        );
      }
    }

    // Handles the lightbulb accessory if it is enabled
    if (lightBulbAccessory) {
      // Updates the light bulb service
      let lightBulbService = lightBulbAccessory.getServiceById(
        self.Service.Lightbulb
      );
      if (!lightBulbService) {
        lightBulbService = lightBulbAccessory.addService(
          self.Service.Lightbulb
        );
      }

      // Stores the light bulb service
      self.lightBulbService = lightBulbService;

      // Subscribes for changes of the on characteristic
      lightBulbService
        .getCharacteristic(self.Characteristic.On)
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            lightBulbService.getCharacteristic(self.Characteristic.On).value ===
            value
          ) {
            if (value) {
              self.platform.log.debug('Switch state is already ON');
            } else {
              self.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            self.platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
            if (onMode === 'lastSyncMode') {
              if (
                self.state &&
                self.state.execution &&
                self.state.execution.lastSyncMode
              ) {
                onMode = self.state.execution.lastSyncMode;
              } else {
                onMode = 'video';
              }
            }
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  self.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            self.platform.log.debug('Switch state to OFF');
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: platform.config.defaultOffMode,
                })
                .catch(() => {
                  self.platform.log.debug('Failed to switch state to OFF');
                });
            });
          }

          // Performs the callback
          callback(null);
        });

      // Subscribes for changes of the brightness characteristic
      lightBulbService
        .getCharacteristic(self.Characteristic.Brightness)
        .on('set', (value, callback) => {
          // Saves the changes
          self.platform.log.debug('Switch brightness to ' + value);
          platform.limiter.schedule(() => {
            return platform.client
              .updateExecution({
                brightness: Math.round(((value as number) / 100.0) * 200),
              })
              .catch(() => {
                self.platform.log.debug(
                  'Failed to switch brightness to ' + value
                );
              });
          });

          // Performs the callback
          callback(null);
        });
    }

    // Handles the switch accessory if it is enabled
    if (switchAccessory) {
      // Updates the switch service
      let switchService = switchAccessory.getServiceById(self.Service.Switch);
      if (!switchService) {
        switchService = switchAccessory.addService(self.Service.Switch);
      }

      // Stores the switch service
      self.switchService = switchService;

      // Subscribes for changes of the on characteristic
      switchService
        .getCharacteristic(self.Characteristic.On)
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            switchService.getCharacteristic(self.Characteristic.On).value ===
            value
          ) {
            if (value) {
              self.platform.log.debug('Switch state is already ON');
            } else {
              self.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            self.platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
            if (onMode === 'lastSyncMode') {
              if (
                self.state &&
                self.state.execution &&
                self.state.execution.lastSyncMode
              ) {
                onMode = self.state.execution.lastSyncMode;
              } else {
                onMode = 'video';
              }
            }
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  self.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            self.platform.log.debug('Switch state to OFF');
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: platform.config.defaultOffMode,
                })
                .catch(() => {
                  self.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });
          }

          // Performs the callback
          callback(null);
        });
    }

    // Handles the TV accessory if it is enabled
    if (tvAccessory) {
      // Updates tv service
      let tvService = tvAccessory.getServiceById(self.Service.Television);
      if (!tvService) {
        tvService = tvAccessory.addService(self.Service.Television);

        // Sets the TV name
        if (self.mainAccessory) {
          tvService.setCharacteristic(
            self.Characteristic.ConfiguredName,
            self.mainAccessory.context.tvAccessoryConfiguredName ||
              state.device.name
          );
          tvService
            .getCharacteristic(self.Characteristic.ConfiguredName)
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              self.mainAccessory.context.tvAccessoryConfiguredName = value;
              callback(null);
            });
        } else {
          tvService.setCharacteristic(
            self.Characteristic.ConfiguredName,
            state.device.name
          );
        }
      }

      // Register HDMI sources
      const hdmiInputServices: Service[] = [];
      for (let i = 1; i <= 4; i++) {
        let hdmiInputService = tvAccessory.getServiceById(
          self.Service.InputSource,
          'HDMI ' + i
        );
        if (!hdmiInputService) {
          hdmiInputService = tvAccessory.addService(
            self.Service.InputSource,
            'hdmi' + i,
            'HDMI ' + i
          );

          // Sets the TV name
          const hdmiState: HdmiInput = self.state.hdmi[`input${i}`];
          const hdmiName = hdmiState.name || 'HDMI ' + i;

          hdmiInputService
            .setCharacteristic(self.Characteristic.ConfiguredName, hdmiName)
            .setCharacteristic(
              self.Characteristic.IsConfigured,
              self.Characteristic.IsConfigured.CONFIGURED
            )
            .setCharacteristic(
              self.Characteristic.CurrentVisibilityState,
              self.Characteristic.CurrentVisibilityState.SHOWN
            )
            .setCharacteristic(
              self.Characteristic.TargetVisibilityState,
              self.Characteristic.TargetVisibilityState.SHOWN
            );
        }
        hdmiInputService
          .setCharacteristic(self.Characteristic.Identifier, i)
          .setCharacteristic(
            self.Characteristic.InputSourceType,
            self.Characteristic.InputSourceType.HDMI
          );

        // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
        tvService.addLinkedService(hdmiInputService);
        hdmiInputServices.push(hdmiInputService);
      }

      // Sets sleep discovery characteristic (which is always discoverable as Homebridge is always running)
      tvService.setCharacteristic(
        self.Characteristic.SleepDiscoveryMode,
        self.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

      // Handles on/off events
      tvService
        .getCharacteristic(self.Characteristic.Active)
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            tvService.getCharacteristic(self.Characteristic.Active).value ===
            value
          ) {
            if (value) {
              self.platform.log.debug('Switch state is already ON');
            } else {
              self.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            self.platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
            if (onMode === 'lastSyncMode') {
              if (
                self.state &&
                self.state.execution &&
                self.state.execution.lastSyncMode
              ) {
                onMode = self.state.execution.lastSyncMode;
              } else {
                onMode = 'video';
              }
            }
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  self.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            self.platform.log.debug('Switch state to OFF');
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: platform.config.defaultOffMode,
                })
                .catch(() => {
                  self.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });
          }

          // Performs the callback
          callback(null);
        });

      // Handles input source changes
      tvService
        .getCharacteristic(self.Characteristic.ActiveIdentifier)
        .on('set', (value, callback) => {
          // Saves the changes
          self.platform.log.debug('Switch hdmi source to input' + value);
          platform.limiter.schedule(() => {
            return platform.client
              .updateExecution({
                hdmiSource: 'input' + value,
              })
              .catch(() => {
                self.platform.log.debug(
                  'Failed to switch hdmi source to input' + value
                );
              });
          });

          // Performs the callback
          callback(null);
        });

      // Handles showing/hiding of sources
      for (let i = 0; i < hdmiInputServices.length; i++) {
        hdmiInputServices[i]
          .getCharacteristic(self.Characteristic.TargetVisibilityState)
          .on('set', (value, callback) => {
            if (value === self.Characteristic.TargetVisibilityState.SHOWN) {
              hdmiInputServices[i].setCharacteristic(
                self.Characteristic.CurrentVisibilityState,
                self.Characteristic.CurrentVisibilityState.SHOWN
              );
            } else {
              hdmiInputServices[i].setCharacteristic(
                self.Characteristic.CurrentVisibilityState,
                self.Characteristic.CurrentVisibilityState.HIDDEN
              );
            }

            // Performs the callback
            callback(null);
          });
      }

      // Handles remote key input
      tvService
        .getCharacteristic(self.Characteristic.RemoteKey)
        .on('set', (value, callback) => {
          self.platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case self.Characteristic.RemoteKey.ARROW_UP:
              self.platform.log.debug('Increase brightness by 25%');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    brightness: Math.min(
                      200,
                      self.state.execution.brightness + 50
                    ),
                  })
                  .catch(() => {
                    self.platform.log.debug(
                      'Failed to increase brightness by 25%'
                    );
                  });
              });
              break;

            case self.Characteristic.RemoteKey.ARROW_DOWN:
              self.platform.log.debug('Decrease brightness by 25%');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    brightness: Math.max(
                      0,
                      self.state.execution.brightness - 50
                    ),
                  })
                  .catch(() => {
                    self.platform.log.debug(
                      'Failed to increase brightness by 25%'
                    );
                  });
              });
              break;

            case self.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                mode = self.state.execution.mode;
              } else if (self.state.execution.lastSyncMode) {
                mode = self.state.execution.lastSyncMode;
              }

              self.platform.log.debug('Toggle intensity');
              switch (self.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'subtle',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                mode = self.state.execution.mode;
              } else if (self.state.execution.lastSyncMode) {
                mode = self.state.execution.lastSyncMode;
              }

              self.platform.log.debug('Toggle intensity');
              switch (self.state.execution[mode].intensity) {
                case 'subtle':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'moderate':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'intense',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.SELECT:
              self.platform.log.debug('Toggle mode');
              switch (self.state.execution.mode) {
                case 'video':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'music' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'music':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'game' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'game':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        mode: 'passthrough',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'passthrough':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'video' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.PLAY_PAUSE:
              self.platform.log.debug('Toggle switch state');
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: platform.config.defaultOffMode,
                    });
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to toggle switch state');
                  });
              } else {
                let onMode = platform.config.defaultOnMode;
                if (onMode === 'lastSyncMode') {
                  if (
                    self.state &&
                    self.state.execution &&
                    self.state.execution.lastSyncMode
                  ) {
                    onMode = self.state.execution.lastSyncMode;
                  } else {
                    onMode = 'video';
                  }
                }
                platform.limiter.schedule(() => {
                  return platform.client
                    .updateExecution({
                      mode: onMode,
                    })
                    .catch(() => {
                      self.platform.log.debug('Failed to toggle switch state');
                    });
                });
              }
              break;

            case self.Characteristic.RemoteKey.INFORMATION:
              self.platform.log.debug('Toggle hdmi source');
              switch (self.state.execution.hdmiSource) {
                case 'input1':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input2',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input2':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input3',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input3':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input4',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input4':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input1',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
              }
              break;
          }

          // Performs the callback
          callback(null);
        });

      // Stores the tv service
      self.tvService = tvService;

      // Handles the lightbulb accessory if it is enabled
      if (platform.config.tvAccessoryLightbulb) {
        // Updates the light bulb service

        let tvAccessoryLightBulbService = tvAccessory.getServiceById(
          self.Service.Lightbulb
        );
        if (!tvAccessoryLightBulbService) {
          tvAccessoryLightBulbService = tvAccessory.addService(
            self.Service.Lightbulb
          );
        }

        // Stores the light bulb service
        self.tvAccessoryLightBulbService = tvAccessoryLightBulbService;

        // Subscribes for changes of the on characteristic
        tvAccessoryLightBulbService
          .getCharacteristic(self.Characteristic.On)
          .on('set', (value, callback) => {
            // Ignores changes if the new value equals the old value
            if (
              tvAccessoryLightBulbService.getCharacteristic(
                self.Characteristic.On
              ).value === value
            ) {
              if (value) {
                self.platform.log.debug('Switch state is already ON');
              } else {
                self.platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              self.platform.log.debug('Switch state to ON');
              let onMode = platform.config.defaultOnMode;
              if (onMode === 'lastSyncMode') {
                if (
                  self.state &&
                  self.state.execution &&
                  self.state.execution.lastSyncMode
                ) {
                  onMode = self.state.execution.lastSyncMode;
                } else {
                  onMode = 'video';
                }
              }
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    mode: onMode,
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to switch state to ON');
                  });
              });
            } else {
              self.platform.log.debug('Switch state to OFF');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    mode: platform.config.defaultOffMode,
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to switch state to OFF');
                  });
              });
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        tvAccessoryLightBulbService
          .getCharacteristic(self.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            self.platform.log.debug('Switch brightness to ' + value);
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                })
                .catch(() => {
                  self.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });

            // Performs the callback
            callback(null);
          });
      }
    }

    // Handles the mode TV accessory if it is enabled
    if (modeTvAccessory) {
      // Updates tv service
      let modeTvService = modeTvAccessory.getServiceById(
        self.Service.Television,
        'ModeTVAccessory'
      );
      if (!modeTvService) {
        modeTvService = modeTvAccessory.addService(
          self.Service.Television,
          'Mode',
          'ModeTVAccessory'
        );

        // Sets the TV name
        if (self.mainAccessory) {
          modeTvService.setCharacteristic(
            self.Characteristic.ConfiguredName,
            self.mainAccessory.context.modeTvAccessoryConfiguredName ||
              state.device.name
          );
          modeTvService
            .getCharacteristic(self.Characteristic.ConfiguredName)
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              self.mainAccessory.context.modeTvAccessoryConfiguredName = value;
              callback(null);
            });
        } else {
          modeTvService.setCharacteristic(
            self.Characteristic.ConfiguredName,
            state.device.name
          );
        }
      }

      // Register mode input sources
      const modeInputServices: Service[] = [];
      const modes = ['none', 'Video', 'Music', 'Game', 'Passthrough'];
      for (let i = 1; i <= 4; i++) {
        let modeInputService = modeTvAccessory.getServiceById(
          self.Service.InputSource,
          'MODE ' + i
        );
        if (!modeInputService) {
          modeInputService = modeTvAccessory.addService(
            self.Service.InputSource,
            'mode' + i,
            'MODE ' + i
          );

          // Sets the TV name
          modeInputService
            .setCharacteristic(self.Characteristic.ConfiguredName, modes[i])
            .setCharacteristic(
              self.Characteristic.IsConfigured,
              self.Characteristic.IsConfigured.CONFIGURED
            )
            .setCharacteristic(
              self.Characteristic.CurrentVisibilityState,
              self.Characteristic.CurrentVisibilityState.SHOWN
            )
            .setCharacteristic(
              self.Characteristic.TargetVisibilityState,
              self.Characteristic.TargetVisibilityState.SHOWN
            );
        }
        modeInputService
          .setCharacteristic(self.Characteristic.Identifier, i)
          .setCharacteristic(
            self.Characteristic.InputSourceType,
            self.Characteristic.InputSourceType.HDMI
          );

        // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
        modeTvService.addLinkedService(modeInputService);
        modeInputServices.push(modeInputService);
      }

      // Sets sleep discovery characteristic (which is always discoverable as Homebridge is always running)
      modeTvService.setCharacteristic(
        self.Characteristic.SleepDiscoveryMode,
        self.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

      // Handles on/off events
      modeTvService
        .getCharacteristic(self.Characteristic.Active)
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            modeTvService.getCharacteristic(self.Characteristic.Active)
              .value === value
          ) {
            if (value) {
              self.platform.log.debug('Switch state is already ON');
            } else {
              self.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            self.platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
            if (onMode === 'lastSyncMode') {
              if (
                self.state &&
                self.state.execution &&
                self.state.execution.lastSyncMode
              ) {
                onMode = self.state.execution.lastSyncMode;
              } else {
                onMode = 'video';
              }
            }
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  self.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            self.platform.log.debug('Switch state to OFF');
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: platform.config.defaultOffMode,
                })
                .catch(() => {
                  self.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });
          }

          // Performs the callback
          callback(null);
        });

      // Handles input source changes
      modeTvService
        .getCharacteristic(self.Characteristic.ActiveIdentifier)
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
          self.platform.log.debug('Switch mode to ' + mode);
          platform.limiter.schedule(() => {
            return platform.client
              .updateExecution({
                mode: mode,
              })
              .catch(() => {
                self.platform.log.debug('Failed to switch mode to ' + mode);
              });
          });

          // Performs the callback
          callback(null);
        });

      // Handles showing/hiding of sources
      for (let i = 0; i < modeInputServices.length; i++) {
        modeInputServices[i]
          .getCharacteristic(self.Characteristic.TargetVisibilityState)
          .on('set', (value, callback) => {
            if (value === self.Characteristic.TargetVisibilityState.SHOWN) {
              modeInputServices[i].setCharacteristic(
                self.Characteristic.CurrentVisibilityState,
                self.Characteristic.CurrentVisibilityState.SHOWN
              );
            } else {
              modeInputServices[i].setCharacteristic(
                self.Characteristic.CurrentVisibilityState,
                self.Characteristic.CurrentVisibilityState.HIDDEN
              );
            }

            // Performs the callback
            callback(null);
          });
      }

      // Handles remote key input
      modeTvService
        .getCharacteristic(self.Characteristic.RemoteKey)
        .on('set', (value, callback) => {
          self.platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case self.Characteristic.RemoteKey.ARROW_UP:
              self.platform.log.debug('Increase brightness by 25%');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    brightness: Math.min(
                      200,
                      self.state.execution.brightness + 50
                    ),
                  })
                  .catch(() => {
                    self.platform.log.debug(
                      'Failed to increase brightness by 25%'
                    );
                  });
              });
              break;

            case self.Characteristic.RemoteKey.ARROW_DOWN:
              self.platform.log.debug('Decrease brightness by 25%');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    brightness: Math.max(
                      0,
                      self.state.execution.brightness - 50
                    ),
                  })
                  .catch(() => {
                    self.platform.log.debug(
                      'Failed to decrease brightness by 25%'
                    );
                  });
              });
              break;

            case self.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                mode = self.state.execution.mode;
              } else if (self.state.execution.lastSyncMode) {
                mode = self.state.execution.lastSyncMode;
              }

              self.platform.log.debug('Toggle intensity');
              switch (self.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'subtle',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                mode = self.state.execution.mode;
              } else if (self.state.execution.lastSyncMode) {
                mode = self.state.execution.lastSyncMode;
              }

              self.platform.log.debug('Toggle intensity');
              switch (self.state.execution[mode].intensity) {
                case 'subtle':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'moderate':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'intense',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.SELECT:
              self.platform.log.debug('Toggle mode');
              switch (self.state.execution.mode) {
                case 'video':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'music' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'music':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'game' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'game':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        mode: 'passthrough',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'passthrough':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'video' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.PLAY_PAUSE:
              self.platform.log.debug('Toggle switch state');
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: platform.config.defaultOffMode,
                    });
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to toggle switch state');
                  });
              } else {
                let onMode = platform.config.defaultOnMode;
                if (onMode === 'lastSyncMode') {
                  if (
                    self.state &&
                    self.state.execution &&
                    self.state.execution.lastSyncMode
                  ) {
                    onMode = self.state.execution.lastSyncMode;
                  } else {
                    onMode = 'video';
                  }
                }
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: onMode,
                    });
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to toggle switch state');
                  });
              }
              break;

            case self.Characteristic.RemoteKey.INFORMATION:
              self.platform.log.debug('Toggle hdmi source');
              switch (self.state.execution.hdmiSource) {
                case 'input1':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input2',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input2':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input3',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input3':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input4',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input4':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input1',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
              }
              break;
          }

          // Performs the callback
          callback(null);
        });

      // Stores the tv service
      self.modeTvService = modeTvService;

      // Handles the lightbulb accessory if it is enabled
      if (platform.config.modeTvAccessoryLightbulb) {
        // Updates the light bulb service

        let modeTvAccessoryLightBulbService = modeTvAccessory.getServiceById(
          self.Service.Lightbulb
        );
        if (!modeTvAccessoryLightBulbService) {
          modeTvAccessoryLightBulbService = modeTvAccessory.addService(
            self.Service.Lightbulb
          );
        }

        // Stores the light bulb service
        self.modeTvAccessoryLightBulbService = modeTvAccessoryLightBulbService;

        // Subscribes for changes of the on characteristic
        modeTvAccessoryLightBulbService
          .getCharacteristic(self.Characteristic.On)
          .on('set', (value, callback) => {
            // Ignores changes if the new value equals the old value
            if (
              modeTvAccessoryLightBulbService.getCharacteristic(
                self.Characteristic.On
              ).value === value
            ) {
              if (value) {
                self.platform.log.debug('Switch state is already ON');
              } else {
                self.platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              self.platform.log.debug('Switch state to ON');
              let onMode = platform.config.defaultOnMode;
              if (onMode === 'lastSyncMode') {
                if (
                  self.state &&
                  self.state.execution &&
                  self.state.execution.lastSyncMode
                ) {
                  onMode = self.state.execution.lastSyncMode;
                } else {
                  onMode = 'video';
                }
              }
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    mode: onMode,
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to switch state to ON');
                  });
              });
            } else {
              self.platform.log.debug('Switch state to OFF');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    mode: platform.config.defaultOffMode,
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to switch state to OFF');
                  });
              });
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        modeTvAccessoryLightBulbService
          .getCharacteristic(self.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            self.platform.log.debug('Switch brightness to ' + value);
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                })
                .catch(() => {
                  self.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });

            // Performs the callback
            callback(null);
          });
      }
    }

    // Handles the intensity TV accessory if it is enabled
    if (intensityTvAccessory) {
      // Updates tv service
      let intensityTvService = intensityTvAccessory.getServiceById(
        self.Service.Television,
        'IntensityTVAccessory'
      );
      if (!intensityTvService) {
        intensityTvService = intensityTvAccessory.addService(
          self.Service.Television,
          'Intensity',
          'IntensityTVAccessory'
        );

        // Sets the TV name
        if (self.mainAccessory) {
          intensityTvService.setCharacteristic(
            self.Characteristic.ConfiguredName,
            self.mainAccessory.context.intensityTvAccessoryConfiguredName ||
              state.device.name
          );
          intensityTvService
            .getCharacteristic(self.Characteristic.ConfiguredName)
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              self.mainAccessory.context.intensityTvAccessoryConfiguredName =
                value;
              callback(null);
            });
        } else {
          intensityTvService.setCharacteristic(
            self.Characteristic.ConfiguredName,
            state.device.name
          );
        }
      }

      // Register intensity input sources
      const intensityInputServices: Service[] = [];
      const intensities = ['none', 'Subtle', 'Moderate', 'High', 'Intense'];
      for (let i = 1; i <= 4; i++) {
        let intensityInputService = intensityTvAccessory.getServiceById(
          self.Service.InputSource,
          'INTENSITY ' + i
        );
        if (!intensityInputService) {
          intensityInputService = intensityTvAccessory.addService(
            self.Service.InputSource,
            'intensity' + i,
            'INTENSITY ' + i
          );

          // Sets the TV name
          intensityInputService
            .setCharacteristic(
              self.Characteristic.ConfiguredName,
              intensities[i]
            )
            .setCharacteristic(
              self.Characteristic.IsConfigured,
              self.Characteristic.IsConfigured.CONFIGURED
            )
            .setCharacteristic(
              self.Characteristic.CurrentVisibilityState,
              self.Characteristic.CurrentVisibilityState.SHOWN
            )
            .setCharacteristic(
              self.Characteristic.TargetVisibilityState,
              self.Characteristic.TargetVisibilityState.SHOWN
            );
        }
        intensityInputService
          .setCharacteristic(self.Characteristic.Identifier, i)
          .setCharacteristic(
            self.Characteristic.InputSourceType,
            self.Characteristic.InputSourceType.HDMI
          );

        // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
        intensityTvService.addLinkedService(intensityInputService);
        intensityInputServices.push(intensityInputService);
      }

      // Sets sleep discovery characteristic (which is always discoverable as Homebridge is always running)
      intensityTvService.setCharacteristic(
        self.Characteristic.SleepDiscoveryMode,
        self.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

      // Handles on/off events
      intensityTvService
        .getCharacteristic(self.Characteristic.Active)
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            intensityTvService.getCharacteristic(self.Characteristic.Active)
              .value === value
          ) {
            if (value) {
              self.platform.log.debug('Switch state is already ON');
            } else {
              self.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            self.platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
            if (onMode === 'lastSyncMode') {
              if (
                self.state &&
                self.state.execution &&
                self.state.execution.lastSyncMode
              ) {
                onMode = self.state.execution.lastSyncMode;
              } else {
                onMode = 'video';
              }
            }
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  self.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            self.platform.log.debug('Switch state to OFF');
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: platform.config.defaultOffMode,
                })
                .catch(() => {
                  self.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });
          }

          // Performs the callback
          callback(null);
        });

      // Handles input source changes
      intensityTvService
        .getCharacteristic(self.Characteristic.ActiveIdentifier)
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
          self.platform.log.debug('Switch intensity to ' + intensity);
          platform.limiter.schedule(() => {
            return platform.client
              .updateExecution({
                intensity: intensity,
              })
              .catch(() => {
                self.platform.log.debug(
                  'Failed to switch intensity to ' + intensity
                );
              });
          });

          // Performs the callback
          callback(null);
        });

      // Handles showing/hiding of sources
      for (let i = 0; i < intensityInputServices.length; i++) {
        intensityInputServices[i]
          .getCharacteristic(self.Characteristic.TargetVisibilityState)
          .on('set', (value, callback) => {
            if (value === self.Characteristic.TargetVisibilityState.SHOWN) {
              intensityInputServices[i].setCharacteristic(
                self.Characteristic.CurrentVisibilityState,
                self.Characteristic.CurrentVisibilityState.SHOWN
              );
            } else {
              intensityInputServices[i].setCharacteristic(
                self.Characteristic.CurrentVisibilityState,
                self.Characteristic.CurrentVisibilityState.HIDDEN
              );
            }

            // Performs the callback
            callback(null);
          });
      }

      // Handles remote key input
      intensityTvService
        .getCharacteristic(self.Characteristic.RemoteKey)
        .on('set', (value, callback) => {
          self.platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case self.Characteristic.RemoteKey.ARROW_UP:
              self.platform.log.debug('Increase brightness by 25%');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    brightness: Math.min(
                      200,
                      self.state.execution.brightness + 50
                    ),
                  })
                  .catch(() => {
                    self.platform.log.debug(
                      'Failed to increase brightness by 25%'
                    );
                  });
              });
              break;

            case self.Characteristic.RemoteKey.ARROW_DOWN:
              self.platform.log.debug('Decrease brightness by 25%');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    brightness: Math.max(
                      0,
                      self.state.execution.brightness - 50
                    ),
                  })
                  .catch(() => {
                    self.platform.log.debug(
                      'Failed to decrease brightness by 25%'
                    );
                  });
              });
              break;

            case self.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                mode = self.state.execution.mode;
              } else if (self.state.execution.lastSyncMode) {
                mode = self.state.execution.lastSyncMode;
              }

              self.platform.log.debug('Toggle intensity');
              switch (self.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'subtle',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                mode = self.state.execution.mode;
              } else if (self.state.execution.lastSyncMode) {
                mode = self.state.execution.lastSyncMode;
              }

              self.platform.log.debug('Toggle intensity');
              switch (self.state.execution[mode].intensity) {
                case 'subtle':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'moderate':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'intense',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.SELECT:
              self.platform.log.debug('Toggle mode');
              switch (self.state.execution.mode) {
                case 'video':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'music' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'music':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'game' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'game':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        mode: 'passthrough',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'passthrough':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'video' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.PLAY_PAUSE:
              self.platform.log.debug('Toggle switch state');
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: platform.config.defaultOffMode,
                    });
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to toggle switch state');
                  });
              } else {
                let onMode = platform.config.defaultOnMode;
                if (onMode === 'lastSyncMode') {
                  if (
                    self.state &&
                    self.state.execution &&
                    self.state.execution.lastSyncMode
                  ) {
                    onMode = self.state.execution.lastSyncMode;
                  } else {
                    onMode = 'video';
                  }
                }
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: onMode,
                    });
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to toggle switch state');
                  });
              }
              break;

            case self.Characteristic.RemoteKey.INFORMATION:
              self.platform.log.debug('Toggle hdmi source');
              switch (self.state.execution.hdmiSource) {
                case 'input1':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input2',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input2':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input3',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input3':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input4',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input4':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input1',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
              }
              break;
          }

          // Performs the callback
          callback(null);
        });

      // Stores the tv service
      self.intensityTvService = intensityTvService;

      // Handles the lightbulb accessory if it is enabled
      if (platform.config.intensityTvAccessoryLightbulb) {
        // Updates the light bulb service
        let intensityTvAccessoryLightBulbService =
          intensityTvAccessory.getServiceById(self.Service.Lightbulb);
        if (!intensityTvAccessoryLightBulbService) {
          intensityTvAccessoryLightBulbService =
            intensityTvAccessory.addService(self.Service.Lightbulb);
        }

        // Stores the light bulb service
        self.intensityTvAccessoryLightBulbService =
          intensityTvAccessoryLightBulbService;

        // Subscribes for changes of the on characteristic
        intensityTvAccessoryLightBulbService
          .getCharacteristic(self.Characteristic.On)
          .on('set', (value, callback) => {
            // Ignores changes if the new value equals the old value
            if (
              intensityTvAccessoryLightBulbService.getCharacteristic(
                self.Characteristic.On
              ).value === value
            ) {
              if (value) {
                self.platform.log.debug('Switch state is already ON');
              } else {
                self.platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              self.platform.log.debug('Switch state to ON');
              let onMode = platform.config.defaultOnMode;
              if (onMode === 'lastSyncMode') {
                if (
                  self.state &&
                  self.state.execution &&
                  self.state.execution.lastSyncMode
                ) {
                  onMode = self.state.execution.lastSyncMode;
                } else {
                  onMode = 'video';
                }
              }
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    mode: onMode,
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to switch state to ON');
                  });
              });
            } else {
              self.platform.log.debug('Switch state to OFF');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    mode: platform.config.defaultOffMode,
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to switch state to OFF');
                  });
              });
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        intensityTvAccessoryLightBulbService
          .getCharacteristic(self.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            self.platform.log.debug('Switch brightness to ' + value);
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                })
                .catch(() => {
                  self.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });

            // Performs the callback
            callback(null);
          });
      }
    }

    // Handles the entertainment area TV accessory if it is enabled
    if (entertainmentTvAccessory) {
      // Updates tv service
      let entertainmentTvService = entertainmentTvAccessory.getServiceById(
        self.Service.Television,
        'EntertainmentTVAccessory'
      );
      if (!entertainmentTvService) {
        entertainmentTvService = entertainmentTvAccessory.addService(
          self.Service.Television,
          'Entertainment Area',
          'EntertainmentTVAccessory'
        );

        // Sets the TV name
        if (self.mainAccessory) {
          entertainmentTvService.setCharacteristic(
            self.Characteristic.ConfiguredName,
            self.mainAccessory.context.entertainmentTvAccessoryConfiguredName ||
              state.device.name
          );
          entertainmentTvService
            .getCharacteristic(self.Characteristic.ConfiguredName)
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              self.mainAccessory.context.entertainmentTvAccessoryConfiguredName =
                value;
              callback(null);
            });
        } else {
          entertainmentTvService.setCharacteristic(
            self.Characteristic.ConfiguredName,
            state.device.name
          );
        }
      }

      // Register input sources
      const entertainmentInputServices: Service[] = [];
      let i = 1;
      for (const groupId in self.state.hue.groups) {
        const group = self.state.hue.groups[groupId];

        let entertainmentInputService = entertainmentTvAccessory.getServiceById(
          self.Service.InputSource,
          'AREA ' + i
        );
        if (!entertainmentInputService) {
          entertainmentInputService = entertainmentTvAccessory.addService(
            self.Service.InputSource,
            'area' + i,
            'AREA ' + i
          );

          // Sets the TV name
          entertainmentInputService
            .setCharacteristic(self.Characteristic.ConfiguredName, group.name)
            .setCharacteristic(
              self.Characteristic.IsConfigured,
              self.Characteristic.IsConfigured.CONFIGURED
            )
            .setCharacteristic(
              self.Characteristic.CurrentVisibilityState,
              self.Characteristic.CurrentVisibilityState.SHOWN
            )
            .setCharacteristic(
              self.Characteristic.TargetVisibilityState,
              self.Characteristic.TargetVisibilityState.SHOWN
            );
        }
        entertainmentInputService
          .setCharacteristic(self.Characteristic.Identifier, i)
          .setCharacteristic(
            self.Characteristic.InputSourceType,
            self.Characteristic.InputSourceType.HDMI
          );

        // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
        entertainmentTvService.addLinkedService(entertainmentInputService);
        entertainmentInputServices.push(entertainmentInputService);

        i++;
      }

      // Sets sleep discovery characteristic (which is always discoverable as Homebridge is always running)
      entertainmentTvService.setCharacteristic(
        self.Characteristic.SleepDiscoveryMode,
        self.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
      );

      // Handles on/off events
      entertainmentTvService
        .getCharacteristic(self.Characteristic.Active)
        .on('set', (value, callback) => {
          // Ignores changes if the new value equals the old value
          if (
            entertainmentTvService.getCharacteristic(self.Characteristic.Active)
              .value === value
          ) {
            if (value) {
              self.platform.log.debug('Switch state is already ON');
            } else {
              self.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            self.platform.log.debug('Switch state to ON');
            let onMode = platform.config.defaultOnMode;
            if (onMode === 'lastSyncMode') {
              if (
                self.state &&
                self.state.execution &&
                self.state.execution.lastSyncMode
              ) {
                onMode = self.state.execution.lastSyncMode;
              } else {
                onMode = 'video';
              }
            }
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  self.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            self.platform.log.debug('Switch state to OFF');
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  mode: platform.config.defaultOffMode,
                })
                .catch(() => {
                  self.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });
          }

          // Performs the callback
          callback(null);
        });

      // Handles input source changes
      entertainmentTvService
        .getCharacteristic(self.Characteristic.ActiveIdentifier)
        .on('set', (value, callback) => {
          // Gets the ID of the group based on the index
          let groupId: string | null = null;
          let i = 1;
          for (const currentGroupId in self.state.hue.groups) {
            if (i === value) {
              groupId = currentGroupId;
              break;
            }
            i++;
          }

          // @ts-expect-error need to use self as a key
          const group = self.state.hue.groups[groupId];

          // Saves the changes
          self.platform.log.debug('Switch entertainment area to ' + group.name);
          platform.limiter.schedule(() => {
            return platform.client
              .updateHue({
                groupId: groupId,
              })
              .catch(() => {
                self.platform.log.debug(
                  'Failed to switch entertainment area to ' + group.name
                );
              });
          });

          // Performs the callback
          callback(null);
        });

      // Handles showing/hiding of sources
      for (let i = 0; i < entertainmentInputServices.length; i++) {
        entertainmentInputServices[i]
          .getCharacteristic(self.Characteristic.TargetVisibilityState)
          .on('set', (value, callback) => {
            if (value === self.Characteristic.TargetVisibilityState.SHOWN) {
              entertainmentInputServices[i].setCharacteristic(
                self.Characteristic.CurrentVisibilityState,
                self.Characteristic.CurrentVisibilityState.SHOWN
              );
            } else {
              entertainmentInputServices[i].setCharacteristic(
                self.Characteristic.CurrentVisibilityState,
                self.Characteristic.CurrentVisibilityState.HIDDEN
              );
            }

            // Performs the callback
            callback(null);
          });
      }

      // Handles remote key input
      entertainmentTvService
        .getCharacteristic(self.Characteristic.RemoteKey)
        .on('set', (value, callback) => {
          self.platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case self.Characteristic.RemoteKey.ARROW_UP:
              self.platform.log.debug('Increase brightness by 25%');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    brightness: Math.min(
                      200,
                      self.state.execution.brightness + 50
                    ),
                  })
                  .catch(() => {
                    self.platform.log.debug(
                      'Failed to increase brightness by 25%'
                    );
                  });
              });
              break;

            case self.Characteristic.RemoteKey.ARROW_DOWN:
              self.platform.log.debug('Decrease brightness by 25%');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    brightness: Math.max(
                      0,
                      self.state.execution.brightness - 50
                    ),
                  })
                  .catch(() => {
                    self.platform.log.debug(
                      'Failed to decrease brightness by 25%'
                    );
                  });
              });
              break;

            case self.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                mode = self.state.execution.mode;
              } else if (self.state.execution.lastSyncMode) {
                mode = self.state.execution.lastSyncMode;
              }

              self.platform.log.debug('Toggle intensity');
              switch (self.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'subtle',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = 'video';
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                mode = self.state.execution.mode;
              } else if (self.state.execution.lastSyncMode) {
                mode = self.state.execution.lastSyncMode;
              }

              self.platform.log.debug('Toggle intensity');
              switch (self.state.execution[mode].intensity) {
                case 'subtle':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'moderate':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        intensity: 'intense',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.SELECT:
              self.platform.log.debug('Toggle mode');
              switch (self.state.execution.mode) {
                case 'video':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'music' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'music':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'game' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'game':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        mode: 'passthrough',
                      })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case 'passthrough':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({ mode: 'video' })
                      .catch(() => {
                        self.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
              }
              break;

            case self.Characteristic.RemoteKey.PLAY_PAUSE:
              self.platform.log.debug('Toggle switch state');
              if (
                self.state.execution.mode !== 'powersave' &&
                self.state.execution.mode !== 'passthrough'
              ) {
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: platform.config.defaultOffMode,
                    });
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to toggle switch state');
                  });
              } else {
                let onMode = platform.config.defaultOnMode;
                if (onMode === 'lastSyncMode') {
                  if (
                    self.state &&
                    self.state.execution &&
                    self.state.execution.lastSyncMode
                  ) {
                    onMode = self.state.execution.lastSyncMode;
                  } else {
                    onMode = 'video';
                  }
                }
                platform.limiter
                  .schedule(() => {
                    return platform.client.updateExecution({
                      mode: onMode,
                    });
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to toggle switch state');
                  });
              }
              break;

            case self.Characteristic.RemoteKey.INFORMATION:
              self.platform.log.debug('Toggle hdmi source');
              switch (self.state.execution.hdmiSource) {
                case 'input1':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input2',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input2':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input3',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input3':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input4',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input4':
                  platform.limiter.schedule(() => {
                    return platform.client
                      .updateExecution({
                        hdmiSource: 'input1',
                      })
                      .catch(() => {
                        self.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
              }
              break;
          }

          // Performs the callback
          callback(null);
        });

      // Stores the tv service
      self.entertainmentTvService = entertainmentTvService;

      // Handles the lightbulb accessory if it is enabled
      if (platform.config.entertainmentTvAccessoryLightbulb) {
        // Updates the light bulb service
        let entertainmentTvAccessoryLightBulbService =
          entertainmentTvAccessory.getServiceById(self.Service.Lightbulb);
        if (!entertainmentTvAccessoryLightBulbService) {
          entertainmentTvAccessoryLightBulbService =
            entertainmentTvAccessory.addService(self.Service.Lightbulb);
        }

        // Stores the light bulb service
        self.entertainmentTvAccessoryLightBulbService =
          entertainmentTvAccessoryLightBulbService;

        // Subscribes for changes of the on characteristic
        entertainmentTvAccessoryLightBulbService
          .getCharacteristic(self.Characteristic.On)
          .on('set', (value, callback) => {
            // Ignores changes if the new value equals the old value
            if (
              entertainmentTvAccessoryLightBulbService.getCharacteristic(
                self.Characteristic.On
              ).value === value
            ) {
              if (value) {
                self.platform.log.debug('Switch state is already ON');
              } else {
                self.platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              self.platform.log.debug('Switch state to ON');
              let onMode = platform.config.defaultOnMode;
              if (onMode === 'lastSyncMode') {
                if (
                  self.state &&
                  self.state.execution &&
                  self.state.execution.lastSyncMode
                ) {
                  onMode = self.state.execution.lastSyncMode;
                } else {
                  onMode = 'video';
                }
              }
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    mode: onMode,
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to switch state to ON');
                  });
              });
            } else {
              self.platform.log.debug('Switch state to OFF');
              platform.limiter.schedule(() => {
                return platform.client
                  .updateExecution({
                    mode: platform.config.defaultOffMode,
                  })
                  .catch(() => {
                    self.platform.log.debug('Failed to switch state to OFF');
                  });
              });
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        entertainmentTvAccessoryLightBulbService
          .getCharacteristic(self.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            self.platform.log.debug('Switch brightness to ' + value);
            platform.limiter.schedule(() => {
              return platform.client
                .updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                })
                .catch(() => {
                  self.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });

            // Performs the callback
            callback(null);
          });
      }
    }

    // Publishes the external accessories (i.e. the TV accessories)
    if (self.externalAccessories.length > 0) {
      platform.api.publishExternalAccessories(
        PLUGIN_NAME,
        self.externalAccessories
      );
    }

    // Updates the state initially
    self.update(state);
  }

  public update(state: State): void {
    // Stores the latest state
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.state = state;

    // Updates the corresponding service
    if (self.lightBulbService) {
      // Updates the on characteristic
      self.platform.log.debug('Updated state to ' + state.execution.mode);
      self.lightBulbService.updateCharacteristic(
        self.Characteristic.On,
        state.execution.mode !== 'powersave' &&
          state.execution.mode !== 'passthrough'
      );

      // Updates the brightness characteristic
      self.platform.log.debug(
        'Updated brightness to ' + state.execution.brightness
      );
      self.lightBulbService.updateCharacteristic(
        self.Characteristic.Brightness,
        Math.round((state.execution.brightness / 200.0) * 100)
      );
    }

    // Updates the corresponding service
    if (self.switchService) {
      // Updates the on characteristic
      self.platform.log.debug('Updated state to ' + state.execution.mode);
      self.switchService.updateCharacteristic(
        self.Characteristic.On,
        state.execution.mode !== 'powersave' &&
          state.execution.mode !== 'passthrough'
      );
    }

    // Updates the corresponding service of the TV accessory
    if (self.tvService) {
      // Updates the on characteristic
      self.platform.log.debug('Updated state to ' + state.execution.mode);
      self.tvService.updateCharacteristic(
        self.Characteristic.Active,
        state.execution.mode !== 'powersave'
      );

      // Updates the HDMI input characteristic
      self.platform.log.debug(
        'Updated HDMI input to ' + state.execution.hdmiSource
      );
      self.tvService.updateCharacteristic(
        self.Characteristic.ActiveIdentifier,
        parseInt(state.execution.hdmiSource.replace('input', ''))
      );

      // Updates the corresponding service
      if (self.tvAccessoryLightBulbService) {
        // Updates the on characteristic
        self.platform.log.debug('Updated state to ' + state.execution.mode);
        self.tvAccessoryLightBulbService.updateCharacteristic(
          self.Characteristic.On,
          state.execution.mode !== 'powersave' &&
            state.execution.mode !== 'passthrough'
        );

        // Updates the brightness characteristic
        self.platform.log.debug(
          'Updated brightness to ' + state.execution.brightness
        );
        self.tvAccessoryLightBulbService.updateCharacteristic(
          self.Characteristic.Brightness,
          Math.round((state.execution.brightness / 200.0) * 100)
        );
      }
    }

    // Updates the corresponding service of the mode TV accessory
    if (self.modeTvService) {
      // Updates the on characteristic
      self.platform.log.debug('Updated state to ' + state.execution.mode);
      self.modeTvService.updateCharacteristic(
        self.Characteristic.Active,
        state.execution.mode !== 'powersave'
      );

      // Updates the mode input characteristic
      self.platform.log.debug('Updated mode to ' + state.execution.mode);
      switch (state.execution.mode) {
        case 'video':
          self.modeTvService.updateCharacteristic(
            self.Characteristic.ActiveIdentifier,
            1
          );
          break;
        case 'music':
          self.modeTvService.updateCharacteristic(
            self.Characteristic.ActiveIdentifier,
            2
          );
          break;
        case 'game':
          self.modeTvService.updateCharacteristic(
            self.Characteristic.ActiveIdentifier,
            3
          );
          break;
        case 'passthrough':
          self.modeTvService.updateCharacteristic(
            self.Characteristic.ActiveIdentifier,
            4
          );
          break;
      }

      // Updates the corresponding service
      if (self.modeTvAccessoryLightBulbService) {
        // Updates the on characteristic
        self.platform.log.debug('Updated state to ' + state.execution.mode);
        self.modeTvAccessoryLightBulbService.updateCharacteristic(
          self.Characteristic.On,
          state.execution.mode !== 'powersave' &&
            state.execution.mode !== 'passthrough'
        );

        // Updates the brightness characteristic
        self.platform.log.debug(
          'Updated brightness to ' + state.execution.brightness
        );
        self.modeTvAccessoryLightBulbService.updateCharacteristic(
          self.Characteristic.Brightness,
          Math.round((state.execution.brightness / 200.0) * 100)
        );
      }
    }

    // Updates the corresponding service of the intensity TV accessory
    if (self.intensityTvService) {
      // Updates the on characteristic
      self.platform.log.debug('Updated state to ' + state.execution.mode);
      self.intensityTvService.updateCharacteristic(
        self.Characteristic.Active,
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
      self.platform.log.debug(
        'Updated intensity to ' + state.execution[mode].intensity
      );
      switch (state.execution[mode].intensity) {
        case 'subtle':
          self.intensityTvService.updateCharacteristic(
            self.Characteristic.ActiveIdentifier,
            1
          );
          break;
        case 'moderate':
          self.intensityTvService.updateCharacteristic(
            self.Characteristic.ActiveIdentifier,
            2
          );
          break;
        case 'high':
          self.intensityTvService.updateCharacteristic(
            self.Characteristic.ActiveIdentifier,
            3
          );
          break;
        case 'intense':
          self.intensityTvService.updateCharacteristic(
            self.Characteristic.ActiveIdentifier,
            4
          );
          break;
      }

      // Updates the corresponding service
      if (self.intensityTvAccessoryLightBulbService) {
        // Updates the on characteristic
        self.platform.log.debug('Updated state to ' + state.execution.mode);
        self.intensityTvAccessoryLightBulbService.updateCharacteristic(
          self.Characteristic.On,
          state.execution.mode !== 'powersave' &&
            state.execution.mode !== 'passthrough'
        );

        // Updates the brightness characteristic
        self.platform.log.debug(
          'Updated brightness to ' + state.execution.brightness
        );
        self.intensityTvAccessoryLightBulbService.updateCharacteristic(
          self.Characteristic.Brightness,
          Math.round((state.execution.brightness / 200.0) * 100)
        );
      }
    }

    // Updates the corresponding service of the entertainment area TV accessory
    if (self.entertainmentTvService) {
      // Updates the on characteristic
      self.platform.log.debug('Updated state to ' + state.execution.mode);
      self.entertainmentTvService.updateCharacteristic(
        self.Characteristic.Active,
        state.execution.mode !== 'powersave'
      );

      // Gets the ID of the group based on the index
      let index = 1;
      for (const currentGroupId in self.state.hue.groups) {
        if (currentGroupId === state.hue.groupId) {
          break;
        }

        index++;
      }

      // Updates the input characteristic
      self.entertainmentTvService.updateCharacteristic(
        self.Characteristic.ActiveIdentifier,
        index
      );

      // Updates the corresponding service
      if (self.entertainmentTvAccessoryLightBulbService) {
        // Updates the on characteristic
        self.platform.log.debug('Updated state to ' + state.execution.mode);
        self.entertainmentTvAccessoryLightBulbService.updateCharacteristic(
          self.Characteristic.On,
          state.execution.mode !== 'powersave' &&
            state.execution.mode !== 'passthrough'
        );

        // Updates the brightness characteristic
        self.platform.log.debug(
          'Updated brightness to ' + state.execution.brightness
        );
        self.entertainmentTvAccessoryLightBulbService.updateCharacteristic(
          self.Characteristic.Brightness,
          Math.round((state.execution.brightness / 200.0) * 100)
        );
      }
    }
  }
}
