
import * as rq from 'request-promise';
import * as rqErr from 'request-promise/errors';

export class LeaderInfo {
  public leader: string;
  public uptime: string;
  public startTime: Date;
  public static fill(js: any): LeaderInfo {
    let ret = new LeaderInfo();
    ret.leader = js['leader'];
    ret.uptime = js['uptime'];
    ret.startTime = new Date(js['startTime']);
    return ret;
  }
}

class Dispatcher<T>  {
  private fnResolv: (x: any) => void;
  private fnReject: (x: any) => void;
  public promise: Promise<T>;

  public static create<T>(): Dispatcher<T> {
    return new Dispatcher<T>();
  }

  public resolve(t: T): void {
    this.fnResolv(t);
  }

  public reject(t: T): void {
    this.fnReject(t);
  }

  constructor() {
    // console.log('Dispatcher:constructor')
    this.promise = new Promise((s, j) => {
      // console.log('Dispatcher:', s, j)
      this.fnResolv = s;
      this.fnReject = j;
    });
  }

}

export class EtcValueNode {
  public createIndex: number;
  public key: string;
  public modifiedIndex: number;
  public value: string;
  public dir: boolean = false;
  public nodes: EtcValueNode[] = null;

  public static fromJson(js: any, val: EtcValueNode = null): EtcValueNode {
    if (!val) {
      val = new EtcValueNode();
    }
    val.createIndex = js['createIndex'];
    val.key = js['key'];
    val.modifiedIndex = js['modifiedIndex'];
    val.value = js['value'];
    val.dir = js['dir'] || false;
    if (val.dir) {
      val.nodes = (js['nodes'] || []).map((n: any) => EtcValueNode.fromJson(n));
    }
    return val;
  }
}

export class EtcError {
  public reqErr?: rqErr.RequestError;
  public statusErr?: rqErr.StatusCodeError;
  public transErr?: rqErr.TransformError;
  public unknown?: any;
  public static fromJson(err: any): EtcError {
    let ee = new EtcError();
    // if (typeof (err) == 'RequestError') {
    //   return ee;
    // }
    if (typeof (err.statusCode) == 'number' && err.statusCode != 200) {
      ee.statusErr = err;
      return ee;
    }
    // if (typeof (err) == 'TransformError') {
    //   return ee;
    // }
    ee.unknown = err;
    return ee;
  }
}

export class EtcValue<T> {
  public err?: EtcResponse = null;
  public value?: T = null;

  public static error<T>(res: any): EtcValue<T> {
    let ej = new EtcValue<T>();
    ej.err = res;
    // console.log('ERROR', res)
    // ej.err = EtcErrorFactory(res)
    return ej;
  }
  public static value<T>(value: T): EtcValue<T> {
    let ej = new EtcValue<T>();
    ej.value = value;
    return ej;
  }
  public isErr(): boolean {
    return !!this.err;
  }
  public isOk(): boolean {
    return !this.isErr();
  }

}

// function EtcNodeFactory(js: any) : EtcValueNode {
//   return EtcValueNode.fromJson(js)
// }

export class EtcResponse {
  public action: string;
  public node?: EtcValueNode;
  public err?: EtcError;

 public static error(err: any): EtcResponse {
    let res = new EtcResponse();
    res.action = 'error';
    res.err = EtcError.fromJson(err);
    return res;

  }
  public static fromJson(js: any): EtcResponse {
    let res = new EtcResponse();
    res.action = js['action'];
    res.node = EtcValueNode.fromJson(js['node']);
    return res;
  }

  public isErr(): boolean {
    return this.action == 'error';
  }
  public isOk(): boolean {
    return !this.isErr();
  }
}

// function EtcResponseFactory(js: any) : EtcResponse {
//   // if (js['errorCode']) {
//   //   return EtcError.fromJson(js)
//   // }
//   if (js['action']) {
//     return EtcResponse.fromJson(js)
//   }
//   return null
// }

// function EtcErrorFactory(js: any) : any {
//   if (js['action']) {
//     return EtcResponse.fromJson(js)
//   }
//   return null
// }

export class SelfState {
  public url: string;
  public err: any = null;

  public name: string;
  public id: string;
  public state: string;

  public startTime: Date;
  public leaderInfo: LeaderInfo;

  public recvAppendRequestCnt: number;
  public sendAppendRequestCnt: number;

  public static error(url: string, err: any): SelfState {
    let ret = new SelfState();
    ret.url = url;
    ret.err = err;
    return ret;
  }
  public static ok(url: string, val: string): SelfState {
    let ret = new SelfState();
    ret.url = url;
    let json = JSON.parse(val);
    ret.name = json['name'];
    ret.id = json['id'];
    ret.state = json['state'];
    ret.startTime = new Date(json['startTime']);
    ret.leaderInfo = LeaderInfo.fill(json['leaderInfo']);
    ret.recvAppendRequestCnt = json['recvAppendRequestCnt'];
    ret.sendAppendRequestCnt = json['sendAppendRequestCnt'];
    return ret;
  }
  public isOk(): boolean {
    return this.err == null && this.id.length != 0;
  }

}

export class Config {
  public urls: string[] = [];
  public reqTimeout = 500; // msec
  public retries = 3;
  public waitTime = 250; // ms
  public clusterId: string = null;
  public appId: string = null;
  public static start(argv: string[], app: string = null): Config {
    let ret = new Config();
    let ofs = argv.indexOf('--etcd-cluster-id');
    if (ofs >= 0) {
      ret.clusterId = argv[ofs + 1];
    }

    ofs = argv.indexOf('--etcd-app-id');
    if (ofs >= 0) {
      ret.appId = argv[ofs + 1];
    } else {
      ret.appId = app;
    }

    for (ofs = argv.indexOf('--etcd-url'); ofs >= 0; ofs = argv.indexOf('--etcd-url', ofs + 1)) {
      ret.urls.push(argv[ofs + 1]);
    }
    if (ret.urls.length == 0) {
      ret.urls.push('http://localhost:2379');
    }

    ofs = argv.indexOf('--etcd-retries');
    if (ofs >= 0) {
      ret.retries = parseInt(argv[ofs + 1], 10);
    }

    ofs = argv.indexOf('--etcd-wait-time');
    if (ofs >= 0) {
      ret.waitTime = parseInt(argv[ofs + 1], 10);
    }

    ofs = argv.indexOf('--etcd-req-timeout');
    if (ofs >= 0) {
      ret.reqTimeout = parseInt(argv[ofs + 1], 10);
    }
    return ret;
  }
}

export class Etcd {
  private cfg: Config;
  private connected?: SelfState = null;

  private selfStateInActions: { [id: string]: Dispatcher<SelfState>[] } = {};

  public static create(cfg: Config): Etcd {
    return new Etcd(cfg);
  }

  constructor(cfg: Config) {
    this.cfg = cfg;
  }

  private async request(method: string, url: string, options: any = {}): Promise<any> {
    let c = await this.connect();
    if (!c.isOk()) {
      console.error('Request-REJECT no valid connection');
      return Promise.reject(c);
    }
    try {
      return await this.rawRequest(method, `${c.url}${url}`, options);
    } catch (e) {
      if (e.name == 'StatusCodeError') {
        return Promise.reject(e);
      }
      console.error('Reconnected:', typeof e, e.name, e);
      this.connected = null; // reconnect etcd
      return this.request(method, url, options);
    }
  }

  private rawRequest(method: string, url: string, options: any = {}): rq.RequestPromise {
    let my = {
      method: method,
      timeout: this.cfg.reqTimeout,
      uri: url
    };
    options = Object.assign(my, options);
    // console.log(options)
    return rq(url, options);
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

  public async untilFirstConnect(): Promise<SelfState[]> {
    return new Promise<SelfState[]>((res, rej) => {
      // console.log('ufc-1')
      let resolved = false;
      let result: SelfState[] = [];
      // console.log('ufc-2')
      this.cfg.urls.forEach((url) => {
        // console.log('ufc-3')
        this.selfStat(url).then((value) => {
          // console.log('ufc-4')
          if (resolved) { return; }
          result.push(value);
          if (value.isOk()) {
            // console.log('ufc-5')
            resolved = true;
            res(result);
          } else {
            // console.log('ufc-6')
            if (result.length == this.cfg.urls.length) {
              // console.log('ufc-7')
              resolved = true;
              res(result);
            }
          }
        });
      });
    });
  }

  public async connect(): Promise<SelfState> {
    // console.log('meno-1')
    if (!this.connected) {
      let ret = null;
      for (let retry = 0; retry < this.cfg.retries; ++retry) {
        // console.log('meno-2')
        ret = await this.untilFirstConnect();
        // console.log('meno-3')
        let foundOk = ret.find((s2) => s2.isOk());
        if (foundOk) {
          // console.log('meno-4')
          this.connected = foundOk;
          return Promise.resolve(foundOk);
        }
        console.log('Retry-Connect:', retry, this.cfg.waitTime);
        await new Promise((res, rej) => {
          setTimeout(res, this.cfg.waitTime);
        });
      }
      return Promise.resolve(SelfState.error('all', ret));
    } else {
      return Promise.resolve(this.connected);
    }
  }

  public async clusterState(): Promise<SelfState[]> {
    // console.log('this.cfg.urls:', this.cfg.urls)
    return Promise.all(this.cfg.urls.map((url) => this.selfStat(url)));
  }

  private resolvSelfStateInActions(url: string, s2: SelfState): SelfState {
    let local = this.selfStateInActions[url];
    delete this.selfStateInActions[url];
    local.slice(1).forEach((ssia) => {
      ssia.resolve(s2);
    });
    return s2;
  }
  public async selfStat(url: string): Promise<SelfState> {
    // console.log('selfStat:', url)
    if (!this.selfStateInActions[url]) {
      this.selfStateInActions[url] = [];
    }
    let dispatcher = Dispatcher.create<SelfState>();
    this.selfStateInActions[url].push(dispatcher);
    if (this.selfStateInActions[url].length > 1) {
      // console.log('selfStat-Double:', url)
      return dispatcher.promise;
    }
    return new Promise<SelfState>(async (res, rej) => {
      //  console.log('P-Enter')
      try {
        let ret = await this.rawRequest('GET', `${url}/v2/stats/self`);
        //  console.log('selfstate: get ok:', url, ret)
        res(this.resolvSelfStateInActions(url, SelfState.ok(url, ret)));
      } catch (err) {
        //  console.log('selfstate: get false:', url, err)
        res(this.resolvSelfStateInActions(url, SelfState.error(url, err)));
      }
    });
  }

  private async keyAction(method: string, key: string, options: any = {}): Promise<EtcResponse> {
    let uri = this.buildKeyUri('/v2/keys', key);
    try {
      let ret = await this.request(method, uri, options);
      // if (method == 'PUT') {
      //   console.log('OK-PUT:', uri, ret)
      // }
      return Promise.resolve(EtcResponse.fromJson(JSON.parse(ret)));
    } catch (err) {
      // if (method == 'PUT') {
      //   console.log('ERR-PUT:', uri, err)
      // }
      return Promise.resolve(EtcResponse.error(err));
    }
  }

  public async update(key: string, ttl: number): Promise<EtcResponse> {
    return this.keyAction('PUT', key, this.bodyParams({
      'ttl': ttl,
      'refresh': true,
      'prevExist': true
    }));
  }

  public async addQueue(key: string, val: string, ttl: number): Promise<EtcResponse> {
    return this.keyAction('POST', key, this.bodyParams({ 'value': val, 'ttl': ttl }));
  }

  public async mkdir(key: string): Promise<EtcResponse> {
    return this.keyAction('PUT', key, this.bodyParams({ dir: true }));
  }
  public async rmdir(key: string, params: any = {}): Promise<EtcResponse> {
    return this.keyAction('DELETE',
        `${key}${this.urlParams(Object.assign({ dir: true }, params), '?')}`);
  }

  public async delete(key: string): Promise<EtcResponse> {
    return this.keyAction('DELETE', key);
  }

  public async list(key: string, params: any = {}): Promise<EtcValue<EtcValueNode[]>> {
    // console.log('list:', `${key}${this.urlParams(params, '?')}`)
    let list = await this.keyAction('GET', `${key}${this.urlParams(params, '?')}`);
    if (list.isErr()) {
      return Promise.resolve(EtcValue.error<EtcValueNode[]>(list));
    }
    if (!list.node.dir) {
      return Promise.resolve(EtcValue.error<EtcValueNode[]>('not a directory'));
    }
    return Promise.resolve(EtcValue.value(list.node.nodes)); // empty directory
  }

  public async getRaw(key: string, params: any = {}, options: any = {}): Promise<EtcResponse> {
    // console.log('get:', `${key}${this.urlParams(params, '?')}`)
    return this.keyAction('GET', `${key}${this.urlParams(params, '?')}`, options);
  }

  public async getString(key: string, params: any = {}): Promise<EtcValue<string>> {
    try {
      let ret = await this.getRaw(key, params);
      if (ret.isErr()) {
        return Promise.resolve(EtcValue.error<string>(ret));
      }
      return Promise.resolve(EtcValue.value<string>(ret.node.value));
    } catch (err) {
      return Promise.resolve(EtcValue.error<string>(err));
    }
  }

  public async getJson(key: string, params: any = {}): Promise<EtcValue<any>> {
    try {
      let ret = await this.getRaw(key, params);
      if (ret.isErr()) {
        return Promise.resolve(EtcValue.error(ret));
      }
      return Promise.resolve(EtcValue.value(JSON.parse(ret.node.value)));
    } catch (err) {
      return Promise.resolve(EtcValue.error(err));
    }
  }

  public async setRaw(key: string, val: string): Promise<EtcResponse> {
    try {
      let ret = await this.keyAction('PUT', key, this.bodyParams({ value: val }));
      return Promise.resolve(ret);
    } catch (err) {
      return Promise.resolve(EtcResponse.error(err));
    }
  }

  public async setJson(key: string, val: any): Promise<EtcResponse> {
    return this.setRaw(key, JSON.stringify(val));
  }

}

export default Etcd;
