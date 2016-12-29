import * as cp from 'child_process'
import * as fs from 'fs'

//import { assert } from 'chai'

class EtcdDaemon {
  etcd: cp.ChildProcess
  etcdir: string
  public kill() {
      console.log("KILL:", this.etcdir)
      this.etcd.kill('SIGTERM')
      cp.spawn("rm", ["-r", this.etcdir])
  }
  public static start() : EtcdDaemon {
    let ret = new EtcdDaemon();
    ret.etcdir = fs.mkdtempSync("certor-test-")
    console.log("CREATED:", ret.etcdir)
    ret.etcd = cp.spawn('etcd', ['--data-dir', ret.etcdir])
    ret.etcd.on('error', (err) => {
      console.error("can't spawn etcd")
    });
    ret.etcd.stdin.on('data', (res: string) => {
    //console.log(">>"+res+"<<")
    })
    ret.etcd.stderr.on('data', (res: string) => {
    // console.log(">>"+res+"<<")
    })
    // WAIT FOR started
    return ret;
  }
}

let etcdDaemon = EtcdDaemon.start()
process.on('exit', etcdDaemon.kill.bind(etcdDaemon))

