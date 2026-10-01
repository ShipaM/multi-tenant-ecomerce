import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ResetPasswordDto } from './reset-password.dto';

const errorsFor = (body: object) =>
  validate(plainToInstance(ResetPasswordDto, body));

describe('ResetPasswordDto', () => {
  it('accepts a token and a password of 8 to 72 characters', async () => {
    expect(
      await errorsFor({ resetToken: 'a.b.c', password: 'x'.repeat(8) }),
    ).toHaveLength(0);
    expect(
      await errorsFor({ resetToken: 'a.b.c', password: 'x'.repeat(72) }),
    ).toHaveLength(0);
  });

  it('rejects a password that is too short or longer than bcrypt reads', async () => {
    expect(
      (await errorsFor({ resetToken: 'a.b.c', password: 'short' })).map(
        (e) => e.property,
      ),
    ).toEqual(['password']);
    expect(
      (
        await errorsFor({ resetToken: 'a.b.c', password: 'x'.repeat(73) })
      ).map((e) => e.property),
    ).toEqual(['password']);
  });

  it('rejects an empty reset token', async () => {
    expect(
      (await errorsFor({ resetToken: '', password: 'x'.repeat(8) })).map(
        (e) => e.property,
      ),
    ).toEqual(['resetToken']);
  });
});
