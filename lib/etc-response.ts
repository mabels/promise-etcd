import EtcError from './etc-error';
import EtcValueNode from './etc-value-node';

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

export default EtcResponse;
