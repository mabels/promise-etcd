import LeaderInfo from './leader-info';

export class SelfState {
  public url: string;
  public err: any = null;

  public name: string;
  public id: string;
  public state: string;

  public startTime: Date;
  public leaderInfo: LeaderInfo;

  public recvAppendRequestCnt: number;
  public sendAppendRequestCnt: number;

  public static error(url: string, err: any): SelfState {
    let ret = new SelfState();
    ret.url = url;
    ret.err = err;
    return ret;
  }
  public static ok(url: string, val: string): SelfState {
    let ret = new SelfState();
    ret.url = url;
    let json = JSON.parse(val);
    ret.name = json['name'];
    ret.id = json['id'];
    ret.state = json['state'];
    ret.startTime = new Date(json['startTime']);
    ret.leaderInfo = LeaderInfo.fill(json['leaderInfo']);
    ret.recvAppendRequestCnt = json['recvAppendRequestCnt'];
    ret.sendAppendRequestCnt = json['sendAppendRequestCnt'];
    return ret;
  }
  public isOk(): boolean {
    return this.err == null && this.id.length != 0;
  }

}

export default SelfState;
