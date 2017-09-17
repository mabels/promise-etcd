import * as request from 'request';
import Config from './config';
import ChangeWaiter from './change-waiter';
import SelfState from './self-state';
import EtcResponse from './etc-response';
import EtcValue from './etc-value';
import EtcValueNode from './etc-value-node';
import Dispatcher from './dispatcher';

import * as rx from 'rxjs';

export class EtcdObserable {
  public cfg: Config;
  private connected?: SelfState = null;

  private selfStateInActions: { [id: string]: Dispatcher<SelfState>[] } = {};

  public static create(cfg: Config): EtcdObserable {
    return new EtcdObserable(cfg);
  }

  constructor(cfg: Config) {
    this.cfg = cfg;
  }

  private request(method: string, url: string, options: any = {}): rx.Observable<any> {
    return rx.Observable.create((ob: rx.Observer<any>) => {
      this.connect().subscribe((c) => {
        if (!c.isOk()) {
          this.cfg.log.error('Request-REJECT no valid connection');
          ob.error(c);
          return;
        }
        const mkUrl = `${c.url}${url}`;
        const req = this.rawRequest(method, mkUrl, options);
        const bodies: string[] = [];
        req.on('data', (data: string | Buffer) => {
          bodies.push(data.toString());
        });
        req.on('complete', (resp) => {
          const body = bodies.join('');
          try {
            const jsbody = JSON.parse(body);
            if (jsbody.errorCode) {
              this.cfg.log.debug('request:complete:error:', jsbody);
              ob.error({ respond: resp, err: jsbody });
            } else {
              this.cfg.log.debug('request:complete:ok:', method, mkUrl, options, body, resp.headers, resp.statusCode);
              ob.next(jsbody);
              ob.complete();
            }
          } catch (e) {
            this.cfg.log.debug(`request:complete:catch:error:[${body}]:`,
              method, mkUrl, options, resp.headers, resp.statusCode, e);
            ob.error({ respond: resp, body: body, e: e });
          }
        });
        req.on('error', (e: Error) => {
          this.cfg.log.debug('request:error:', method, mkUrl, options, e);
          ob.error(e);
        });
        // on(event: 'request', listener: (req: http.ClientRequest) => void): this;
        // on(event: 'response', listener: (resp: http.IncomingMessage) => void): this;
        // on(event: 'data', listener: (data: Buffer | string) => void): this;
        // on(event: 'complete', listener: (resp: http.IncomingMessage, body?: string | Buffer) => void): this;
      }, (e: any) => {
        this.cfg.log.debug('request:error:', method, options, e);
        ob.error(e);
      }, () => {
        // ob.complete();
      });
    });

    // try {
    //   return new Promise<any>((resolve, reject) => {

    //   });
    // } catch (e) {
    //   if (e.name == 'StatusCodeError') {
    //     return Promise.reject(e);
    //   }
    //   this.cfg.log.error('Reconnected:', typeof e, e.name, e);
    //   this.connected = null; // reconnect etcd
    //   return this.request(method, url, options);
    // }
  }

  private rawRequest(method: string, url: string, options: any = {}): request.Request {
    let my = {
      method: method,
      timeout: this.cfg.reqTimeout,
      uri: url
    };
    options = Object.assign(my, options);
    return request(options);
  }

  private urlParams(params: any, sep = ''): string {
    let paramsStr = '';
    for (let key in params) {
      paramsStr += `${sep}${key}=${params[key]}`;
      sep = '&';
    }
    return paramsStr;
  }

  private bodyParams(params: any): any {
    return {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: this.urlParams(params)
    };
  }

  private buildKeyUri(base: string, key: string): string {
    let url: string;
    let app: string = this.cfg.appId || '';
    if (app.length != 0) {
      app += '/';
    }
    if (this.cfg.clusterId) {
      url = `${base}/${app}${this.cfg.clusterId}/${key}`;
    } else {
      url = `${base}/${app}${key}`;
    }
    return url;
  }

  public untilFirstConnect(): rx.Observable<SelfState[]> {
    return rx.Observable.create((ob: rx.Observer<SelfState[]>) => {
      const result: SelfState[] = [];
      // console.log('untilFirstConnect:', this.cfg.urls);
      const merged = rx.Observable.merge(
        ...this.cfg.urls.map(url => this.selfStat(url))
      ).subscribe(a => {
        // console.log('untilFirstConnect:a:', a);
        result.push(a);
        if (a.isOk()) {
          ob.next(result);
          ob.complete();
          merged.unsubscribe();
        } else if (result.length == this.cfg.urls.length) {
          ob.next(result);
          ob.complete();
        }
      }, null, () => {
        // console.log('untilFirstConnect:completed:');
        ob.next(result);
        ob.complete();
      });
    });
    // filter(a => a.isOk()).first();

    // return rx.Observable.create((observer: rx.Observer<SelfState[]>) => {
    //   let resolved = false;
    //   let result: SelfState[] = [];
    //   this.cfg.urls.forEach((url) => {
    //     this.selfStat(url).then((value) => {
    //       if (resolved) { return; }
    //       result.push(value);
    //       if (value.isOk()) {
    //         resolved = true;
    //         res(result);
    //       } else {
    //         if (result.length == this.cfg.urls.length) {
    //           resolved = true;
    //           res(result);
    //         }
    //       }
    //     });
    //   });
    // });
  }
  private retryConnect(obs: rx.Observer<SelfState>, retry: number): void {
    // console.log('retryConnect:', retry);
    if (retry > this.cfg.retries) {
      obs.next(SelfState.error('all', []));
      obs.complete();
      return;
    }
    this.untilFirstConnect().subscribe((ret) => {
      // console.log('retryConnect:untilFirstConnect:', retry, ret);
      let foundOk = ret.find((s2) => s2.isOk());
      if (foundOk) {
        this.connected = foundOk;
        obs.next(foundOk);
        obs.complete();
        return;
      }
      this.cfg.log.info('Retry-Connect:', this.connected, retry, this.cfg.retries, this.cfg.waitTime);
      setTimeout(() => this.retryConnect(obs, retry + 1), this.cfg.waitTime);
    });
  }

  public connect(): rx.Observable<SelfState> {
    if (!this.connected) {
      return rx.Observable.create((obs: rx.Observer<SelfState>) => {
        this.retryConnect(obs, 0);
      });
    } else {
      return rx.Observable.create((obs: rx.Observer<SelfState>) => {
        obs.next(this.connected);
        obs.complete();
      });
    }
  }

  public clusterState(): rx.Observable<SelfState[]> {
    // console.log('this.cfg.urls:', this.cfg.urls)
    return rx.Observable.zip(...this.cfg.urls.map((url) => this.selfStat(url)));
  }

  private resolvSelfStateInActions(url: string, s2: SelfState): SelfState {
    let local = this.selfStateInActions[url];
    delete this.selfStateInActions[url];
    local.slice(1).forEach((ssia) => {
      ssia.resolve(s2);
    });
    return s2;
  }

  public selfStat(url: string): rx.Observable<SelfState> {
    // console.log('selfStat:', url);
    if (!this.selfStateInActions[url]) {
      this.selfStateInActions[url] = [];
    }
    let dispatcher = Dispatcher.create<SelfState>();
    this.selfStateInActions[url].push(dispatcher);
    if (this.selfStateInActions[url].length > 1) {
      // console.log('selfStat-Double:', url);
      return dispatcher.subject;
    }
    return rx.Observable.create((obs: rx.Observer<SelfState>) => {
      // console.log('selfStat-create:', url);
      const ret = this.rawRequest('GET', `${url}/v2/stats/self`);
      ret.on('error', (err: Error) => {
        // console.log('selfStat-create:error:', url);
        obs.next(this.resolvSelfStateInActions(url, SelfState.error(url, err)));
        obs.complete();
      });
      const bodies: string[] = [];
      ret.on('data', (data: string | Buffer) => {
        bodies.push(data.toString());
      });
      ret.on('complete', (resp) => {
        const body = bodies.join('');
        // console.log('selfStat-create:complete:', url, body);
        // this.cfg.log.info('complete', body);
        obs.next(this.resolvSelfStateInActions(url, SelfState.ok(url, body)));
        obs.complete();
      });
    });
  }

  private keyAction(method: string, key: string, options: any = {}): rx.Observable<EtcResponse> {
    let uri = this.buildKeyUri('/v2/keys', key);
    this.cfg.log.debug('keyAction', method, uri, options);
    return rx.Observable.create((obs: rx.Observer<EtcResponse>) => {
      this.request(method, uri, options).subscribe((ret) => {
        // console.log('keyAction:ret:');
        obs.next(EtcResponse.fromJson(ret));
        obs.complete();
      }, (err) => {
        // console.log('keyAction:err:');
        obs.next(EtcResponse.error(err));
        obs.complete();
      });
    });
  }

  public update(key: string, ttl: number): rx.Observable<EtcResponse> {
    return this.keyAction('PUT', key, this.bodyParams({
      'ttl': ttl,
      'refresh': true,
      'prevExist': true
    }));
  }

  public addQueue(key: string, val: string, ttl: number): rx.Observable<EtcResponse> {
    return this.keyAction('POST', key, this.bodyParams({ 'value': val, 'ttl': ttl }));
  }

  public mkdir(key: string): rx.Observable<EtcResponse> {
    return this.keyAction('PUT', key, this.bodyParams({ dir: true }));
  }
  public rmdir(key: string, params: any = {}): rx.Observable<EtcResponse> {
    return this.keyAction('DELETE',
      `${key}${this.urlParams(Object.assign({ dir: true }, params), '?')}`);
  }

  public delete(key: string): rx.Observable<EtcResponse> {
    return this.keyAction('DELETE', key);
  }

  public list(key: string, params: any = {}): rx.Observable<EtcValue<EtcValueNode[]>> {
    // console.log('list:', `${key}${this.urlParams(params, '?')}`)
    return rx.Observable.create((obs: rx.Observer<EtcValue<EtcValueNode[]>>) => {
      this.keyAction('GET', `${key}${this.urlParams(params, '?')}`).subscribe((list) => {
        if (list.isErr()) {
          obs.next(EtcValue.error<EtcValueNode[]>(list));
        }
        if (!list.node.dir) {
          obs.next(EtcValue.error<EtcValueNode[]>('not a directory'));
        } else {
          obs.next(EtcValue.value(list.node.nodes));
        }
        obs.complete();
      });
    });
  }

  public getRaw(key: string, params: any = {}, options: any = {}): rx.Observable<EtcResponse> {
    // console.log('get:', `${key}${this.urlParams(params, '?')}`)
    return this.keyAction('GET', `${key}${this.urlParams(params, '?')}`, options);
  }

  public getString(key: string, params: any = {}): rx.Observable<EtcValue<string>> {
    return rx.Observable.create((obs: rx.Observer<EtcValue<string>>) => {
      this.getRaw(key, params).subscribe((er) => {
        if (er.isErr()) {
          obs.next(EtcValue.error<string>(er));
        } else {
          obs.next(EtcValue.value<string>(er.node.value));
        }
        obs.complete();
      }, (err: any) => {
        obs.next(EtcValue.error<string>(err));
      });
    });
  }

  public getJson(key: string, params: any = {}): rx.Observable<EtcValue<any>> {
    return rx.Observable.create((obs: rx.Observer<EtcValue<any>>) => {
      this.getRaw(key, params).subscribe(ret => {
        if (ret.isErr()) {
          obs.next(EtcValue.error(ret));
        } else {
          obs.next(EtcValue.value(JSON.parse(ret.node.value)));
        }
      }, (err) => {
        obs.next(EtcValue.error(err));
      }, () => obs.complete());
    });
  }

  public setRaw(key: string, val: string): rx.Observable<EtcResponse> {
    return rx.Observable.create((obs: rx.Observer<EtcResponse>) => {
      this.keyAction('PUT', key, this.bodyParams({ value: val }))
        .subscribe(ret => {
          obs.next(ret);
        }, err => {
          obs.next(EtcResponse.error(err));
        }, () => obs.complete());
    });
  }

  public setJson(key: string, val: any): rx.Observable<EtcResponse> {
    return this.setRaw(key, JSON.stringify(val));
  }

  public createChangeWaiter(path: string, params: any = {}, options: any = {}): ChangeWaiter {
    return new ChangeWaiter(this, path, params, options);
  }

}

export default EtcdObserable;
