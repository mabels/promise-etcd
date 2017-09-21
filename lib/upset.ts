import { EtcdObservable } from './etcd-observable';
import { EtcValue } from './etc-value';
import * as rx from 'rxjs';

export interface Apply {
    // return !null means set
    // return null  skip set
    (inp: any, out: rx.Subject<any>): void;
}

export class Upset {

    private readonly etcd: EtcdObservable;

    public static create(etcd: EtcdObservable): Upset {
        return new Upset(etcd);
    }

    constructor(etcd: EtcdObservable) {
        this.etcd = etcd;
    }

    private runApply(inp: any, apply: Apply, obs: rx.Observer<void>, uuid: any): void {
        const sub = new rx.Subject();
        sub.subscribe((toSet: any) => {
            this.etcd.cfg.log.debug('runApply:next', uuid, toSet);
            obs.next(toSet);
        }, err => {
            this.etcd.cfg.log.debug('runApply:error', uuid);
            obs.error(err);
        }, () => {
            this.etcd.cfg.log.debug('runApply:complete', uuid);
            obs.complete();
        });
        apply(inp, sub);
    }

    private updateIt(prevValue: any, key: string, toSet: any,
        apply: Apply, obs: rx.Observer<void>, uuid: any): void {
        const options: any = { };
        if (!prevValue) {
            options.prevExist = false;
        } else {
            options.prevValue = JSON.stringify(prevValue);
        }
        this.etcd.setJson(key, toSet, options).subscribe((er) => {
            if (er.isErr()) {
                if (er.err.etcErr.errorCode == 105) {
                    this.etcd.cfg.log.debug('updateIt:retry', uuid);
                    this.doIt(key, apply, obs, uuid);
                } else {
                    this.etcd.cfg.log.debug('updateIt:next:error', uuid, er);
                    obs.error(er);
                }
                return;
            }
            this.etcd.cfg.log.debug('updateIt:next:', uuid, er.node.modifiedIndex);
            obs.next(toSet);
            obs.complete();
        }, err => {
            this.etcd.cfg.log.debug('updateIt:error:', uuid, err);
            obs.error(err);
        }, () => {
            /* this.etcd.cfg.log.info('updateIt:complete:', uuid); */
        });
    }

    private doIt(key: string, apply: Apply, obs: rx.Observer<void>, uuid: any): void {
        // read key
        const applyStep = new rx.Subject<any>();
        let applyNextReceived = false; // very unhappy!
        let prevValue: any = null;
        applyStep.subscribe((toSet: any) => {
            applyNextReceived = true;
            this.etcd.cfg.log.debug('applyStep:updateIt:', uuid, toSet);
            this.updateIt(prevValue, key, toSet, apply, obs, uuid);
        }, err => {
            this.etcd.cfg.log.debug('applyStep:error:', uuid, err);
            obs.error(err);
        }, () => {
            this.etcd.cfg.log.debug('applyStep:complete:', uuid, applyNextReceived);
            if (!applyNextReceived) {
                obs.complete();
            }
        });
        this.etcd.getJson(key).subscribe((_obs: EtcValue<any>) => {
            if (_obs.isErr()) {
                if (_obs.err.err.etcErr.errorCode == 100)  {
                    this.etcd.cfg.log.debug('getJson:next:notfound:', uuid, key);
                    prevValue = null;
                    this.runApply(null, apply, applyStep, uuid);
                } else {
                    this.etcd.cfg.log.error('getJson:next:error:', uuid, key,
                        _obs.err.err.etcErr.errorCode);
                    applyStep.error(_obs);
                }
            } else {
                this.etcd.cfg.log.debug('getJson:next:found:', uuid, key);
                prevValue = _obs.value;
                this.runApply(_obs.value, apply, applyStep, uuid);
            }
        }, (err: any) => {
            applyStep.error(err);
        }, () => {
            /* */
        });
    }

    public upSet(key: string, apply: Apply): rx.Observable<void> {
        let once = true;
        return rx.Observable.create((obs: rx.Observer<void>) => {
            if (once) {
                once = false;
                this.doIt(key, apply, obs, Math.random());
            } else {
                this.etcd.cfg.log.error('upSet:double:once');
            }
        });
    }

}

export default Upset;
