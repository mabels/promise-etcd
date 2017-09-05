
import * as etcd from './etcd';
import * as Uuid from 'node-uuid';
import * as os from 'os';
import * as path from 'path';

export class WaitMaster {
  public etc: etcd.Etcd;
  public reqStop: boolean = false;
  public stopped: boolean = false;
  public stopAction: () => void = null;
  public waitChangePromise: Promise<any>;
  public master: boolean = false;
  public ttl: number;
  public saveTtl: number;
  public key: string;
  public me: string;
  public aliveQueue: any;
  public startCb: () => void = null;
  public stopCb: () => void = null;
  public currentAliveTimeOut: any = null;
  public currentWait: Promise<any> = null;

  public static async create(key: string, etc: etcd.Etcd, ttl: number, saveTtl: number,
    start: () => void, stop: () => void = null): Promise<any> {
    let ret = new WaitMaster(key, etc, ttl, saveTtl, start, stop);
    try {
      await etc.mkdir(key);
    } catch (err) {
      if (err.statusCode != 403) {
        console.log(err); // Error:  105: Key already exists (/menox)
        return Promise.reject(`can not create directory:${key}`);
      }
    }
    ret.me = `${os.hostname()}-${process.pid}-${Uuid.v4().toString()}`;
    setTimeout(ret.startWaitChange.bind(ret), 0);
    try {
      let aq = await etc.addQueue(key, ret.me, ret.ttl + ret.saveTtl);
      ret.aliveQueue = `${key}/${path.basename(aq['node']['key'])}`;
      ret.startAliveQueue();
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve(ret);
  }

  constructor(key: string, etc: etcd.Etcd,
    ttl = 30000, saveTtl = 1000,
    startCb: () => void, stopCb: () => void) {
    this.etc = etc;
    this.key = key;
    this.ttl = ttl;
    this.saveTtl = saveTtl;
    this.startCb = startCb;
    this.stopCb = stopCb;
  }

  private async renewTimeout(): Promise<string> {
    if (this.reqStop) { return; }
    try {
      // console.log(this.aliveQueue)
      await this.etc.update(this.aliveQueue, this.ttl + this.saveTtl);
    } catch (e) {
      console.error('update alive failed');
      return this.stop();
    }
    this.startAliveQueue();
  }
  private async startAliveQueue(): Promise<void> {
    this.currentAliveTimeOut = setTimeout(this.renewTimeout.bind(this), this.ttl);
  }

  public async stop(): Promise<string> {
    if (this.reqStop) {
      return Promise.resolve('stop is running');
    }
    this.reqStop = true;
    if (this.currentAliveTimeOut) {
      clearTimeout(this.currentAliveTimeOut);
    }
    // console.log('ReqStop:', this.me, this.aliveQueue)
    await this.etc.delete(this.aliveQueue);
    // this.currentWait && this.currentWait.cancel()
  }

  private async doStop(masterId: string): Promise<void> {
    this.master = false;
    this.stopped = true;
    if (this.stopAction) {
      this.stopAction();
      this.stopAction = null;
    }
    // console.log('Stop:', this.me, this.aliveQueue, masterId)
  }

  private async checkAmIMaster(): Promise<any> {
    try {
      let master = await this.etc.list(this.key, { recursive: true, sorted: true });
      // console.log('master:', this.key, master)
      if (master.isErr()) {
        return Promise.resolve(master);
      }
      let masterId = null;
      if (master.value.length != 0) {
        masterId = `${this.key}/${path.basename(master.value[0]['key'])}`;
      }
      // console.log('master:', master)
      if (this.master && masterId != this.aliveQueue) {
        this.doStop(masterId);
        return Promise.resolve('got slave');
      }
      // let value = await this.etc.getString(masterId)
      if (masterId == this.aliveQueue) {
        if (this.master) {
          return Promise.resolve('im the master');
        }
        // this.masterId = masterId
        // console.log('Master:', this.me, this.aliveQueue)
        this.master = true;
        this.stopAction = this.stopCb;
        this.startCb();
        return Promise.resolve('got master');
      }
      if (this.reqStop && !this.master) {
        this.stopped = true;
        return Promise.resolve('slaved stopped');
      }
      return Promise.resolve('im a slave');
    } catch (e) {
      console.error(e);
      return Promise.reject(e);
    }
  }

  private async startWaitChange(): Promise<void> {
    let waitIndex: number = null;
    while (!this.stopped) {
      try {
        let params: any = { 'wait': true, 'recursive': true };
        if (waitIndex) {
          params['waitIndex'] = waitIndex;
        }
        let master = this.master;
        // master && console.log('wait...', this.me, this.aliveQueue)
        this.currentWait = this.etc.getRaw(this.key, params, { timeout: 3600000 });
        let ret = await this.currentWait;
        // master && console.log('await', this.me, this.aliveQueue)
        waitIndex = ret['node']['modifiedIndex'] + 1;
        ret = await this.checkAmIMaster();
        // master && console.log('postMaster:', ret, this.aliveQueue)
      } catch (e) {
        console.error(e);
      }
    }
  }

}
