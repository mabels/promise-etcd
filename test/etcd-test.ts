import { assert } from 'chai';
import * as Uuid from 'uuid';
import * as etcd from '../lib/index';
import * as rx from 'rxjs';

/*
function param(arr: string[], uuid: string): string[] {
  return arr.concat(['--etcd-cluster-id', uuid, '--etcd-url', 'http://localhost:2379']);
}
*/

describe('etcd', function (): void {
  this.timeout(2000);
  before(async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379'
    ]);
    console.log('etcd Cluster Booted...0');
    let etc = etcd.EtcdPromise.create(wc);
    console.log('etcd Cluster Booted...1');
    await etc.connect();
    console.log('etcd Cluster Booted...2');
    return Promise.resolve('done');
  });

  it('AsyncPromise Blocking', async () => {
    let value = 1;
    let out = new Promise(async (r, j) => {
      await new Promise((rr, jj) => { setTimeout(rr, 10); });
      ++value;
    });
    out = null; // WTF Lint
    assert.equal(value, 1);
    await new Promise((rr, jj) => { setTimeout(rr, 15); });
    assert.equal(value, 2);
    return Promise.resolve('done');
  });

  it('selfStat one good', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.clusterState();
    assert.equal(1, ret.length);
    // console.log(ret[0])
    assert.equal(ret[0].isOk(), true);
    assert.equal(ret[0].url, 'http://localhost:2379');
    return Promise.resolve('done');
  });

  it('selfStat two same good', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379',
      '--etcd-url', 'http://localhost:2379'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.clusterState();
    assert.equal(2, ret.length);
    assert.equal(ret[0].isOk(), true);
    assert.equal(ret[0].url, 'http://localhost:2379');
    assert.equal(ret[1].isOk(), true);
    assert.equal(ret[1].url, 'http://localhost:2379');
    return Promise.resolve('done');
  });

  it('selfStat same good', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379',
      '--etcd-url', 'http://localhost:2379',
      '--etcd-url', 'http://localhost:2379',
      '--etcd-url', 'http://localhost:2379'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.clusterState();
    assert.equal(4, ret.length);
    assert.equal(ret[0].isOk(), true);
    assert.equal(ret[0].url, 'http://localhost:2379');
    return Promise.resolve('done');
  });

  it('selfStat connect', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), true, 'isok');
    assert.equal(ret.url, 'http://localhost:2379', 'url');
    return Promise.resolve('done');
  });

  it('selfStat clusterState bad', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://169.254.99.94'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.clusterState();
    assert.equal(1, ret.length);
    assert.equal(ret[0].isOk(), false);
    return Promise.resolve('done');
  });
  it('selfStat connect bad', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://169.254.99.94',
      '--etcd-url', 'http://169.254.99.95'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), false);
    return Promise.resolve('done');
  });
  it('selfStat connect good', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), true);
    return Promise.resolve('done');
  });

  it('selfStat connect two good', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379',
      '--etcd-url', 'http://127.0.0.1:2379'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), true);
    return Promise.resolve('done');
  });

  it('selfStat connect two good', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379',
      '--etcd-url', 'http://169.254.55.99',
      '--etcd-url', 'http://127.0.0.1:2379'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), true);
    return Promise.resolve('done');
  });

  it('selfStat one good one bad', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379',
      '--etcd-url', 'http://169.254.99.94'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.clusterState();
    assert.equal(2, ret.length);
    assert.equal(ret[0].isOk(), true);
    assert.equal(ret[1].isOk(), false);
    return Promise.resolve('done');
  });

  it('selfStat two good one bad', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379',
      '--etcd-url', 'http://169.254.99.94',
      '--etcd-url', 'http://127.0.0.1:2379'
    ]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.clusterState();
    assert.equal(3, ret.length);
    assert.equal(ret[0].isOk(), true);
    assert.equal(ret[1].isOk(), false);
    assert.equal(ret[2].isOk(), true);
    return Promise.resolve('done');
  });

  it('empty-list', async () => {
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]);
    let etc = etcd.EtcdPromise.create(wc);
    let lst = await etc.list('');
    assert.isTrue(lst.isErr());
    await etc.mkdir('');
    lst = await etc.list('');
    assert.isFalse(lst.isErr());
    await etc.mkdir('meno');
    lst = await etc.list('');
    assert.isTrue(lst.value[0].key.endsWith('meno'));
  });

  it('mkdir', async () => {
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.mkdir('meno');
    assert.equal(ret.isErr(), false);
    ret = await etc.mkdir('meno');
    assert.equal(ret.isErr(), true);

    let lst = await etc.list('meno');
    assert.equal(lst.isErr(), false);
    assert.equal(lst.value.length, 0);

    ret = await etc.rmdir('meno');
    assert.equal(ret.isOk(), true);
  });

  it('rmdir', async () => {
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]);
    let etc = etcd.EtcdPromise.create(wc);
    await etc.mkdir('meno');
    await etc.mkdir('meno/geheim');
    await etc.mkdir('meno/geheim/ganz');
    let ret = await etc.rmdir('meno', { recursive: true });
    assert.equal(ret.isOk(), true);
    await etc.mkdir('meno');
    let lst = await etc.list('meno');
    assert.equal(lst.isErr(), false);
    assert.equal(lst.value.length, 0);
    ret = await etc.rmdir('meno', { recursive: true });
    assert.equal(ret.isOk(), true);

  });

  it('get/setRaw', async () => {
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]);
    let etc = etcd.EtcdPromise.create(wc);

    let ret = await etc.getRaw('hammer/murk');
    assert.equal(ret.isErr(), true);
    ret = await etc.setRaw('hammer/murk', 'Hello World');
    assert.equal(ret.isErr(), false);
    ret = await etc.getRaw('hammer/murk');
    assert.equal(ret.isOk(), true);
    // console.log(ret.node)
    assert.equal(ret.node.value, 'Hello World');
  });

  function leftPad(n: number, pad: number): string {
    return ('' + (Math.pow(10, pad) + n)).substr(1);
  }

  function changeWriterThen(source: etcd.EtcdPromise, ccw: etcd.ChangeWaiter, cnt: any, done: any): void {
    let nested = 0;
    ccw.subscribe((er) => {
      nested++;
      let node = er.node;
      if (er.node.dir) {
        node = er.node.nodes.sort((a, b) => {
          if (a.key < b.key) { return -1; }
          if (a.key > b.key) { return 1; }
          return 0;
        })[er.node.nodes.length - 1];
      }
      // console.log(cnt.cnt, node.key, node.value, nested);
      assert.isTrue(node.key.endsWith(`wait-for-change/hallo-${leftPad(cnt.cnt, 5)}`), 'not match');
      assert.equal(`vallo-${leftPad(cnt.cnt, 5)}`, node.value, 'funny value');
      cnt.cnt++;
      if (cnt.cnt && (cnt.cnt % 4) == 0) {
        done();
      } else {
        updateData(source, ccw, cnt, done, false);
      }
      --nested;
    }, () => {
      assert.fail('should never called');
    });
  }

  function updateData(source: etcd.EtcdPromise, ccw: etcd.ChangeWaiter, cnt: any, done: any, install: boolean): void {
    setTimeout(() => {
      source.setRaw(`wait-for-change/hallo-${leftPad(cnt.cnt, 5)}`, `vallo-${leftPad(cnt.cnt, 5)}`).then(() => {
        if (install) {
          changeWriterThen(source, ccw, cnt, done);
        }
      }).catch(() => {
        assert.fail('should never called');
      });
    }, (cnt.cnt % 1000) * 90);
  }

  it('wait-for-change', (done) => {
    const uuid = Uuid.v4().toString();
    const wc = etcd.Config.start([
      '--etcd-cluster-id', uuid,
      '--etcd-req-timeout', '200']);
    const source = etcd.EtcdPromise.create(wc);
    source.mkdir('wait-for-change').then(() => {
      const ccw = source.createChangeWaiter('wait-for-change', { recursive: true });
      const cnt = { cnt: 0 };
      updateData(source, ccw, cnt, () => {
        ccw.cancel();
        cnt.cnt = 1000;
        setTimeout(() => updateData(source, ccw, cnt, () => {
          ccw.cancel();
          setTimeout(() => {
            source.setRaw(`wait-for-change/cancelled`, `stopped`).then(() => {
              done();
            }).catch(() => {
              assert.fail('never called');
            });
          }, 100);
        }, true), 300);
      }, true);
    });
  });

  function upsetTester(obEtcd: etcd.EtcdObservable, done: any,
    apply: (lc: any, sub: rx.Subject<any>) => void, test: (lc: any, done: any) => void): void {
    const lifeCycle = {
      apply: 0,
      next: 0,
      error: 0,
      complete: 0
    };
    const upset = etcd.Upset.create(obEtcd).upSet('upset', apply)
    upset.subscribe(() => {
      lifeCycle.next++;
    }, (error: any) => {
      lifeCycle.error++;
    }, () => {
      lifeCycle.complete++;
    });
    upset.subscribe(null, null, () => {
      test(lifeCycle, done);
    });
  }

  it('upset-empty-noopt', (done) => {
    const uuid = Uuid.v4().toString();
    const wc = etcd.Config.start([
      '--etcd-cluster-id', uuid,
      '--etcd-req-timeout', '200']);
    const obEtcd = etcd.EtcdObservable.create(wc);
    upsetTester(obEtcd, done, (lifeCycle: any, outer: rx.Subject<any>) => {
      assert.isNull(outer);
      lifeCycle.apply++;
      outer.complete();
    }, (lifeCycle: any, _done: any) => {
      assert.equal(lifeCycle.apply, 1);
      assert.equal(lifeCycle.next, 1);
      assert.equal(lifeCycle.error, 0);
      assert.equal(lifeCycle.complete, 1);
      obEtcd.getRaw('upset').subscribe((er) => {
        if (er.isErr()) {
          assert.fail('not found');
        }
      }, (err) => {
        assert.fail('no error expected');
      }, () => {
        _done();
      });
    });
  });

  it('upset-from-empty-set', (done) => {
    const uuid = Uuid.v4().toString();
    const wc = etcd.Config.start([
      '--etcd-cluster-id', uuid,
      '--etcd-req-timeout', '200']);
    const obEtcd = etcd.EtcdObservable.create(wc);
    upsetTester(obEtcd, done, (lifeCycle: any, outer: rx.Subject<any>) => {
      assert.isNull(outer);
      lifeCycle.apply++;
      outer.next({ 'hello': 'world' });
      outer.complete();
    }, (lifeCycle: any, _done: any) => {
      assert.equal(lifeCycle.apply, 1);
      assert.equal(lifeCycle.next, 1);
      assert.equal(lifeCycle.error, 0);
      assert.equal(lifeCycle.complete, 1);
      obEtcd.getRaw('upset').subscribe((er) => {
        if (er.isErr()) {
          assert.fail('not found');
        }
        assert.deepEqual(JSON.parse(er.node.value), { 'hello': 'world' });
      }, (err) => {
        assert.fail('no error expected');
      }, () => {
        _done();
      });
    });
  });

  it('upset-from-nonempty-set', (done) => {
    const uuid = Uuid.v4().toString();
    const wc = etcd.Config.start([
      '--etcd-cluster-id', uuid,
      '--etcd-req-timeout', '200']);
    const obEtcd = etcd.EtcdObservable.create(wc);
    upsetTester(obEtcd, done, (lifeCycle: any, outer: rx.Subject<any>) => {
      assert.isNull(outer);
      lifeCycle.apply++;
      outer.next({ 'hello': 'world' });
      outer.complete();
    }, (lifeCycle: any, _done: any) => {
      assert.equal(lifeCycle.apply, 1);
      assert.equal(lifeCycle.next, 1);
      assert.equal(lifeCycle.error, 0);
      assert.equal(lifeCycle.complete, 1);
      obEtcd.getRaw('upset').subscribe((er) => {
        if (er.isErr()) {
          assert.fail('not found');
        }
        assert.deepEqual(JSON.parse(er.node.value), { 'hello': 'world' });
      }, (err) => {
        assert.fail('no error expected');
      }, () => {
        upsetTester(obEtcd, done, (_lifeCycle: any, outer: rx.Subject<any>) => {
          outer.subscribe(data => {
            assert.deepEqual(data, { 'hello': 'world' });
            _lifeCycle.apply++;
            outer.next({ 'world': 'hello' });
            outer.complete();
          });
        }, (_lifeCycle: any, __done: any) => {
          assert.equal(_lifeCycle.apply, 1);
          assert.equal(_lifeCycle.next, 1);
          assert.equal(_lifeCycle.error, 0);
          assert.equal(_lifeCycle.complete, 1);
          obEtcd.getRaw('upset').subscribe((er) => {
            if (er.isErr()) {
              assert.fail('not found');
            }
            assert.deepEqual(JSON.parse(er.node.value), { 'world': 'hello' });
          }, (err) => {
            assert.fail('no error expected');
          }, () => {
            __done();
          });
        });
      });
    });
  });

  it('upset-set-concurrent', (done) => {
    const uuid = Uuid.v4().toString();
    const wc = etcd.Config.start([
      '--etcd-cluster-id', uuid,
      '--etcd-req-timeout', '200']);
    const obEtcd = etcd.EtcdObservable.create(wc);
    upsetTester(obEtcd, done, (lifeCycle: any, outer: rx.Subject<any>) => {
      if (lifeCycle.appy == 0) {
       upsetTester(obEtcd, done, (_lifeCycle: any, outer: rx.Subject<any>) => {
          outer.subscribe(data => {
            assert.deepEqual(data, { 'hello': 'world' });
            _lifeCycle.apply++;
            outer.next({ 'world': 'hello' });
            outer.complete();
          });
        }, (_lifeCycle: any, __done: any) => {
          assert.equal(_lifeCycle.apply, 1);
          assert.equal(_lifeCycle.next, 1);
          assert.equal(_lifeCycle.error, 0);
          assert.equal(_lifeCycle.complete, 1);
          obEtcd.getRaw('upset').subscribe((er) => {
            if (er.isErr()) {
              assert.fail('not found');
            }
            assert.deepEqual(JSON.parse(er.node.value), { 'world': 'hello' });
          }, (err) => {
            assert.fail('no error expected');
          }, () => {
            __done();
          });
        });
      }
      assert.isNull(outer);
      lifeCycle.apply++;
      outer.next({ 'hello': 'world' });
      outer.complete();
    }, (lifeCycle: any, _done: any) => {
      assert.equal(lifeCycle.apply, 1);
      assert.equal(lifeCycle.next, 1);
      assert.equal(lifeCycle.error, 0);
      assert.equal(lifeCycle.complete, 1);
      obEtcd.getRaw('upset').subscribe((er) => {
        if (er.isErr()) {
          assert.fail('not found');
        }
        assert.deepEqual(JSON.parse(er.node.value), { 'hello': 'world' });
      }, (err) => {
        assert.fail('no error expected');
      }, () => {
        _done();
      });
    });
  });

});
