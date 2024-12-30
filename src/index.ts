import type { API, PlatformPluginConstructor } from 'homebridge';

import { HueSyncBoxPlatform } from './platform.js';
import { PLATFORM_NAME } from './settings.js';

/**
 * This method registers the platform with Homebridge
 */
export default (api: API) => {
  console.log("testing")
  api.registerPlatform(PLATFORM_NAME, HueSyncBoxPlatform as unknown as PlatformPluginConstructor);
};
