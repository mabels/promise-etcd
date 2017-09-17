
import * as rx from 'rxjs';

export class Dispatcher<T>  {
  private fnResolv: (x: any) => void;
  private fnReject: (x: any) => void;
  public subject: rx.Subject<T>;

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
    this.subject = rx.Observable.create((obs: rx.Observer<T>) => {
      // console.log('dispatcher:create:');
      this.fnResolv = (t: T) => { /* console.log('resolv:', t); */ obs.next(t); obs.complete(); };
      this.fnReject = (t: T) => { /* console.log('reject:', t); */ obs.error(t); };
    });
  }

}

export default Dispatcher;
