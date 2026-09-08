import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/// Last line of defence for anything a route throws. Without it an unexpected
/// error reaches the client as Nest's bare 500 and never appears in the log
/// with the request that caused it.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorBody = {
      statusCode: status,
      ...this.describe(exception, isHttpException, status),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 5xx means we broke something and want the stack; 4xx is the client being
    // told no, which is normal traffic and only worth a one-line note.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${status}`);
    }

    response.status(status).json(body);
  }

  private describe(
    exception: unknown,
    isHttpException: boolean,
    status: number,
  ): Pick<ErrorBody, 'message' | 'error'> {
    if (!isHttpException) {
      // Never forward the raw message: it can carry a stack trace, a SQL
      // fragment or a connection string.
      return {
        message: 'Internal server error',
        error: 'Internal Server Error',
      };
    }

    const payload = (exception as HttpException).getResponse();

    if (typeof payload === 'string') {
      return { message: payload, error: this.reasonPhrase(status) };
    }

    const { message, error } = payload as Partial<ErrorBody>;

    return {
      message: message ?? (exception as HttpException).message,
      error: error ?? this.reasonPhrase(status),
    };
  }

  private reasonPhrase(status: number): string {
    const name = HttpStatus[status] as string | undefined;

    if (!name) {
      return 'Error';
    }

    return name
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
