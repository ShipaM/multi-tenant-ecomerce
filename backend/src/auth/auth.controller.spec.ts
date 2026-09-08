import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from './types/jwt-payload.type.js';

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

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      // The guard is exercised through JwtStrategy elsewhere; stubbing it here
      // keeps these tests about the controller's own wiring.
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
      'curl/8',
    );

    expect(authService.login).toHaveBeenCalledWith('a@b.com', 'secret', {
      ipAddress: '10.0.0.1',
      deviceLabel: 'curl/8',
    });
  });

  it('forwards the refresh token together with the new request context', () => {
    controller.refresh({ refreshToken: 'a.b.c' }, '10.0.0.2', 'curl/9');

    expect(authService.refresh).toHaveBeenCalledWith('a.b.c', {
      ipAddress: '10.0.0.2',
      deviceLabel: 'curl/9',
    });
  });

  it('revokes the session from the token rather than one named by the caller', () => {
    controller.logout(currentUser);

    expect(authService.logout).toHaveBeenCalledWith('s1');
  });
});
