import { Etcd, EtcResponse, EtcValueNode } from './etcd';

class CancelableRequest {
  private readonly cw: ChangeWaiter;
  private readonly req: Promise<EtcResponse>;
  private thenCbs: ((v: EtcResponse) => void)[];
  private catchCbs: ((v: any) => void)[];
  private cancelledCbs: (() => void)[];
  private gotCancel: boolean;

  constructor(cw: ChangeWaiter, req: Promise<EtcResponse>) {
    this.cw = cw;
    this.req = req;
    this.thenCbs = [];
    this.catchCbs = [];
    this.cancelledCbs = [];
    this.gotCancel = false;
    this.req.then((v: EtcResponse) => {
      if (this.gotCancel) {
        this.cw.etcd.cfg.log.debug('cancelled');
        return;
      }
      this.thenCbs.forEach(tc => tc(v));
    });
    this.req.catch((reason: any) => {
      this.catchCbs.forEach(rj => rj(reason));
    });
  }

  public cancel(): void {
    this.gotCancel = true;
    this.thenCbs = [];
    this.catchCbs = [];
    const tmp = this.cancelledCbs;
    this.cancelledCbs = [];
    tmp.forEach(c => c());
  }

  public cancelled(v: () => void): void {
    this.cancelledCbs.push(v);
  }

  public then(v: (er: EtcResponse) => void): void {
    this.thenCbs.push(v);
  }

  public catch(v: (er: any) => void): void {
    this.catchCbs.push(v);
  }

}

interface WaitAndWaitIndex {
  wait: boolean;
  waitIndex: number;
}

export class ChangeWaiter implements Promise<EtcResponse> {
  public readonly [Symbol.toStringTag]: 'Promise'; // funky stuff?
  public readonly etcd: Etcd;
  private path: string;
  private rejects: ((r: any) => void)[];
  private fulfilled: ((r: EtcResponse) => void)[];
  private options: any;
  private params: any;
  private current: any;
  private runningRequests: CancelableRequest[];
  private getQueue: WaitAndWaitIndex[];

  constructor(etcd: Etcd, path: string, params: any = {}, options: any = {}) {
    this.etcd = etcd;
    this.path = path;
    this.rejects = [];
    this.fulfilled = [];
    this.options = options;
    this.params = params;
    this.runningRequests = [];
    this.getQueue = [];
  }

  public unsubscribe(): void {
    this.rejects = [];
    this.fulfilled = [];
  }

  public cancel(): void {
    this.runningRequests.forEach(r => r.cancel());
    this.unsubscribe();
    this.etcd.cfg.log.debug('cancelled', this.runningRequests.length);
  }

  private findMaxModifiedIndex(n: EtcValueNode): number {
    if (n.dir) {
      return n.nodes
        .map(c => this.findMaxModifiedIndex(c))
        .reduce((p, c) => Math.max(p, c), n.modifiedIndex);
    } else {
      return n.modifiedIndex;
    }
  }

  private get(wait: boolean, waitIndex: number = null): void {
    const params = Object.assign({}, this.params);
    params['wait'] = wait;
    if (waitIndex !== null) {
      params['waitIndex'] = waitIndex;
    }
    this.etcd.cfg.log.debug('get', waitIndex, this.runningRequests.length);
    const cancelable = new CancelableRequest(this, this.etcd.getRaw(this.path, params, this.options));
    this.runningRequests.push(cancelable);
    cancelable.cancelled(() => {
      this.runningRequests = this.runningRequests.filter(r => r !== cancelable);
    });
    cancelable.then((v: EtcResponse) => {
      this.runningRequests = this.runningRequests.filter(r => r !== cancelable);
      if (v.action == 'error') {
        this.etcd.cfg.log.debug('retry', waitIndex);
        this.get(true, waitIndex);
      } else {
        this.current = v;
        this.get(true, this.findMaxModifiedIndex(v.node) + 1);
        // if cancelled the just issued runningRequest should
        // be cancelled also
        this.fulfilled.forEach(ff => ff(v)); // don't move
      }
    });
    cancelable.catch((reason: any) => {
      this.runningRequests = this.runningRequests.filter(r => r !== cancelable);
      this.rejects.forEach(rj => rj(reason));
    });
  }

  public then<TResult1 = EtcResponse, TResult2 = never>(
    onfulfilled?: (value: EtcResponse) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>)
    : Promise<TResult1 | TResult2> {
    if (onfulfilled) {
      this.fulfilled.push(onfulfilled);
    }
    if (this.fulfilled.length == 1) {
      this.get(false);
    } else if (this.current) {
      onfulfilled(this.current);
    }
    if (onrejected) {
      this.rejects.push(onrejected);
    }
    return this as any; // type hack
  }

  public catch<TResult = never>(
    onrejected?: (reason: any) => TResult | PromiseLike<TResult>)
    : Promise<EtcResponse | TResult> {
    if (onrejected) {
      this.rejects.push(onrejected);
    }
    return this as Promise<EtcResponse>;
  }

}

export default ChangeWaiter;
