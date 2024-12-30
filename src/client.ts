import fetch from 'node-fetch';
import { HueSyncBoxPlatform } from './platform';
import { State } from './state';
import * as https from 'node:https';

export class SyncBoxClient {
  private readonly platform: HueSyncBoxPlatform;

  constructor(platform: HueSyncBoxPlatform) {
    this.platform = platform;
  }

  public async getState(): Promise<State> {
    return this.sendRequest<State>('GET', '');
  }

  public async updateExecution(execution: object): Promise<void> {
    return this.sendRequest<void>('PUT', 'execution', execution);
  }

  public async updateHue(hue: object): Promise<void> {
    return this.sendRequest<void>('PUT', 'hue', hue);
  }

  private async sendRequest<T>(
    method: string,
    path: string,
    body?: object
  ): Promise<T> {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    const url = `https://${this.platform.config.syncBoxIpAddress}/api/v1/${path}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.platform.config.syncBoxApiAccessToken}`,
    };

    const options = {
      headers,
      method,
      body: body ? JSON.stringify(body) : null,
      agent: httpsAgent,
    };
    this.platform.log.debug('Request to Sync Box:', url, JSON.stringify(options));

    return fetch(url, options)
      .then(res => {
        if (!res.ok) {
          this.platform.log.error(
            `Error: ${res.status} - ${res.statusText}. ${JSON.stringify(res.json())} `
          );
          throw new Error(`Error: ${res.status} - ${res.statusText}`);
        }
        if (res.body) {
          return res.json() as T;
        }
        return null as T;
      })
      .catch(error => {
        this.platform.log.error('Error:', error);
        throw error;
      });
  }
}
