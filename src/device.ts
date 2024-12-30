import { HueSyncBoxPlatform } from './platform';
import { HdmiInput, State } from './state';
import type { PlatformAccessory, Service, UnknownContext } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

export class SyncBoxDevice {
  private readonly UUIDGen;
  private readonly Accessory;
  private readonly Service;
  private readonly Characteristic;
  private readonly platform: HueSyncBoxPlatform;
  private state: State;
  private externalAccessories: PlatformAccessory[] = [];
  private unusedDeviceAccessories: Map<string, PlatformAccessory>;
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
  private readonly _music = 'music';
  private readonly _game = 'game';
  private readonly _lightbulb = 'lightbulb';
  private readonly _switch = 'switch';

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
    let switchAccessory;
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
    const tvAccessory = this.getTcAccessory();

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
          this.state.device.firmwareVersion
        );

      // Applies a custom serial number as otherwise issues with matching in HomeKit could occur
      if (deviceAccessory.context.kind === 'TVAccessory') {
        accessoryInformationService.setCharacteristic(
          this.Characteristic.SerialNumber,
          this.state.device.uniqueId + '-T'
        );
      } else if (deviceAccessory.context.kind === 'ModeTVAccessory') {
        accessoryInformationService.setCharacteristic(
          this.Characteristic.SerialNumber,
          this.state.device.uniqueId + '-M'
        );
      } else if (deviceAccessory.context.kind === 'IntensityTVAccessory') {
        accessoryInformationService.setCharacteristic(
          this.Characteristic.SerialNumber,
          this.state.device.uniqueId + '-I'
        );
      } else if (deviceAccessory.context.kind === 'EntertainmentTVAccessory') {
        accessoryInformationService.setCharacteristic(
          this.Characteristic.SerialNumber,
          this.state.device.uniqueId + '-E'
        );
      } else {
        accessoryInformationService.setCharacteristic(
          this.Characteristic.SerialNumber,
          this.state.device.uniqueId
        );
      }
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

  private handleTv(tvAccessory: PlatformAccessory) {
    if (tvAccessory) {
      // Updates tv service
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
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              this.mainAccessory.context.tvAccessoryConfiguredName = value;
              callback(null);
            });
        } else {
          tvService.setCharacteristic(
            this.Characteristic.ConfiguredName,
            this.state.device.name
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
              this.platform.log.debug('Switch state is already ON');
            } else {
              this.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            this.platform.log.debug('Switch state to ON');
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
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  this.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            this.platform.log.debug('Switch state to OFF');
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: this.platform.config.defaultOffMode,
                })
                .catch(() => {
                  this.platform.log.debug(
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
        .getCharacteristic(this.Characteristic.ActiveIdentifier)
        .on('set', (value, callback) => {
          // Saves the changes
          this.platform.log.debug('Switch hdmi source to input' + value);
          this.platform.limiter.schedule(() => {
            return this.platform.client
              .updateExecution({
                hdmiSource: 'input' + value,
              })
              .catch(() => {
                this.platform.log.debug(
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
          this.platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case this.Characteristic.RemoteKey.ARROW_UP:
              this.platform.log.debug('Increase brightness by 25%');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    brightness: Math.min(
                      200,
                      this.state.execution.brightness + 50
                    ),
                  })
                  .catch(() => {
                    this.platform.log.debug(
                      'Failed to increase brightness by 25%'
                    );
                  });
              });
              break;

            case this.Characteristic.RemoteKey.ARROW_DOWN:
              this.platform.log.debug('Decrease brightness by 25%');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    brightness: Math.max(
                      0,
                      this.state.execution.brightness - 50
                    ),
                  })
                  .catch(() => {
                    this.platform.log.debug(
                      'Failed to increase brightness by 25%'
                    );
                  });
              });
              break;

            case this.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = this._video;
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'subtle',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = this._video;
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'moderate':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'intense',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.SELECT:
              this.platform.log.debug('Toggle mode');
              switch (this.state.execution.mode) {
                case this._video:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._music })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._music:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._game })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._game:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        mode: this._passthrough,
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._passthrough:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._video })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.PLAY_PAUSE:
              this.platform.log.debug('Toggle switch state');
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                this.platform.limiter
                  .schedule(() => {
                    return this.platform.client.updateExecution({
                      mode: this.platform.config.defaultOffMode,
                    });
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to toggle switch state');
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
                this.platform.limiter.schedule(() => {
                  return this.platform.client
                    .updateExecution({
                      mode: onMode,
                    })
                    .catch(() => {
                      this.platform.log.debug('Failed to toggle switch state');
                    });
                });
              }
              break;

            case this.Characteristic.RemoteKey.INFORMATION:
              this.platform.log.debug('Toggle hdmi source');
              switch (this.state.execution.hdmiSource) {
                case 'input1':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input2',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input2':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input3',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input3':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input4',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input4':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input1',
                      })
                      .catch(() => {
                        this.platform.log.debug(
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
      this.tvService = tvService;

      // Handles the lightbulb accessory if it is enabled
      if (this.platform.config.tvAccessoryLightbulb) {
        // Updates the light bulb service

        let tvAccessoryLightBulbService = tvAccessory.getServiceById(
          this.Service.Lightbulb,
          'TV'
        );
        if (!tvAccessoryLightBulbService) {
          tvAccessoryLightBulbService = tvAccessory.addService(
            this.Service.Lightbulb,
            'TV',
            'TV'
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
                this.platform.log.debug('Switch state is already ON');
              } else {
                this.platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              this.platform.log.debug('Switch state to ON');
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
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    mode: onMode,
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to switch state to ON');
                  });
              });
            } else {
              this.platform.log.debug('Switch state to OFF');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    mode: this.platform.config.defaultOffMode,
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to switch state to OFF');
                  });
              });
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        tvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            this.platform.log.debug('Switch brightness to ' + value);
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                })
                .catch(() => {
                  this.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });

            // Performs the callback
            callback(null);
          });
      }
    }
  }

  private handleModeTv(modeTvAccessory) {
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
              this.state.device.name
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
            this.state.device.name
          );
        }
      }

      // Register mode input sources
      const modeInputServices: Service[] = [];
      const modes = [
        'none',
        this._video,
        this._music,
        this._game,
        this._passthrough,
      ];
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
              this.platform.log.debug('Switch state is already ON');
            } else {
              this.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            this.platform.log.debug('Switch state to ON');
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
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  this.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            this.platform.log.debug('Switch state to OFF');
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: this.platform.config.defaultOffMode,
                })
                .catch(() => {
                  this.platform.log.debug(
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
        .getCharacteristic(this.Characteristic.ActiveIdentifier)
        .on('set', (value, callback) => {
          // Saves the changes
          let mode = '';
          switch (value) {
            case 1:
              mode = this._video;
              break;
            case 2:
              mode = this._music;
              break;
            case 3:
              mode = this._game;
              break;
            case 4:
              mode = this._passthrough;
              break;
          }
          this.platform.log.debug('Switch mode to ' + mode);
          this.platform.limiter.schedule(() => {
            return this.platform.client
              .updateExecution({
                mode: mode,
              })
              .catch(() => {
                this.platform.log.debug('Failed to switch mode to ' + mode);
              });
          });

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
          this.platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case this.Characteristic.RemoteKey.ARROW_UP:
              this.platform.log.debug('Increase brightness by 25%');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    brightness: Math.min(
                      200,
                      this.state.execution.brightness + 50
                    ),
                  })
                  .catch(() => {
                    this.platform.log.debug(
                      'Failed to increase brightness by 25%'
                    );
                  });
              });
              break;

            case this.Characteristic.RemoteKey.ARROW_DOWN:
              this.platform.log.debug('Decrease brightness by 25%');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    brightness: Math.max(
                      0,
                      this.state.execution.brightness - 50
                    ),
                  })
                  .catch(() => {
                    this.platform.log.debug(
                      'Failed to decrease brightness by 25%'
                    );
                  });
              });
              break;

            case this.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = this._video;
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'subtle',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = this._video;
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'moderate':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'intense',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.SELECT:
              this.platform.log.debug('Toggle mode');
              switch (this.state.execution.mode) {
                case this._video:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._music })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._music:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._game })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._game:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        mode: this._passthrough,
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._passthrough:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._video })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.PLAY_PAUSE:
              this.platform.log.debug('Toggle switch state');
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                this.platform.limiter
                  .schedule(() => {
                    return this.platform.client.updateExecution({
                      mode: this.platform.config.defaultOffMode,
                    });
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to toggle switch state');
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
                this.platform.limiter
                  .schedule(() => {
                    return this.platform.client.updateExecution({
                      mode: onMode,
                    });
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to toggle switch state');
                  });
              }
              break;

            case this.Characteristic.RemoteKey.INFORMATION:
              this.platform.log.debug('Toggle hdmi source');
              switch (this.state.execution.hdmiSource) {
                case 'input1':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input2',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input2':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input3',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input3':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input4',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input4':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input1',
                      })
                      .catch(() => {
                        this.platform.log.debug(
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
      this.modeTvService = modeTvService;

      // Handles the lightbulb accessory if it is enabled
      if (this.platform.config.modeTvAccessoryLightbulb) {
        // Updates the light bulb service

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
                this.platform.log.debug('Switch state is already ON');
              } else {
                this.platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              this.platform.log.debug('Switch state to ON');
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
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    mode: onMode,
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to switch state to ON');
                  });
              });
            } else {
              this.platform.log.debug('Switch state to OFF');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    mode: this.platform.config.defaultOffMode,
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to switch state to OFF');
                  });
              });
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        modeTvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            this.platform.log.debug('Switch brightness to ' + value);
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                })
                .catch(() => {
                  this.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });

            // Performs the callback
            callback(null);
          });
      }
    }
  }

  private handleIntensityTv(intensityTvAccessory) {
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
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              this.mainAccessory.context.intensityTvAccessoryConfiguredName =
                value;
              callback(null);
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
              this.platform.log.debug('Switch state is already ON');
            } else {
              this.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            this.platform.log.debug('Switch state to ON');
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
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  this.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            this.platform.log.debug('Switch state to OFF');
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: this.platform.config.defaultOffMode,
                })
                .catch(() => {
                  this.platform.log.debug(
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
          this.platform.log.debug('Switch intensity to ' + intensity);
          this.platform.limiter.schedule(() => {
            return this.platform.client
              .updateExecution({
                intensity: intensity,
              })
              .catch(() => {
                this.platform.log.debug(
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
          this.platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case this.Characteristic.RemoteKey.ARROW_UP:
              this.platform.log.debug('Increase brightness by 25%');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    brightness: Math.min(
                      200,
                      this.state.execution.brightness + 50
                    ),
                  })
                  .catch(() => {
                    this.platform.log.debug(
                      'Failed to increase brightness by 25%'
                    );
                  });
              });
              break;

            case this.Characteristic.RemoteKey.ARROW_DOWN:
              this.platform.log.debug('Decrease brightness by 25%');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    brightness: Math.max(
                      0,
                      this.state.execution.brightness - 50
                    ),
                  })
                  .catch(() => {
                    this.platform.log.debug(
                      'Failed to decrease brightness by 25%'
                    );
                  });
              });
              break;

            case this.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = this._video;
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'subtle',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = this._video;
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'moderate':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'intense',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.SELECT:
              this.platform.log.debug('Toggle mode');
              switch (this.state.execution.mode) {
                case this._video:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._music })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._music:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._game })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._game:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        mode: this._passthrough,
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._passthrough:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._video })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.PLAY_PAUSE:
              this.platform.log.debug('Toggle switch state');
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                this.platform.limiter
                  .schedule(() => {
                    return this.platform.client.updateExecution({
                      mode: this.platform.config.defaultOffMode,
                    });
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to toggle switch state');
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
                this.platform.limiter
                  .schedule(() => {
                    return this.platform.client.updateExecution({
                      mode: onMode,
                    });
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to toggle switch state');
                  });
              }
              break;

            case this.Characteristic.RemoteKey.INFORMATION:
              this.platform.log.debug('Toggle hdmi source');
              switch (this.state.execution.hdmiSource) {
                case 'input1':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input2',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input2':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input3',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input3':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input4',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input4':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input1',
                      })
                      .catch(() => {
                        this.platform.log.debug(
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
      this.intensityTvService = intensityTvService;

      // Handles the lightbulb accessory if it is enabled
      if (this.platform.config.intensityTvAccessoryLightbulb) {
        // Updates the light bulb service
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
                this.platform.log.debug('Switch state is already ON');
              } else {
                this.platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              this.platform.log.debug('Switch state to ON');
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
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    mode: onMode,
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to switch state to ON');
                  });
              });
            } else {
              this.platform.log.debug('Switch state to OFF');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    mode: this.platform.config.defaultOffMode,
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to switch state to OFF');
                  });
              });
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        intensityTvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            this.platform.log.debug('Switch brightness to ' + value);
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                })
                .catch(() => {
                  this.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });

            // Performs the callback
            callback(null);
          });
      }
    }
  }

  private handleEntertainmentTv(entertainmentTvAccessory) {
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
            .on('set', (value, callback) => {
              // @ts-expect-error already checked
              this.mainAccessory.context.entertainmentTvAccessoryConfiguredName =
                value;
              callback(null);
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
              this.platform.log.debug('Switch state is already ON');
            } else {
              this.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            this.platform.log.debug('Switch state to ON');
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
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  this.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            this.platform.log.debug('Switch state to OFF');
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: this.platform.config.defaultOffMode,
                })
                .catch(() => {
                  this.platform.log.debug(
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

          // @ts-expect-error need to use self as a key
          const group = this.state.hue.groups[groupId];

          // Saves the changes
          this.platform.log.debug('Switch entertainment area to ' + group.name);
          this.platform.limiter.schedule(() => {
            return this.platform.client
              .updateHue({
                groupId: groupId,
              })
              .catch(() => {
                this.platform.log.debug(
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
          this.platform.log.debug('Remote key pressed: ' + value);

          let mode;
          switch (value) {
            case this.Characteristic.RemoteKey.ARROW_UP:
              this.platform.log.debug('Increase brightness by 25%');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    brightness: Math.min(
                      200,
                      this.state.execution.brightness + 50
                    ),
                  })
                  .catch(() => {
                    this.platform.log.debug(
                      'Failed to increase brightness by 25%'
                    );
                  });
              });
              break;

            case this.Characteristic.RemoteKey.ARROW_DOWN:
              this.platform.log.debug('Decrease brightness by 25%');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    brightness: Math.max(
                      0,
                      this.state.execution.brightness - 50
                    ),
                  })
                  .catch(() => {
                    this.platform.log.debug(
                      'Failed to decrease brightness by 25%'
                    );
                  });
              });
              break;

            case this.Characteristic.RemoteKey.ARROW_LEFT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = this._video;
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  break;
                case 'moderate':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'subtle',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.ARROW_RIGHT:
              // Gets the current mode or the last sync mode to set the intensity
              mode = this._video;
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                mode = this.state.execution.mode;
              } else if (this.state.execution.lastSyncMode) {
                mode = this.state.execution.lastSyncMode;
              }

              this.platform.log.debug('Toggle intensity');
              switch (this.state.execution[mode].intensity) {
                case 'subtle':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'moderate',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'moderate':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'high',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'high':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        intensity: 'intense',
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle intensity');
                      });
                  });
                  break;
                case 'intense':
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.SELECT:
              this.platform.log.debug('Toggle mode');
              switch (this.state.execution.mode) {
                case this._video:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._music })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._music:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._game })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._game:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        mode: this._passthrough,
                      })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
                case this._passthrough:
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({ mode: this._video })
                      .catch(() => {
                        this.platform.log.debug('Failed to toggle mode');
                      });
                  });
                  break;
              }
              break;

            case this.Characteristic.RemoteKey.PLAY_PAUSE:
              this.platform.log.debug('Toggle switch state');
              if (
                this.state.execution.mode !== this._powersave &&
                this.state.execution.mode !== this._passthrough
              ) {
                this.platform.limiter
                  .schedule(() => {
                    return this.platform.client.updateExecution({
                      mode: this.platform.config.defaultOffMode,
                    });
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to toggle switch state');
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
                this.platform.limiter
                  .schedule(() => {
                    return this.platform.client.updateExecution({
                      mode: onMode,
                    });
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to toggle switch state');
                  });
              }
              break;

            case this.Characteristic.RemoteKey.INFORMATION:
              this.platform.log.debug('Toggle hdmi source');
              switch (this.state.execution.hdmiSource) {
                case 'input1':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input2',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input2':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input3',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input3':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input4',
                      })
                      .catch(() => {
                        this.platform.log.debug(
                          'Failed to toggle switch hdmi source'
                        );
                      });
                  });
                  break;
                case 'input4':
                  this.platform.limiter.schedule(() => {
                    return this.platform.client
                      .updateExecution({
                        hdmiSource: 'input1',
                      })
                      .catch(() => {
                        this.platform.log.debug(
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
      this.entertainmentTvService = entertainmentTvService;

      // Handles the lightbulb accessory if it is enabled
      if (this.platform.config.entertainmentTvAccessoryLightbulb) {
        // Updates the light bulb service
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
                this.platform.log.debug('Switch state is already ON');
              } else {
                this.platform.log.debug('Switch state is already OFF');
              }
              callback(null);
              return;
            }

            // Saves the changes
            if (value) {
              this.platform.log.debug('Switch state to ON');
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
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    mode: onMode,
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to switch state to ON');
                  });
              });
            } else {
              this.platform.log.debug('Switch state to OFF');
              this.platform.limiter.schedule(() => {
                return this.platform.client
                  .updateExecution({
                    mode: this.platform.config.defaultOffMode,
                  })
                  .catch(() => {
                    this.platform.log.debug('Failed to switch state to OFF');
                  });
              });
            }

            // Performs the callback
            callback(null);
          });

        // Subscribes for changes of the brightness characteristic
        entertainmentTvAccessoryLightBulbService
          .getCharacteristic(this.Characteristic.Brightness)
          .on('set', (value, callback) => {
            // Saves the changes
            this.platform.log.debug('Switch brightness to ' + value);
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  brightness: Math.round(((value as number) / 100.0) * 200),
                })
                .catch(() => {
                  this.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });

            // Performs the callback
            callback(null);
          });
      }
    }
  }

  private handleSwitch(
    switchAccessory: PlatformAccessory<UnknownContext> | null
  ) {
    // Handles the switch accessory if it is enabled
    if (switchAccessory) {
      // Updates the switch service
      let switchService = switchAccessory.getServiceById(
        this.Service.Switch,
        this._switch
      );
      if (!switchService) {
        switchService = switchAccessory.addService(
          this.Service.Switch,
          this._switch,
          this._switch
        );
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
              this.platform.log.debug('Switch state is already ON');
            } else {
              this.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            this.platform.log.debug('Switch state to ON');
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
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  this.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            this.platform.log.debug('Switch state to OFF');
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: this.platform.config.defaultOffMode,
                })
                .catch(() => {
                  this.platform.log.debug(
                    'Failed to switch brightness to ' + value
                  );
                });
            });
          }

          // Performs the callback
          callback(null);
        });
    }
  }

  private handleLightBulb(
    lightBulbAccessory: PlatformAccessory<UnknownContext> | null
  ) {
    if (lightBulbAccessory) {
      // Updates the light bulb service
      let lightBulbService = lightBulbAccessory.getServiceById(
        this.Service.Lightbulb,
        this._lightbulb
      );
      if (!lightBulbService) {
        lightBulbService = lightBulbAccessory.addService(
          this.Service.Lightbulb,
          this._lightbulb,
          this._lightbulb
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
              this.platform.log.debug('Switch state is already ON');
            } else {
              this.platform.log.debug('Switch state is already OFF');
            }
            callback(null);
            return;
          }

          // Saves the changes
          if (value) {
            this.platform.log.debug('Switch state to ON');
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
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: onMode,
                })
                .catch(() => {
                  this.platform.log.debug('Failed to switch state to ON');
                });
            });
          } else {
            this.platform.log.debug('Switch state to OFF');
            this.platform.limiter.schedule(() => {
              return this.platform.client
                .updateExecution({
                  mode: this.platform.config.defaultOffMode,
                })
                .catch(() => {
                  this.platform.log.debug('Failed to switch state to OFF');
                });
            });
          }

          // Performs the callback
          callback(null);
        });

      // Subscribes for changes of the brightness characteristic
      lightBulbService
        .getCharacteristic(this.Characteristic.Brightness)
        .on('set', (value, callback) => {
          // Saves the changes
          this.platform.log.debug('Switch brightness to ' + value);
          this.platform.limiter.schedule(() => {
            return this.platform.client
              .updateExecution({
                brightness: Math.round(((value as number) / 100.0) * 200),
              })
              .catch(() => {
                this.platform.log.debug(
                  'Failed to switch brightness to ' + value
                );
              });
          });

          // Performs the callback
          callback(null);
        });
    }
  }

  private getEntertainmentTvAccssory() {
    let entertainmentTvAccessory;
    if (this.platform.config.entertainmentTvAccessory) {
      this.platform.log.debug(
        'Adding new accessory with kind EntertainmentTVAccessory.'
      );
      entertainmentTvAccessory = new this.Accessory(
        this.state.device.name,
        this.UUIDGen.generate('EntertainmentTVAccessory')
      );
      switch (this.platform.config.entertainmentTvAccessoryType) {
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
    return entertainmentTvAccessory;
  }

  private getIntensityTvAccessory() {
    let intensityTvAccessory;
    if (this.platform.config.intensityTvAccessory) {
      this.platform.log.debug(
        'Adding new accessory with kind IntensityTVAccessory.'
      );
      intensityTvAccessory = new this.Accessory(
        this.state.device.name,
        this.UUIDGen.generate('IntensityTVAccessory')
      );
      switch (this.platform.config.intensityTvAccessoryType) {
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
    return intensityTvAccessory;
  }

  private getModeTvAccessory() {
    let modeTvAccessory;
    if (this.platform.config.modeTvAccessory) {
      this.platform.log.debug(
        'Setting up accessory with kind ModeTVAccessory.'
      );
      modeTvAccessory = new this.Accessory(
        this.state.device.name,
        this.UUIDGen.generate('ModeTVAccessory')
      );
      switch (this.platform.config.modeTvAccessoryType) {
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
    return modeTvAccessory;
  }

  private getTcAccessory() {
    let tvAccessory;
    if (this.platform.config.tvAccessory) {
      this.platform.log.debug('Setting up accessory with kind TVAccessory.');
      tvAccessory = new this.Accessory(
        this.state.device.name,
        this.UUIDGen.generate('TVAccessory')
      );
      switch (this.platform.config.tvAccessoryType) {
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
    return tvAccessory;
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
      switch (state.execution.mode) {
        case this._video:
          this.modeTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            1
          );
          break;
        case this._music:
          this.modeTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            2
          );
          break;
        case this._game:
          this.modeTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            3
          );
          break;
        case this._passthrough:
          this.modeTvService.updateCharacteristic(
            this.Characteristic.ActiveIdentifier,
            4
          );
          break;
      }

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
      let mode = this._video;
      if (
        this.state.execution.mode !== this._powersave &&
        this.state.execution.mode !== this._passthrough
      ) {
        mode = this.state.execution.mode;
      } else if (state.execution.lastSyncMode) {
        mode = this.state.execution.lastSyncMode;
      }

      // Updates the intensity input characteristic
      this.platform.log.debug(
        'Updated intensity to ' + this.state.execution[mode].intensity
      );
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
