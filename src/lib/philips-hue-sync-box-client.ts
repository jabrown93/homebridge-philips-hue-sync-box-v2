import fetch from 'node-fetch';
import { HueSyncBoxPlatform } from '../platform';
import {  Hue, State } from './state';

export class PhilipsHueSyncBoxClient {
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

  private async sendRequest<T>(method: string, path: string, body?: object): Promise<T> {
    const url = `https://${this.platform.config.ip}/api/v1/${path}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization:  this.platform.config.syncBoxApiAccessToken,
    };

    const options = {
      headers,
      method,
      body: body ? JSON.stringify(body) : null,
    };

    return fetch(url, options).then((res) => {
      if(!res.ok){
        this.platform.log.error(`Error: ${res.status} - ${res.statusText}. ${JSON.stringify(res.json())} `);
        throw new Error(`Error: ${res.status} - ${res.statusText}`);
      }
      if(res.body){
        return res.json() as T;
      }
      return null as T;
    }).catch((error) => {
      this.platform.log.error('Error:', error);
      throw error;
    });
  }

}
