import { Etcd, EtcResponse, EtcValueNode } from './etcd';

export class ChangeWaiter implements Promise<EtcResponse> {
  public readonly [Symbol.toStringTag]: 'Promise'; // funky stuff?
  private etcd: Etcd;
  private path: string;
  private rejects: ((r: any) => void)[];
  private fulfilled: ((r: EtcResponse) => void)[];
  private options: any;
  private params: any;
  private current: any;
  private activeRequest: Promise<EtcResponse>;

  constructor(etcd: Etcd, path: string, params: any = {}, options: any = {}) {
    this.etcd = etcd;
    this.path = path;
    this.rejects = [];
    this.fulfilled = [];
    this.options = options;
    this.params = params;
  }

  public cancel(): void {
    if (this.activeRequest) {
      (this.activeRequest as any).cancel();
    }
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
    this.activeRequest = this.etcd.getRaw(this.path, params, this.options);
    this.activeRequest.then((v: EtcResponse) => {
      this.current = v;
      this.fulfilled.forEach(ff => ff(v));
      this.get(true, this.findMaxModifiedIndex(v.node) + 1);
    });
    this.activeRequest.catch((reason: any) => {
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
