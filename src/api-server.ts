import http from 'http';
import { HueSyncBoxPlatform } from './platform';
import { State } from './state';

/**
 * Represents the API.
 * @param platform The PhilipsHueSyncBoxPlatform instance.
 */

export class ApiServer {
  private readonly platform: HueSyncBoxPlatform;
  private server?: http.Server;

  constructor(platform: HueSyncBoxPlatform) {
    this.platform = platform;
  }

  public start() {
    // Checks if all required information is provided
    if (!this.platform.config.apiServerPort) {
      this.platform.log.error(
        'API server cannot start due to missing API port.'
      );
      return;
    }
    if (!this.platform.config.apiServerToken) {
      this.platform.log.error(
        'API server cannot start due to missing API token.'
      );
      return;
    }
    // Starts the server
    try {
      this.server = http
        .createServer((request, response) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const payload: any[] = [];

          request
            .on('error', e => {
              this.platform.log.error(
                'API - Error received.',
                JSON.stringify(e)
              );
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on('data', (chunk: any) => {
              payload.push(chunk);
            })
            .on('end', async () => {
              // Subscribes to errors when sending the response
              response.on('error', () => {
                this.platform.log.error('API - Error sending the response.');
              });

              // Validates the token
              if (
                !request.headers['authorization'] ||
                request.headers['authorization'] !==
                  this.platform.config.apiServerToken
              ) {
                this.platform.log.debug(
                  'Authorization header missing or invalid.'
                );
                response.statusCode = 401;
                response.write(JSON.stringify({ error: 'Unauthorized' }));
                response.end();
                return;
              }

              // Performs the action based on the method
              switch (request.method) {
                case 'GET':
                  await this.handleGet(response);
                  return;

                case 'POST':
                  await this.handlePost(payload, response);
                  return;
              }

              this.platform.log.debug('No action matched.');
              response.statusCode = 405;
              response.end();
            });
        })
        .listen(this.platform.config.apiServerPort, '0.0.0.0');
    } catch (e) {
      this.platform.log.error('API could not be started: ' + JSON.stringify(e));
      return;
    }
    this.platform.log.info('API server started.');
  }

  /**
   * Handles GET requests.
   * @param response The response object.
   */
  private async handleGet(response: http.ServerResponse) {
    try {
      this.platform.log.debug('GET request received.');
      const state = await this.platform.client.getState();
      response.setHeader('Content-Type', 'application/json');
      response.write(JSON.stringify(state));
      response.statusCode = 200;
      response.end();
    } catch (e) {
      this.platform.log.error('Error while getting the state.', e);
      response.statusCode = 500;
      response.write(JSON.stringify({ error: e }));
      response.end();
    }
  }

  /**
   * Handles POST requests.
   * @param payload The body of the request.
   * @param response The response object.
   */
  private async handlePost(payload, response: http.ServerResponse) {
    // Validates the body

    // Validates the content
    if (!payload || payload.length === 0) {
      response.statusCode = 400;
      response.write(JSON.stringify({ error: 'Body missing.' }));
      response.end();
      return;
    }
    let body: State | null = null;
    try {
      body = JSON.parse(Buffer.concat(payload).toString());
      if(!body) {
        response.statusCode = 400;
        response.write(JSON.stringify({ error: 'Body missing.' }));
        response.end();
        return;
      }
    } catch (e) {
      this.platform.log.error('Body malformed.', e);
      response.statusCode = 400;
      this.platform.log.error('Error parsing body', e);
      response.end();
      return;
    }

    try {
      if (body.execution) {
        await this.platform.client.updateExecution(body.execution);
      }

      if (body.hue) {
        await this.platform.client.updateHue(body.hue);
      }
      const newState = await this.platform.client.getState();
      response.statusCode = 200;
      response.write(JSON.stringify(newState));
      response.end();
    } catch (e) {
      this.platform.log.error('Error while updating the state.', e);
      response.statusCode = 500;
      response.write(JSON.stringify({ error: e }));
      response.end();
      return;
    }
  }
}
