import * as request from 'request';
import { assert } from 'chai';
import * as Uuid from 'uuid';
import * as etcd from '../lib/index';
import * as rx from 'rxjs';

/*
function param(arr: string[], uuid: string): string[] {
  return arr.concat(['--etcd-cluster-id', uuid, '--etcd-url', 'http://localhost:2379']);
}
*/

function largeTest(): any {
  return { name: 'test',
    nodes: [ { name: 'test-node', binds: [null] } ],
    tls: {
     tlsChain: null,
     tlsCert: `-----BEGIN CERTIFICATE-----
     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
     -----END CERTIFICATE-----`,
     tlsKey: `-----BEGIN PRIVATE KEY-----
     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
     ezYa3gWA157rBXTRLCtKQzXuU9Qpyw==
     -----END PRIVATE KEY-----`
    }
  };
}

describe('etcd', function (): void {
  this.timeout(2000);
  before(async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379'
    ]).setRequest(request);
    console.log('etcd Cluster Booted...0');
    let etc = etcd.EtcdPromise.create(wc);
    console.log('etcd Cluster Booted...1');
    await etc.connect();
    console.log('etcd Cluster Booted...2');
    return Promise.resolve('done');
  });

  it('AsyncPromise Blocking', async () => {
    let value = 1;
    const out = new Promise(async (r, j) => {
      await new Promise((rr, jj) => { setTimeout(rr, 10); });
      ++value;
    });
    out.then(t => { /* */ });
    assert.equal(value, 1);
    await new Promise((rr, jj) => { setTimeout(rr, 15); });
    assert.equal(value, 2);
    return Promise.resolve('done');
  });

  it('selfStat one good', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379'
    ]).setRequest(request);
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
    ]).setRequest(request);
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
    ]).setRequest(request);
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
    ]).setRequest(request);
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
    ]).setRequest(request);
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
    ]).setRequest(request);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), false);
    return Promise.resolve('done');
  });
  it('selfStat connect good', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379'
    ]).setRequest(request);
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
    ]).setRequest(request);
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
    ]).setRequest(request);
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
    ]).setRequest(request);
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
    ]).setRequest(request);
    let etc = etcd.EtcdPromise.create(wc);
    let ret = await etc.clusterState();
    assert.equal(3, ret.length);
    assert.equal(ret[0].isOk(), true);
    assert.equal(ret[1].isOk(), false);
    assert.equal(ret[2].isOk(), true);
    return Promise.resolve('done');
  });

  it('large set raw', async () => {
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]).setRequest(request);
    let etc = etcd.EtcdPromise.create(wc);
    const set_json = JSON.stringify(largeTest(), null, 2);
    let ret = await etc.setRaw('largeset', set_json);
    assert.equal(ret.isErr(), false);
    assert.equal(ret.node.value, set_json);
    ret = await etc.getRaw('largeset');
    assert.equal(ret.isErr(), false);
    assert.equal(ret.node.value, set_json);
  });

  it('large set json', async () => {
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]).setRequest(request);
    let etc = etcd.EtcdPromise.create(wc);
    const set_json = JSON.stringify(largeTest(), null, 2);
    let ret = await etc.setJson('largeset', largeTest());
    assert.equal(ret.isErr(), false);
    assert.equal(JSON.stringify(JSON.parse(ret.node.value), null, 2), set_json);
    let data = await etc.getJson('largeset');
    assert.equal(data.isErr(), false);
    assert.equal(JSON.stringify(data.value, null, 2), set_json);
  });

  it('empty-list', async () => {
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]).setRequest(request);
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
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]).setRequest(request);
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
    // assert.equal(ret.err.statusCode, 404);
    // assert.equal(ret.err.etcErr.errorCode, 100);
  });

  it('rmdir', async () => {
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]).setRequest(request);
    let etc = etcd.EtcdPromise.create(wc);
    await etc.mkdir('meno');
    await etc.mkdir('meno/geheim');
    await etc.mkdir('meno/geheim/ganz');
    let ret = await etc.rmdir('meno', { recursive: true });
    // console.log(ret);
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
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]).setRequest(request);
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
    assert.equal(nested, 0);
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
      '--etcd-req-timeout', '200']).setRequest(request);
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
    apply: (lc: any, inp: any, sub: rx.Subject<any>) => void, test: (lc: any, done: any) => void): void {
    const lifeCycle = {
      apply: 0,
      next: 0,
      error: 0,
      complete: 0
    };
    const upset = etcd.Upset.create(obEtcd).upSet('upset', (inp: any, obs: rx.Subject<any>) => {
      // console.log('apply');
      apply(lifeCycle, inp, obs);
    });
    const completed = new rx.Subject<void>();
    upset.subscribe(() => {
      // console.log('next');
      lifeCycle.next++;
    }, (error: any) => {
      // console.log('error');
      lifeCycle.error++;
    }, () => {
      // console.log('complete');
      lifeCycle.complete++;
      completed.complete();
    });
    completed.subscribe(null, null, () => {
      // console.log('2-next', lifeCycle);
      test(lifeCycle, done);
    });
  }

  it('upset-empty-noopt', (done) => {
    const uuid = Uuid.v4().toString();
    const wc = etcd.Config.start([
      '--etcd-cluster-id', uuid,
      '--etcd-req-timeout', '200']).setRequest(request);
    const obEtcd = etcd.EtcdObservable.create(wc);
    upsetTester(obEtcd, done, (lifeCycle: any, inp: any, outer: rx.Subject<any>) => {
      assert.isNull(inp);
      lifeCycle.apply++;
      outer.complete();
    }, (lifeCycle: any, _done: any) => {
      assert.equal(lifeCycle.apply, 1);
      assert.equal(lifeCycle.next, 0);
      assert.equal(lifeCycle.error, 0);
      assert.equal(lifeCycle.complete, 1);
      obEtcd.getRaw('upset').subscribe((er) => {
        if (er.isErr() && er.err.etcErr.errorCode == 100) {
          return;
        }
        assert.fail('never reached');
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
      '--etcd-req-timeout', '200']).setRequest(request);
    const obEtcd = etcd.EtcdObservable.create(wc);
    upsetTester(obEtcd, done, (lifeCycle: any, inp: any, outer: rx.Subject<any>) => {
      assert.isNull(inp);
      lifeCycle.apply++;
      outer.next({ 'hello': 'world' });
      outer.complete();
    }, (lifeCycle: any, _done: any) => {
      assert.equal(lifeCycle.apply, 1);
      assert.equal(lifeCycle.next, 1);
      assert.equal(lifeCycle.error, 0);
      assert.equal(lifeCycle.complete, 1);
      // wc.log.info('empty-set:0');
      obEtcd.getRaw('upset').subscribe((er) => {
        // wc.log.info('empty-set:1');
        if (er.isErr()) {
          // wc.log.info('empty-set:2');
          assert.fail('not found');
        }
        // wc.log.info('empty-set:3');
        assert.deepEqual(JSON.parse(er.node.value), { 'hello': 'world' });
      }, (err) => {
        // wc.log.info('empty-set:4');
        assert.fail('no error expected');
      }, () => {
        // wc.log.info('empty-set:5');
        _done();
      });
    });
  });

  it('upset-from-nonempty-set', (done) => {
    const uuid = Uuid.v4().toString();
    const wc = etcd.Config.start([
      '--etcd-cluster-id', uuid,
      '--etcd-req-timeout', '200']).setRequest(request);
    const obEtcd = etcd.EtcdObservable.create(wc);
    upsetTester(obEtcd, done, (lifeCycle: any, inp: any, outer: rx.Subject<any>) => {
      assert.isNull(inp);
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
        upsetTester(obEtcd, done, (_lifeCycle: any, inp: any, outer: rx.Subject<any>) => {
          assert.deepEqual(inp, { 'hello': 'world' });
          _lifeCycle.apply++;
          outer.next({ 'world': 'hello' });
          outer.complete();
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
      '--etcd-req-timeout', '200']).setRequest(request);
    const obEtcd = etcd.EtcdObservable.create(wc);
    upsetTester(obEtcd, done, (lifeCycle: any, inp: any, outer: rx.Subject<any>) => {
      if (lifeCycle.apply == 0) {
        // console.log('apply:0');
        upsetTester(obEtcd, done, (_lifeCycle: any, _inp: any, _outer: rx.Subject<any>) => {
          assert.isNull(_inp);
          _lifeCycle.apply++;
          _outer.next({ 'hello': 'world' });
          _outer.complete();
        }, (_lifeCycle: any, __done: any) => {
          assert.equal(_lifeCycle.apply, 1);
          assert.equal(_lifeCycle.next, 1);
          assert.equal(_lifeCycle.error, 0);
          assert.equal(_lifeCycle.complete, 1);
          obEtcd.getRaw('upset').subscribe((er) => {
            if (er.isErr()) {
              assert.fail('not found');
            }
            assert.deepEqual(JSON.parse(er.node.value), { 'hello': 'world' });
            // wc.log.info('inner.upset:next');
          }, (err) => {
            assert.fail('no error expected');
          }, () => {
            // wc.log.info('inner.upset:complete:0');
            assert.isNull(inp);
            lifeCycle.apply++;
            outer.next({ 'world': 'hello' });
            outer.complete();
            // wc.log.info('inner.upset:complete:1');
          });
        });
      } else {
        // console.log('apply:1');
        assert.deepEqual(inp, { 'hello': 'world' });
        lifeCycle.apply++;
        outer.next({ 'world': 'hello' });
        outer.complete();
      }
    }, (lifeCycle: any, _done: any) => {
      assert.equal(lifeCycle.apply, 2);
      assert.equal(lifeCycle.next, 1);
      assert.equal(lifeCycle.error, 0);
      assert.equal(lifeCycle.complete, 1);
      obEtcd.getRaw('upset').subscribe((er) => {
        if (er.isErr()) {
          assert.fail('not found');
        }
        assert.deepEqual(JSON.parse(er.node.value), { 'world': 'hello' });
      }, (err) => {
        assert.fail('no error expected');
      }, () => {
        _done();
      });
    });
  });

});
