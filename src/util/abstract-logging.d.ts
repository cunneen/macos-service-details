declare module 'abstract-logging' {

  export interface LoggerType  {
    trace(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
    fatal(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;

    get logger(): LoggerType;
  }

  export default LoggerType.get;
}