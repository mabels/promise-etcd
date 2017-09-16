import { assert } from 'chai';
import * as Uuid from 'node-uuid';
import * as etcd from '../lib/index';

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
    let etc = etcd.Etcd.create(wc);
    await etc.connect();
    console.log('etcd Cluster Booted');
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
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), false);
    return Promise.resolve('done');
  });
  it('selfStat connect good', async () => {
    let wc = etcd.Config.start([
      '--etcd-req-timeout', '50',
      '--etcd-url', 'http://localhost:2379'
    ]);
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.clusterState();
    assert.equal(3, ret.length);
    assert.equal(ret[0].isOk(), true);
    assert.equal(ret[1].isOk(), false);
    assert.equal(ret[2].isOk(), true);
    return Promise.resolve('done');
  });

  it('mkdir', async () => {
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start(['--etcd-cluster-id', uuid]);
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);
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
    let etc = etcd.Etcd.create(wc);

    let ret = await etc.getRaw('hammer/murk');
    assert.equal(ret.isErr(), true);
    ret = await etc.setRaw('hammer/murk', 'Hello World');
    assert.equal(ret.isErr(), false);
    ret = await etc.getRaw('hammer/murk');
    assert.equal(ret.isOk(), true);
    // console.log(ret.node)
    assert.equal(ret.node.value, 'Hello World');
  });

  function updateData(source: etcd.Etcd, ccw: etcd.ChangeWaiter, cnt: any, done: any): void {
    source.setRaw(`wait-for-change/hallo-${cnt.cnt}`, `vallo-${cnt.cnt}`).then(() => {
      if (cnt.cnt == 0) {
        ccw.then((er) => {
          let node = er.node;
          if (er.node.dir) {
            node = er.node.nodes[cnt.cnt];
          }
          // console.log(cnt, er.node, node);
          assert.isTrue(node.key.endsWith(`wait-for-change/hallo-${cnt.cnt}`));
          assert.equal(`vallo-${cnt.cnt}`, node.value);
          cnt.cnt++;
          if (cnt.cnt > 4) {
            done();
          }
          updateData(source, ccw, cnt, done);
        }).catch(() => {
          assert.fail('should never called');
        });
      }
    }).catch(() => {
      assert.fail('should never called');
    });
  }

  it('wait-for-change', (done) => {
    const uuid = Uuid.v4().toString();
    const wc = etcd.Config.start(['--etcd-cluster-id', uuid]);
    const source = etcd.Etcd.create(wc);
    source.mkdir('wait-for-change').then(() => {
      const ccw = source.createChangeWaiter('wait-for-change', { recursive: true });
      const cnt = { cnt: 0 };
      updateData(source, ccw, cnt, () => {
        done();
        // ccw.cancel();
        // source.setRaw(`wait-for-change/cancelled`, `stopped`).then(() => {
        //   done();
        // }).catch(() => {
        //   assert.fail('never called');
        // });
      });
    });
  });

});
