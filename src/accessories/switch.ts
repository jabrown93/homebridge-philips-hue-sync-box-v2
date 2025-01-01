import type {
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';

import { HueSyncBoxPlatform } from '../platform';
import { State } from '../state';
import { SyncBoxClient } from '../lib/client';
import { BaseHueSyncBoxDevice } from './base';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class SwitchDevice extends BaseHueSyncBoxDevice {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */

  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected client: SyncBoxClient,
    protected state: State
  ) {
    super(platform, accessory, client, state);
    const accessoryInformationService =
      this.accessory.getService(this.platform.Service.AccessoryInformation) ||
      this.accessory.addService(this.platform.Service.AccessoryInformation);

    accessoryInformationService
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Philips')
      .setCharacteristic(this.platform.Characteristic.Model, 'Sync Box Test')
      .setCharacteristic(
        this.platform.Characteristic.FirmwareRevision,
        this.state.device.firmwareVersion
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.state.device.uniqueId
      );

    this.service =
      this.accessory.getService(this.platform.Service.Switch) ||
      this.accessory.addService(this.platform.Service.Switch);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.displayName
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)); // SET - bind to the `setOn` method below

    /**
     * Updating characteristics values asynchronously.
     *
     * Example showing how to update the state of a Characteristic asynchronously instead
     * of using the `on('get')` handlers.
     * Here we change update the motion sensor trigger states on and off every 10 seconds
     * the `updateCharacteristic` method.
     *
     */
    // this.update();
    // setInterval(() => {
    //   this.platform.log.debug('Updating characteristics');
    //   return this.update();
    // }, 10000);
  }

  public update(state: State) {
    // Updates the on characteristic
    this.state = state;
    this.platform.log.debug('Updated state to ' + this.state.execution.mode);
    this.service.updateCharacteristic(
      this.platform.Characteristic.On,
      this.state.execution.mode !== 'powersave' &&
        this.state.execution.mode !== 'passthrough'
    );
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  setOn(value: CharacteristicValue) {
    this.platform.log.debug('Set On ->', value);
    const currentVal = this.service.getCharacteristic(
      this.platform.Characteristic.On
    ).value;
    return this.updateMode(currentVal, value);
  }
}
