import { assert } from 'chai';
import * as Uuid from 'node-uuid';
import * as etcd from '../lib/index';

/*
function param(arr: string[], uuid: string): string[] {
  return arr.concat(['--etcd-cluster-id', uuid, '--etcd-url', 'http://localhost:2379']);
}
*/

function masterCount(wms: etcd.WaitMaster[]): number {
    let mc = 0;
    for (let i = 0; i < wms.length; ++i) {
      if (wms[i].master) {
        ++mc;
      }
    }
    return mc;
}

function stopCount(wms: etcd.WaitMaster[]): number {
    let sc = 0;
    for (let i = 0; i < wms.length; ++i) {
      if (wms[i].stopped) {
        ++sc;
      }
    }
    return sc;
}

function slaves(wms: etcd.WaitMaster[]): etcd.WaitMaster[] {
  return wms.filter((wm) => !wm.master);
}

function master(wms: etcd.WaitMaster[]): etcd.WaitMaster {
  return wms.find((wm) => wm.master);
}

function mastersSum(masters: number[]): number {
  return masters.reduce((a, b) => a + b, 0);
}

describe('wait-master', function(): void {
  this.timeout(10000);
  it('elect-master', async () => {
    // this.timeout(10000)
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start([]);
    let etc = etcd.EtcdObserable.create(wc);
    let masters: number[] = [];
    let waitMasters: etcd.WaitMaster[] = [];
    let totalWaiters = 10;
    for (let i = 0; i < totalWaiters; ++i) {
      masters[i] = 0;
      etcd.WaitMaster.create(uuid, etc, 100, 100,
        ((id): () => void => { return () => { ++masters[id]; }; })(i),
        ((id): () => void => { return () => { --masters[id]; }; })(i),
      ).subscribe(wmc => waitMasters.push(wmc));
    }
    await new Promise((res, rej) => { setTimeout(res, 400); });
    assert.equal(mastersSum(masters), 1, 'master count 1 A');
    assert.equal(masterCount(waitMasters), 1, 'master count 1 B');
    assert.equal(stopCount(waitMasters), 0, 'stop count 0 C');
    await slaves(waitMasters)[0].stop();
    await new Promise((res, rej) => { setTimeout(res, 150); });
    assert.equal(mastersSum(masters), 1, 'master count 1 D');
    assert.equal(masterCount(waitMasters), 1, 'master count 1 E');
    assert.equal(stopCount(waitMasters), 1, 'stop count 1 F');
    await master(waitMasters).stop();
    await new Promise((res, rej) => { setTimeout(res, 200); });
    assert.equal(mastersSum(masters), 1, 'master count 1 G');
    assert.equal(masterCount(waitMasters), 1, 'master count 1 H');
    assert.equal(stopCount(waitMasters), 2, 'stop count 1 I');

    let wm = await etcd.WaitMaster.create(uuid, etc, 100, 100,
      () => assert('will not get the master'), () => assert('do not stop')).toPromise();
    await new Promise((res, rej) => { setTimeout(res, 150); });
    await wm.stop();
    assert.equal(mastersSum(masters), 1, 'master count 1 J');
    assert.equal(masterCount(waitMasters), 1, 'master count 1 K');
    assert.equal(stopCount(waitMasters), 2, 'stop count 1 L');

    await new Promise((res, rej) => { setTimeout(res, 150); });
    let cnt = 0;
    while (master(waitMasters)) {
      ++cnt;
      // console.log('>>>>stop current master', cnt)
      await master(waitMasters).stop();
      await new Promise((res, rej) => { setTimeout(res, 250); });
      // console.log('>>>>waited current master', master(waitMasters))
      if (master(waitMasters)) {
        assert.equal(mastersSum(masters), 1, 'master count 1 M');
        assert.equal(masterCount(waitMasters), 1, 'master count 1 N');
        assert.equal(stopCount(waitMasters), 2 + cnt, `stop count cnt O ${cnt}`);
      } else {
        assert.equal(mastersSum(masters), 0, 'master count 1 M');
        assert.equal(masterCount(waitMasters), 0, 'master count 1 N');
        assert.equal(stopCount(waitMasters), 2 + cnt, `stop count cnt O ${cnt}`);
      }
    }
    assert.equal(totalWaiters, cnt + 2);
    // console.log('DONE')
    return Promise.resolve('done');
  });

});
