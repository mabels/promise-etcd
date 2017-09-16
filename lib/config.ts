import * as winston from 'winston';
import * as yargs from 'yargs';

export class Config {
  public urls: string[];
  public reqTimeout: number; // msec
  public retries: number;
  public waitTime: number; // ms
  public clusterId: string;
  public appId: string;
  public log: winston.LoggerInstance;
  public static start(argv: string[], app: string = null): Config {
    let ret = new Config();
    let yarg = yargs.usage('$0 [args]')
      .option('logLevel', {
        describe: 'logLevel ala winston',
        default: 'info'
      })
      .option('etcd-cluster-id', {
        describe: 'etcd-cluster-id',
        default: null
      })
      .option('etcd-app-id', {
        describe: 'etcd-app-id',
        default: app
      })
      .option('etcd-url', {
        describe: 'multiple etcd-url',
        default: ['http://localhost:2379'],
        array: true
      })
      .option('etcd-retries', {
        describe: 'retry count',
        number: true,
        default: 3
      })
      .option('etcd-wait-time', {
        describe: 'wait time',
        number: true,
        default: 250
      })
      .option('etcd-req-timeout', {
        describe: 'req timeout',
        number: true,
        default: 500
      }).help().parse(argv);

    ret.urls = yarg.etcdUrl;
    ret.reqTimeout = yarg.etcdReqTimeout;
    ret.retries = yarg.etcdRetries;
    ret.waitTime = yarg.etcdWaitTime;
    ret.clusterId = yarg.etcdClusterId;
    ret.appId = yarg.etcdAppId;
    ret.log = new winston.Logger({
      level: yarg.logLevel,
      transports: [
        new (winston.transports.Console)(),
      ]
    });
    ret.log.debug('Config:', ret.urls, ret.reqTimeout,
      ret.retries, ret.waitTime, ret.clusterId, ret.appId);
    return ret;
  }
}

export default Config;
