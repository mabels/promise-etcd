
import { assert } from 'chai';

import * as Uuid from 'node-uuid'

import * as etcd from '../src/etcd'


function param(arr: string[], uuid: string) : string[] {
  return arr.concat(['--etcd-cluster-id', uuid, '--etcd-url', "http://localhost:2379"])
}

describe("etcd", function() {
  this.timeout(2000)
  before(async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://localhost:2379"
    ])
    let etc = etcd.Etcd.create(wc);
    await etc.connect()
    console.log("etcd Cluster Booted")
    return Promise.resolve("done")
  })
  it("AsyncPromise Blocking", async () => {
    let value = 1
    let test = new Promise(async (r,j) => {
      await new Promise((rr, jj) => { setTimeout(rr, 10) })
      ++value 
    })
    assert.equal(value, 1)
    await new Promise((rr, jj) => { setTimeout(rr, 15) })
    assert.equal(value, 2)
    return Promise.resolve("done")
  })

  it("selfStat one good", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://localhost:2379"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.clusterState();
    assert.equal(1, ret.length)
    // console.log(ret[0])
    assert.equal(ret[0].isOk(), true)
    assert.equal(ret[0].url, "http://localhost:2379")
    return Promise.resolve("done")
  })

  it("selfStat two same good", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://localhost:2379",
      '--etcd-url', "http://localhost:2379"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.clusterState();
    assert.equal(2, ret.length)
    assert.equal(ret[0].isOk(), true)
    assert.equal(ret[0].url, "http://localhost:2379")
    assert.equal(ret[1].isOk(), true)
    assert.equal(ret[1].url, "http://localhost:2379")
    return Promise.resolve("done")
  })

    
  it("selfStat same good", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://localhost:2379",
      '--etcd-url', "http://localhost:2379",
      '--etcd-url', "http://localhost:2379",
      '--etcd-url', "http://localhost:2379"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.clusterState();
    assert.equal(4, ret.length)
    assert.equal(ret[0].isOk(), true)
    assert.equal(ret[0].url, "http://localhost:2379")
    return Promise.resolve("done")
  })

 it("selfStat connect", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://localhost:2379"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), true, "isok")
    assert.equal(ret.url, "http://localhost:2379", "url")
    return Promise.resolve("done")
  })

  it("selfStat clusterState bad", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://169.254.99.94"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.clusterState();
    assert.equal(1, ret.length)
    assert.equal(ret[0].isOk(), false)
    return Promise.resolve("done")
  })
  it("selfStat connect bad", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://169.254.99.94",
      '--etcd-url', "http://169.254.99.95"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), false)
    return Promise.resolve("done")
  })
  it("selfStat connect good", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://localhost:2379"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), true)
    return Promise.resolve("done")
  })

  it("selfStat connect two good", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://localhost:2379",
      '--etcd-url', "http://127.0.0.1:2379"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), true)
    return Promise.resolve("done")
  })

  it("selfStat connect two good", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://localhost:2379",
      '--etcd-url', "http://169.254.55.99",
      '--etcd-url', "http://127.0.0.1:2379"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.connect();
    assert.equal(ret.isOk(), true)
    return Promise.resolve("done")
  })

  it("selfStat one good one bad", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://localhost:2379",
      '--etcd-url', "http://169.254.99.94"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.clusterState();
    assert.equal(2, ret.length)
    assert.equal(ret[0].isOk(), true)
    assert.equal(ret[1].isOk(), false)
    return Promise.resolve("done")
  })

  it("selfStat two good one bad", async () => {
    let wc = etcd.Config.start([
      "--etcd-req-timeout", "50",
      '--etcd-url', "http://localhost:2379",
      '--etcd-url', "http://169.254.99.94",
      '--etcd-url', "http://127.0.0.1:2379"
    ])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.clusterState();
    assert.equal(3, ret.length)
    assert.equal(ret[0].isOk(), true)
    assert.equal(ret[1].isOk(), false)
    assert.equal(ret[2].isOk(), true)
    return Promise.resolve("done")
  })

  it("mkdir", async () => {
    let uuid = Uuid.v4().toString();
    let wc = etcd.Config.start(["--etcd-cluster-id", uuid])
    let etc = etcd.Etcd.create(wc);
    let ret = await etc.mkdir("meno")
    assert.equal(ret.isErr(), false)
    ret = await etc.mkdir("meno")
    assert.equal(ret.isErr(), true)

    let lst = await etc.list("meno")
    assert.equal(lst.isErr(), false)
    assert.equal(lst.value.length, [])

    ret = await etc.rmdir("meno")
    // console.log(ret)
    assert.equal(ret.isOk(), true)
  })

})


