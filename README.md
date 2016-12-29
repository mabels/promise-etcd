
This is a simple etcd abstraction with a Promise based api.

It provides a simple and purely implemented api to:

  https://coreos.com/etcd/docs/latest/api.html

This api covers the reconnection across the cluster, 
in case of the etcd-server is move or shutdown. And it has
a strategie implementation for the election process 
of a singleton worker within on etcd cluster.


To Run the Tests you need a locally installed etcd 
executable.

ToDo Add the ClientCert Stuff!

The Configuration has these parameters:
  --etcd-cluster-id: "clusterId"
  --etcd-app-id: "AppId"
  --etcd-url: "url1 could be repeated"
  --etcd-retries: "numberOfRetries to find a Working etcd"
  --etcd-wait-time: "wait time between the retries in msec"
  --etcd-req-timeout: "timeout for a single api request"

The Api "Hello World" look like that:

cfg = etcd.Config.start([
  "--etcd-cluster-id", "ClusterWorld",
  "--etcd-app-id", "HelloWorld",
  "--etcd-url", "http://localhost:2379",
])
let etc = etcd.Etcd.create(this.etcdConfig)
await etc.mkdir("Hello/World")


