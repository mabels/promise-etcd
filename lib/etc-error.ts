export class EtcError {
  // public reqErr?: rqErr.RequestError;
  // public statusErr?: rqErr.StatusCodeError;
  public statusErr?: number;
  // public transErr?: rqErr.TransformError;
  public unknown?: any;

  public static fromJson(err: any): EtcError {
    let ee = new EtcError();
    if (err.err && err.err.errorCode) {
      // console.log('Err:', err.err);
      ee.statusErr = err;
      return ee;
    }
    // console.log('Err:unknown:', err);
    ee.unknown = err;
    return ee;
  }
}

export default EtcError;
