import { EtcdObservable } from './etcd-observable';
import { EtcValue } from './etc-value';
import * as rx from 'rxjs';

export interface Apply {
    // return !null means set
    // return null  skip set
    (obj: rx.Subject<any>): void;
}

export class Upset {

    private readonly etcd: EtcdObservable;

    public static create(etcd: EtcdObservable): Upset {
        return new Upset(etcd);
    }

    constructor(etcd: EtcdObservable) {
        this.etcd = etcd;
    }

    private doIt(key: string, apply: Apply, obs: rx.Observer<void>): void {
        // read key
        this.etcd.getJson(key).subscribe(_obs => {
            if (_obs.isErr()) {
                obs.error(_obs);
                return;
            }
        }, (err) => {

        }, () => {

        });
    }

    public upSet(key: string, apply: Apply): rx.Observable<void> {
        return rx.Observable.create((obs: rx.Observer<void>) => {
            this.doIt(key, apply, obs);
        });
    }

}