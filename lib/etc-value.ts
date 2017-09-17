import EtcResponse from './etc-response';

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

export default EtcValue;
