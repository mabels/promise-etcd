import Etcd from './etcd-observable';
import * as Uuid from 'node-uuid';
import * as os from 'os';
import * as path from 'path';
import * as rx from 'rxjs';

export class WaitMaster {
  public etc: Etcd;
  public reqStop: boolean = false;
  public stopped: boolean = false;
  public stopAction: () => void = null;
  public waitChangePromise: rx.Observable<any>;
  public master: boolean = false;
  public ttl: number;
  public saveTtl: number;
  public key: string;
  public me: string;
  public aliveQueue: any;
  public startCb: () => void = null;
  public stopCb: () => void = null;
  public currentAliveTimeOut: any = null;
  public currentWait: rx.Observable<any> = null;

  public static create(key: string, etc: Etcd, ttl: number, saveTtl: number,
    start: () => void = null, stop: () => void = null): rx.Observable<any> {
    const ret = new WaitMaster(key, etc, ttl, saveTtl, start, stop);
    return rx.Observable.create((obs: rx.Observer<any>) => {
      etc.mkdir(key).subscribe(() => {
        ret.me = `${os.hostname()}-${process.pid}-${Uuid.v4().toString()}`;
        setTimeout(ret.startWaitChange.bind(ret), 0);
        etc.addQueue(key, ret.me, ret.ttl + ret.saveTtl).subscribe(aq => {
          ret.aliveQueue = `${key}/${path.basename(aq['node']['key'])}`;
          ret.startAliveQueue();
          obs.next(ret);
          obs.complete();
        }, err => {
          obs.error(err);
        });
      }, (err: any) => {
        if (err.statusCode != 403) {
          etc.cfg.log.error(err); // Error:  105: Key already exists (/menox)
          obs.error(`can not create directory:${key}`);
        }
      });

    });
  }

  constructor(key: string, etc: Etcd, ttl = 30000, saveTtl = 1000,
    startCb: () => void, stopCb: () => void) {
    this.etc = etc;
    this.key = key;
    this.ttl = ttl;
    this.saveTtl = saveTtl;
    this.startCb = startCb || ((): void => { /**/ });
    this.stopCb = stopCb || ((): void => { /**/ });
  }

  private renewTimeout(): void {
    if (this.reqStop) { return; }
    this.etc.update(this.aliveQueue, this.ttl + this.saveTtl).subscribe((_) => {
      this.startAliveQueue();
    }, (e) => {
      this.etc.cfg.log.error('update alive failed');
      this.stop();
    });
  }

  private startAliveQueue(): void {
    this.currentAliveTimeOut = setTimeout(this.renewTimeout.bind(this), this.ttl);
  }

  public stop(): void {
    if (this.reqStop) {
      this.etc.cfg.log.error('stop is running');
      return;
    }
    this.reqStop = true;
    if (this.currentAliveTimeOut) {
      clearTimeout(this.currentAliveTimeOut);
    }
    // console.log('ReqStop:', this.me, this.aliveQueue)
    this.etc.delete(this.aliveQueue).subscribe(() => {
      /* */
    }, (err) => {
      this.etc.cfg.log.error('stop delete failed', err);
    });
  }

  private doStop(masterId: string): void {
    this.master = false;
    this.stopped = true;
    if (this.stopAction) {
      this.stopAction();
      this.stopAction = null;
    }
    // console.log('Stop:', this.me, this.aliveQueue, masterId)
  }

  private checkAmIMaster(): rx.Observable<any> {
    return rx.Observable.create((obs: rx.Observer<any>) => {
      this.etc.list(this.key, { recursive: true, sorted: true }).subscribe(master => {
        // console.log('master:', this.key, master)
        if (master.isErr()) {
          obs.next(master);
          obs.complete();
          return;
        }
        let masterId = null;
        if (master.value.length != 0) {
          masterId = `${this.key}/${path.basename(master.value[0]['key'])}`;
        }
        if (this.master && masterId != this.aliveQueue) {
          this.doStop(masterId);
          obs.next('got slave');
          obs.complete();
          return;
        }
        if (masterId == this.aliveQueue) {
          if (this.master) {
            obs.next('im the master');
            obs.complete();
            return;
          }
          this.master = true;
          this.stopAction = this.stopCb;
          this.startCb();
          obs.next('got master');
          obs.complete();
          return;
        }
        if (this.reqStop && !this.master) {
          this.stopped = true;
          obs.next('slaved stopped');
          obs.complete();
          return;
        }
        obs.next('im a slave');
        obs.complete();
        return;
      }, (e: any) => {
        this.etc.cfg.log.error(e);
        obs.error(e);
        return;
      });
    });
  }

  private startWaitChange(): void {
    let waitIndex: number = null;
    if (!this.stopped) {
      let params: any = { 'wait': true, 'recursive': true };
      if (waitIndex) {
        params['waitIndex'] = waitIndex;
      }
      // let master = this.master;
      // master && console.log('wait...', this.me, this.aliveQueue)
      this.currentWait = this.etc.getRaw(this.key, params, { timeout: 3600000 });
      this.currentWait.subscribe((ret) => {
        // master && console.log('await', this.me, this.aliveQueue)
        waitIndex = ret['node']['modifiedIndex'] + 1;
        this.checkAmIMaster().subscribe((_) => {
          // console.log('startWaitChange:', _);
          this.startWaitChange();
        }, (e) => {
          this.etc.cfg.log.error(e);
        });
      }, (e) => {
        this.etc.cfg.log.error(e);
      });
    }
  }

}
