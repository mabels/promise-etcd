import Config from './config';
import ChangeWaiter from './change-waiter';
import SelfState from './self-state';
import EtcResponse from './etc-response';
import EtcValue from './etc-value';
import EtcValueNode from './etc-value-node';
import EtcdObservable from './etcd-observable';

export class EtcdPromise {
  private obs: EtcdObservable;

  public static create(cfg: Config): EtcdPromise {
    return new EtcdPromise(cfg);
  }

  constructor(cfg: Config) {
    this.obs = new EtcdObservable(cfg);
  }

  public async connect(): Promise<SelfState> {
    return this.obs.connect().toPromise();
  }

  public async clusterState(): Promise<SelfState[]> {
    return this.obs.clusterState().toPromise();
  }

  public async selfStat(url: string): Promise<SelfState> {
    return this.obs.selfStat(url).toPromise();
  }

  public async update(key: string, ttl: number): Promise<EtcResponse> {
    return this.obs.update(key, ttl).toPromise();
  }

  public async addQueue(key: string, val: string, ttl: number): Promise<EtcResponse> {
    return this.obs.addQueue(key, val, ttl).toPromise();
  }

  public async mkdir(key: string): Promise<EtcResponse> {
    return this.obs.mkdir(key).toPromise();
  }
  public async rmdir(key: string, params: any = {}): Promise<EtcResponse> {
    return this.obs.rmdir(key, params).toPromise();
  }

  public async delete(key: string): Promise<EtcResponse> {
    return this.obs.delete(key).toPromise();
  }

  public async list(key: string, params: any = {}): Promise<EtcValue<EtcValueNode[]>> {
    return this.obs.list(key, params).toPromise();
  }

  public async getRaw(key: string, params: any = {}, options: any = {}): Promise<EtcResponse> {
    return this.obs.getRaw(key, params, options).toPromise();
  }

  public async getString(key: string, params: any = {}): Promise<EtcValue<string>> {
    return this.obs.getString(key, params).toPromise();
  }

  public async getJson(key: string, params: any = {}): Promise<EtcValue<any>> {
    return this.obs.getJson(key, params).toPromise();
  }

  public async setRaw(key: string, val: string): Promise<EtcResponse> {
    return this.obs.setRaw(key, val).toPromise();
  }

  public async setJson(key: string, val: any): Promise<EtcResponse> {
    return this.obs.setJson(key, val).toPromise();
  }

  public createChangeWaiter(path: string, params: any = {}, options: any = {}): ChangeWaiter {
    return this.obs.createChangeWaiter(path, params, options);
  }

}

export default EtcdPromise;
