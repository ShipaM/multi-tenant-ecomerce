import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from './types/jwt-payload.type';
import type { UserAgentInfo } from '../common/types/user-agent.type';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  };

  const currentUser: AuthenticatedUser = {
    userId: 'u1',
    email: 'a@b.com',
    userType: 'PLATFORM_ADMIN',
    sessionId: 's1',
  };

  // What the @ParseUserAgent() decorator hands the controller (a parsed User-Agent).
  const userAgent = (overrides: Partial<UserAgentInfo> = {}): UserAgentInfo => ({
    ua: 'Mozilla/5.0',
    browser: { name: 'Chrome' },
    cpu: {},
    device: { model: 'iPhone' },
    engine: {},
    os: { name: 'iOS' },
    ...overrides,
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes credentials and request context to the service on login', () => {
    controller.login(
      { email: 'a@b.com', password: 'secret' },
      '10.0.0.1',
      userAgent(),
    );

    expect(authService.login).toHaveBeenCalledWith('a@b.com', 'secret', {
      ipAddress: '10.0.0.1',
      device: 'iPhone',
      os: 'iOS',
      browser: 'Chrome',
    });
  });

  it('forwards the refresh token together with the new request context', () => {
    controller.refresh({ refreshToken: 'a.b.c' }, '10.0.0.2', userAgent());

    expect(authService.refresh).toHaveBeenCalledWith('a.b.c', {
      ipAddress: '10.0.0.2',
      device: 'iPhone',
      os: 'iOS',
      browser: 'Chrome',
    });
  });

  it('revokes the session from the token rather than one named by the caller', async () => {
    await expect(controller.logout(currentUser)).resolves.toEqual({
      success: true,
    });

    expect(authService.logout).toHaveBeenCalledWith('u1', 's1');
  });
});
