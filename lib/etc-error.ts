import { IncomingMessage } from 'http';

export interface EtcError {
  errorCode: number;
  message: string;
  cause: string;
  index: number;
}

export class EtcError {
  // public reqErr?: rqErr.RequestError;
  // public statusErr?: rqErr.StatusCodeError;
  public statusCode?: number;
  public etcErr?: EtcError;
  public respond?: IncomingMessage;
  // public transErr?: rqErr.TransformError;
  public unknown?: any;

  public static fromJson(err: any): EtcError {
    let ee = new EtcError();
    if (err.err) {
      // console.log('Err:', err.err);
      ee.statusCode = err.respond.statusCode;
      ee.respond = err.respond;
      ee.etcErr = err.err;
      return ee;
    }
    // console.log('Err:unknown:', err);
    ee.unknown = err;
    return ee;
  }
}

export default EtcError;
