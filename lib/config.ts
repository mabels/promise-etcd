//  import * as yargs from 'yargs';
const clap = require('clap');

export interface Response {
  headers: { [id: string]: string };
  statusCode: number;
}

export interface Request {
  on(a: 'error', cb: (err: Error) => void): void;
  on(a: 'data', cb: (data: string) => void): void;
  on(a: 'complete', cb: (resp: Response) => void): void;
}

export interface Log {
  debug(...arg: any[]): void;
  error(...arg: any[]): void;
  info(...arg: any[]): void;
}

const ConsoleLog: Log = {
  debug(...arg: any[]): void { console.log.apply(console, arg); },
  error(...arg: any[]): void { console.error.apply(console, arg); },
  info(...arg: any[]): void { console.log.apply(console, arg); }
};

export class Config {
  public urls: string[];
  public reqTimeout: number; // msec
  public retries: number;
  public waitTime: number; // ms
  public clusterId: string;
  public appId: string;
  public log: Log;
  public request: (o: any) => Request;
  public static start(argv: string[], req: (o: any) => Request, log: Log = ConsoleLog, app?: string): Config {
    let ret = new Config();
    ret.log = log;
    ret.request = req;

    const urls: string[] = [];
    const myClap = clap.create('promise-etcd', '')
      .option('--etcd-cluster-id <arg>', 'require etcd-cluster-id')
      .option('--etcd-app-id <arg>', 'optional etcd-app-id')
      .option('--etcd-url <arg>', 'require etcd-url', (value: string) => {
        urls.push(value);
        return urls;
      })
      .option('--etcd-retries <arg>', 'require etcd-retries', (value: string) => {
        return ~~value || 3;
      }, 3)
      .option('--etcd-wait-time <arg>', 'require etcd-wait-time', (value: string) => {
        return ~~value || 250;
      }, 250)
      .option('--etcd-req-timeout <arg>', 'require etcd-req-timeout', (value: string) => {
        return ~~value;
      }, 500);
    myClap.run(argv);
    console.log(argv, myClap.values);
    const yarg = myClap.values;
    // let yarg = yargs.usage('$0 [args]')
    //   // .option('logLevel', {
    //   //   describe: 'logLevel ala winston',
    //   //   default: 'info'
    //   // })
    //   .option('etcd-cluster-id', {
    //     describe: 'etcd-cluster-id',
    //     default: null
    //   })
    //   .option('etcd-app-id', {
    //     describe: 'etcd-app-id',
    //     default: app || 'promise-etcd'
    //   })
    //   .option('etcd-url', {
    //     describe: 'multiple etcd-url',
    //     default: ['http://localhost:2379'],
    //     array: true
    //   })
    //   .option('etcd-retries', {
    //     describe: 'retry count',
    //     number: true,
    //     default: 3
    //   })
    //   .option('etcd-wait-time', {
    //     describe: 'wait time',
    //     number: true,
    //     default: 250
    //   })
    //   .option('etcd-req-timeout', {
    //     describe: 'req timeout',
    //     number: true,
    //     default: 500
    //   }).help().parse(argv);

    ret.urls = yarg.etcdUrl || ['http://localhost:2379'];
    ret.reqTimeout = yarg.etcdReqTimeout;
    ret.retries = yarg.etcdRetries || 3;
    ret.waitTime = yarg.etcdWaitTime || 250;
    ret.clusterId = yarg.etcdClusterId;
    ret.appId = yarg.etcdAppId || 'promise-etcd';

    ret.log.debug('Config:', ret.urls, ret.reqTimeout,
      ret.retries, ret.waitTime, ret.clusterId, ret.appId);
    return ret;
  }
}

export default Config;
