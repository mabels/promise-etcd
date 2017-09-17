
export class EtcValueNode {
  public createIndex: number;
  public key: string;
  public modifiedIndex: number;
  public value: string;
  public dir: boolean = false;
  public nodes: EtcValueNode[] = null;

  public static fromJson(js: any, val: EtcValueNode = null): EtcValueNode {
    if (!val) {
      val = new EtcValueNode();
    }
    val.createIndex = js['createIndex'];
    val.key = js['key'];
    val.modifiedIndex = js['modifiedIndex'];
    val.value = js['value'];
    val.dir = js['dir'] || false;
    if (val.dir) {
      val.nodes = (js['nodes'] || []).map((n: any) => EtcValueNode.fromJson(n));
    }
    return val;
  }
}

export default EtcValueNode;
