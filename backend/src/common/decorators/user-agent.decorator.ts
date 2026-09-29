import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UAParser } from 'ua-parser-js';
import { UserAgentInfo } from '../types/user-agent.type.js';

export const ParseUserAgent = createParamDecorator(
  (date: unknown, context: ExecutionContext): UserAgentInfo => {
    const request = context.switchToHttp().getRequest();
    const uaString = request.headers['user-agent'] || '';

    const parser = new UAParser(uaString);

    return parser.getResult();
  },
);
