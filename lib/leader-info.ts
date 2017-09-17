export class LeaderInfo {
  public leader: string;
  public uptime: string;
  public startTime: Date;
  public static fill(js: any): LeaderInfo {
    let ret = new LeaderInfo();
    ret.leader = js['leader'];
    ret.uptime = js['uptime'];
    ret.startTime = new Date(js['startTime']);
    return ret;
  }
}

export default LeaderInfo;
