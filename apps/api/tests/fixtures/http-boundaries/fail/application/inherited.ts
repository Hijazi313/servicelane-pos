class Base extends Error {}
export class Failure extends Base {
  statusCode = 409;
  getStatus() {
    return 409;
  }
}
