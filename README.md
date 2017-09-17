
[![Build Status](https://travis-ci.org/mabels/promise-etcd.svg?branch=master)](https://travis-ci.org/mabels/promise-etcd)
[![npm](https://img.shields.io/npm/v/promise-etcd.svg)](https://www.npmjs.com/package/promise-etcd)


## PromiseEtcd

This is a simple etcd abstraction with a Promise based api. It written in typescript.
And uses promise-request from

 https://www.npmjs.com/package/request-promise

It provides a simple and purely implemented api to:

  [https://coreos.com/etcd/docs/latest/api.html]

This api covers the reconnection across the cluster,
in case of the etcd-server is move or shutdown.

There is a strategie implementation for the election process of a singleton worker within on etcd cluster.

To Run the Tests you need a locally installed etcd
executable.

ToDo Add the ClientCert Stuff!

The Configuration has these parameters:
  * --etcd-cluster-id: "clusterId"
  * --etcd-app-id: "AppId"
  * --etcd-url: "url1 could be repeated"
  * --etcd-retries: "numberOfRetries to find a Working etcd"
  * --etcd-wait-time: "wait time between the retries in msec"
  * --etcd-req-timeout: "timeout for a single api request"

The Api "Hello World" look like that:

```javascript
cfg = etcd.Config.start([
  "--etcd-cluster-id", "ClusterWorld",
  "--etcd-app-id", "HelloWorld",
  "--etcd-url", "http://localhost:2379",
])
let etc = etcd.Etcd.create(this.etcdConfig)
let ret = await etc.mkdir("Hello/World")
if (ret.isErr()) {
  // i never call reject!
  // every return value
  // has a isErr and isOk Method
}
```

The WaitMaster Strategy is used for elected a master of your
workers. If you have 10 works and you want to elect one of these
workers to a master use the strategy.

```javascript
  await WaitMaster.create("cid", etc, 100, 100,
    () => {
      // Cluster Singleton Activation
    },
    () => {
      // Cluster Singleton Deactivation
    }
  )
}
```

If you want to observe changes of one entry or a directory. You
could create with:

```javascript
  const source = etcd.Etcd.create(wc);
  const ccw = source.createChangeWaiter('wait-for-change', { recursive: true });
```

an instance which allows you to observe the changes with then,catch and if you
need you could cancel/stop the observation. The cancel currently does not abort
the running requests, but stops there processing. 


```javascript
    ccw.then((er) => { /* process your changes */ });
    ccw.catch((er) => { /* catch the error */ });
    ccw.cancel(); /* stop the current then and catches */
```

