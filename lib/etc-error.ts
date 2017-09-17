export class EtcError {
  // public reqErr?: rqErr.RequestError;
  // public statusErr?: rqErr.StatusCodeError;
  public statusErr?: number;
  // public transErr?: rqErr.TransformError;
  public unknown?: any;
  public static fromJson(err: any): EtcError {
    let ee = new EtcError();
    // if (typeof (err) == 'RequestError') {
    //   return ee;
    // }
    if (typeof (err.statusCode) == 'number' && err.statusCode != 200) {
      ee.statusErr = err;
      return ee;
    }
    // if (typeof (err) == 'TransformError') {
    //   return ee;
    // }
    ee.unknown = err;
    return ee;
  }
}

export default EtcError;
