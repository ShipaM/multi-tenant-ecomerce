import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service.js';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function ResendMock() {
    return { emails: { send: sendMock } };
  }),
}));

const env: Record<string, string> = {
  RESEND_API_KEY: 'test-resend-api-key',
  RESEND_FROM_EMAIL: 'no-reply@example.com',
};

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: (key: string) => env[key] },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends the OTP code and expiry window in the email body', async () => {
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    await service.sendOtp2FAuser(
      'Jane Doe',
      'jane@example.com',
      '123456',
      '5min',
    );

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'no-reply@example.com',
        to: 'jane@example.com',
        subject: expect.stringContaining('Two-Factor'),
        html: expect.stringContaining('123456'),
      }),
    );
  });

  it('turns a Resend failure into a generic 500 instead of leaking the provider error', async () => {
    sendMock.mockRejectedValue(new Error('Resend API is down'));

    await expect(
      service.sendOtp2FAuser('Jane Doe', 'jane@example.com', '123456', '5min'),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
