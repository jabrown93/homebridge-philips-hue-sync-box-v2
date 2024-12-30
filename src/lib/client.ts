import fetch from 'node-fetch';
import { HueSyncBoxPlatform } from '../platform';
import { State } from '../state';
import * as https from 'node:https';

export class SyncBoxClient {
  constructor(private readonly platform: HueSyncBoxPlatform) {}

  public getState(): Promise<State> {
    return this.sendRequest<State>('GET', '');
  }

  public updateExecution(execution: object): Promise<void> {
    return this.sendRequest<void>('PUT', 'execution', execution);
  }

  public updateHue(hue: object): Promise<void> {
    return this.sendRequest<void>('PUT', 'hue', hue);
  }

  private async sendRequest<T>(
    method: string,
    path: string,
    body?: object
  ): Promise<T> {
    const url = `https://${this.platform.config.syncBoxIpAddress}/api/v1/${path}`;
    const options = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.platform.config.syncBoxApiAccessToken}`,
      },
      method,
      body: body ? JSON.stringify(body) : null,
      agent: new https.Agent({ rejectUnauthorized: false }),
    };

    this.platform.log.debug(
      'Request to Sync Box:',
      url,
      JSON.stringify(options)
    );

    const res = await fetch(url, options);
    if (!res.ok) {
      this.platform.log.error(
        `Error: ${res.status} - ${res.statusText}. ${JSON.stringify(await res.json())}`
      );
      throw new Error(`Error: ${res.status} - ${res.statusText}`);
    }
    return res.body ? ((await res.json()) as T) : (null as T);
  }
}
