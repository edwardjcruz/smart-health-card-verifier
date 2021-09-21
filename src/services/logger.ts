import { ErrorCode } from './error'

export class LogItem {
  constructor(
    public message: string,
    public code: ErrorCode = 0,
    public logLevel: LogLevels = LogLevels.INFO,
  ) {}
}

export enum LogLevels {
  // Print out everything
  DEBUG = 0,
  // Print out informational messages
  INFO,
  // Only print out warnings
  WARNING,
  // Only print out errors
  ERROR,
  // Only print out fatal errors, where processing can't continue
  FATAL,
}

// eslint-disable-next-line no-var
export default class Log {
  public child: Log[] = []
  public log: LogItem[] = []
  // static exclusion list, because each Log object is constructed in different files
  public static Exclusions: Set<ErrorCode> = new Set<ErrorCode>()
  private _exitCode = 0

  constructor(public title: string = '') {}

  public get exitCode(): number {
    this.child.forEach((c) => {
      // set this exit code to the child if it's currently 0
      this._exitCode = this._exitCode || c.exitCode
    })

    return this._exitCode
  }

  debug(message: string): Log {
    this.log.push(new LogItem(message, 0, LogLevels.DEBUG))
    return this
  }

  info(message: string): Log {
    this.log.push(new LogItem(message, 0, LogLevels.INFO))
    return this
  }

  warn(message: string, code: ErrorCode = ErrorCode.ERROR): Log {
    if (code == null || code <= 0) {
      throw new Error('Non-zero error code required.')
    }
    if (!Log.Exclusions.has(code)) {
      this.log.push(new LogItem(message, code, LogLevels.WARNING))
    }
    return this
  }

  error(message: string, code: ErrorCode = ErrorCode.ERROR): Log {
    if (code == null || code <= 0) {
      throw new Error('Non-zero error code required.')
    }
    if (!Log.Exclusions.has(code)) {
      this.log.push(new LogItem(message, code, LogLevels.ERROR))
    }
    return this
  }

  fatal(message: string, code: ErrorCode = ErrorCode.ERROR): Log {
    if (code == null || code <= 0) {
      throw new Error('Non-zero error code required.')
    }
    if (this._exitCode !== 0) {
      throw new Error('Exit code overwritten. Should only have one fatal error.')
    }
    this._exitCode = code
    this.log.push(new LogItem(message, code, LogLevels.FATAL))
    return this
  }

  get(level: LogLevels): LogItem[] {
    return this.log.filter((item) => {
      return item.logLevel === level
    })
  }

  // collects errors from all children into a single collection; specify level to filter >= level
  flatten(
    level: LogLevels = LogLevels.DEBUG,
  ): { title: string; message: string; code: ErrorCode; level: LogLevels }[] {
    let items = this.log
      .filter((item) => {
        return item.logLevel >= level
      })
      .map((e) => {
        return { title: this.title, message: e.message, code: e.code, level: e.logLevel }
      })

    this.child.forEach((c) => (items = items.concat(c.flatten(level))))

    return items
  }

  toString(level: LogLevels = LogLevels.INFO): string {
    return formatOutput(this, level).join('\n')
  }
}

function list(title: string, items: LogItem[]) {
  const results: string[] = items.length ? [title] : []

  items.forEach((e) => {
    const lines = e.message.split('\n')
    lines.forEach((l, i) => results.push((i === 0 ? '  · ' : '  ') + l))
  })

  return results
}

function formatOutput(outputTree: Log, level: LogLevels): string[] {
  let results: string[] = []
  // remove empty entries
  results = results.filter((r) => r.length)

  return results
}
