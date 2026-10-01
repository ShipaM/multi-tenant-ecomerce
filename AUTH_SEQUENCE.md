# Auth & Account Security — Sequence Diagrams

A compact, diagram-only companion to [`AUTH_FLOW.md`](AUTH_FLOW.md) (the detailed
step-by-step analysis) and [`AUTH_FLOW_RU.pdf`](AUTH_FLOW_RU.pdf) (the Russian
walkthrough with real Network screenshots). Every diagram reflects the current code of
**platform-admin** (React + Redux Toolkit + Axios) and **backend** (NestJS + Prisma +
PostgreSQL + Resend).

Participants used throughout:

| Name in diagrams | What it is |
|---|---|
| Browser / UI | the platform-admin pages and the `authSlice` thunks |
| Axios | `platform-admin/src/lib/axios.ts` (request + 401 interceptors) |
| Guard | `JwtAuthGuard` → `JwtStrategy.validate()` |
| AuthController / AuthService | `backend/src/auth/*` |
| UsersService | `backend/src/users/users.service.ts` |
| DB | PostgreSQL via Prisma (`users`, `user_sessions`, `two_factor_otps`, `password_reset_otps`) |
| Resend | e-mail provider used by `EmailService` |

Quick map of the tokens that appear below:

| Token | Signed with | Lifetime | Purpose |
|---|---|---|---|
| `accessToken` | `JWT_ACCESS_SECRET` | `JWT_ACCESS_EXPIRES_IN` (15m) | authenticates API calls; carries `sid` (session id) |
| `refreshToken` | `JWT_REFRESH_SECRET` | `JWT_REFRESH_EXPIRES_IN` (30d) | rotates the pair; only its HMAC is stored in `user_sessions` |
| `twoFactorToken` | `JWT_2FA_SECRET` | `JWT_2FA_EXPIRES_IN` (15m) | "ticket" between password step and code step of a 2FA login |
| `resetToken` | `JWT_RESET_SECRET` | `JWT_RESET_EXPIRES_IN` (5m) | proves the e-mailed reset code was verified |

---

## 1. Overview — the whole lifecycle

```mermaid
flowchart LR
    A([Sign in]) --> B{2FA enabled?}
    B -- no --> C[Session + token pair]
    B -- yes --> D[Code by e-mail] --> C
    C --> E[Authenticated requests<br/>Bearer accessToken]
    E -->|401| F[Silent refresh<br/>rotate token pair]
    F --> E
    E --> G[Account page:<br/>2FA toggle · change password ·<br/>profile · sessions]
    E --> H([Logout / revoke session])
    I([Forgot password]) --> J[E-mail code] --> K[resetToken] --> L[New password<br/>all sessions revoked]
```

---

## 2. Sign in (with and without 2FA)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as LoginPage / Verify2FaOtpPage
    participant AX as Axios
    participant C as AuthController
    participant S as AuthService
    participant DB as PostgreSQL
    participant R as Resend

    U->>UI: email + password, "Sign in"
    UI->>AX: fetchLogin -> POST /auth/login
    Note over AX: public path, no Authorization header
    AX->>C: { email, password } (ValidationPipe, throttle 10/min)
    C->>S: login(email, password, { ip, device, os, browser })
    S->>DB: findByEmail (citext, case-insensitive)
    S->>S: bcrypt.compare(password, hash ?? dummyHash)
    alt unknown e-mail or wrong password
        S-->>UI: 401 "Invalid email or password"
    else account not ACTIVE
        S-->>UI: 403 "This account is not active"
    else 2FA enabled
        S->>DB: expire live LOGIN OTPs, INSERT two_factor_otps (bcrypt hash, 5 min)
        S->>R: send 6-digit code
        S->>S: sign { userId } with JWT_2FA_SECRET = twoFactorToken
        S-->>UI: 200 { twoFactorRequired: true, twoFactorToken, message }
        UI->>UI: navigate("/auth/2fa", { twoFactorToken })  (nothing stored)
        U->>UI: types the code from the e-mail
        UI->>AX: POST /auth/2fa-verify-login-otp
        AX->>C: { otp, twoFactorToken } (throttle 5/min)
        C->>S: twoFactorVerifyLoginOtp(...)
        S->>S: verify twoFactorToken (else 400 "Session is Expired")
        S->>DB: newest live LOGIN OTP, attempts < 5, bcrypt.compare
        S->>DB: OTP.verifiedAt = now
        S->>DB: INSERT user_sessions (hashed refresh token, ip, os, browser)
        S-->>UI: 200 { accessToken, refreshToken, userType }
    else 2FA disabled
        S->>DB: INSERT user_sessions (hashed refresh token, ip, os, browser)
        S-->>UI: 200 { accessToken, refreshToken, userType }
    end
    UI->>UI: store tokens in localStorage, navigate(redirectTo)
    UI->>AX: fetchMe -> GET /auth/me (Bearer accessToken)
    AX->>C: JwtAuthGuard (see diagram 4)
    C-->>UI: profile without passwordHash / twoFactorSecret
```

---

## 3. Silent token refresh

```mermaid
sequenceDiagram
    autonumber
    participant UI as Any page
    participant AX as Axios (response interceptor)
    participant C as AuthController
    participant S as AuthService
    participant DB as PostgreSQL

    UI->>AX: authenticated request
    AX->>C: Authorization: Bearer <expired accessToken>
    C-->>AX: 401
    Note over AX: not a retry, request had a token, so start ONE shared refresh (pendingRefresh)
    AX->>C: POST /auth/refresh { refreshToken } (throttle 20/min)
    C->>S: refresh(refreshToken, { ip, device, os, browser })
    S->>S: verify JWT signature + expiry (JWT_REFRESH_SECRET)
    S->>DB: load session by sessionId
    S->>S: not revoked, not expired, HMAC matches stored hash (timingSafeEqual)
    S->>S: user still ACTIVE
    S->>S: sign a NEW access + refresh pair (rotation)
    S->>DB: UPDATE session: new refresh hash, expiresAt, lastActiveAt, ip, os, browser
    alt refresh accepted
        S-->>AX: 200 { accessToken, refreshToken }
        AX->>AX: save tokens, replay the original request once
        AX-->>UI: original response
    else refresh rejected (revoked / expired / forged)
        S-->>AX: 401 "Invalid refresh token"
        AX->>AX: clear localStorage
        AX-->>UI: hard redirect to /auth/login
    end
```

---

## 4. Every protected request (what the guard checks)

```mermaid
sequenceDiagram
    autonumber
    participant AX as Axios
    participant G as JwtAuthGuard / JwtStrategy
    participant DB as PostgreSQL
    participant C as Controller

    AX->>G: Authorization: Bearer <accessToken>
    G->>G: extract token, verify signature + expiry (JWT_ACCESS_SECRET)
    G->>DB: find user_sessions by payload.sid
    alt no session, revokedAt set, or expiresAt passed
        G-->>AX: 401 "Session is no longer valid"
    else user.status != ACTIVE
        G-->>AX: 401 "This account is not active"
    else valid
        G->>C: request.user = { userId, email, userType, sessionId }
        C-->>AX: response
    end
    Note over G,DB: the session row is re-read on EVERY request, so a revoked session dies immediately even though its JWT has not expired
```

---

## 5. Two-factor authentication — enable / disable (one toggle)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as TwoFactorAuthentication dialog
    participant C as AuthController
    participant S as AuthService
    participant DB as PostgreSQL
    participant R as Resend

    U->>UI: "Enable" or "Disable", then "Send OTP"
    UI->>C: POST /auth/2fa-generate-otp (Bearer, no body, throttle 5/min)
    C->>S: twoFactorEnable(userId)  purpose = ENABLE_TOGGLE
    S->>DB: expire live ENABLE_TOGGLE OTPs, INSERT two_factor_otps (bcrypt hash, 5 min)
    S->>R: send 6-digit code (failure -> 500, not swallowed)
    S-->>UI: 200 { success, message: "Otp send successfully" }
    U->>UI: types the 6 digits
    UI->>C: POST /auth/2fa-verify-enable { otp } (Bearer, throttle 5/min)
    C->>S: twoFactorVerifyEnable(userId, otp)
    S->>DB: newest live ENABLE_TOGGLE OTP
    alt none / expired
        S-->>UI: 400 "Otp expired or invalid"
    else attempts >= 5
        S-->>UI: 400 "Too many otp attempts"
    else wrong code
        S->>DB: attempts + 1
        S-->>UI: 400 "Invalid Otp"
    else correct
        S->>DB: OTP.verifiedAt = now
        S->>DB: UPDATE users SET two_factor_enabled = NOT two_factor_enabled
        S-->>UI: 200 { success, message: "Two-factor enabled|disabled", data: { twoFactorEnabled } }
    end
```

---

## 6. Change password (signed in)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as ChangePassword form
    participant G as JwtAuthGuard
    participant C as UsersController
    participant S as UsersService
    participant DB as PostgreSQL

    U->>UI: current + new + confirm
    UI->>UI: new === confirm (browser only, confirm is not sent)
    UI->>G: PUT /users/change-password { currentPassword, password }
    G->>C: user = { userId, sessionId }
    C->>S: changePassword(userId, dto, sessionId)   (dto: 8-72 chars)
    S->>DB: findUnique(user)
    S->>S: bcrypt.compare(currentPassword, passwordHash)
    alt current password wrong
        S-->>UI: 401 "Current password is incorrect"
    else correct
        S->>S: bcrypt.hash(new password)
        rect rgb(232, 245, 236)
        Note over S,DB: one $transaction
        S->>DB: UPDATE users SET password_hash, password_updated_at = now()
        S->>DB: UPDATE user_sessions SET revoked_at = now() WHERE id != current sid
        end
        S-->>UI: 200 { success, user, message: "Password changed successfully" }
    end
```

---

## 7. Forgot password — e-mail code → reset token → new password

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FP as ForgotPasswordPage
    participant VO as VerifyForgotOtpPage
    participant RP as ResetPasswordPage
    participant C as AuthController (public, throttle 5/min each)
    participant S as AuthService
    participant US as UsersService
    participant DB as PostgreSQL
    participant R as Resend

    U->>FP: e-mail, "Send OTP"
    FP->>C: POST /auth/forgot-password { email }
    C->>S: forgotPassword(email)
    S->>DB: findUnique(email)
    opt user exists
        S->>DB: INSERT password_reset_otps (bcrypt hash, 5 min, attempts 0)
        S->>R: send 6-digit code
    end
    S-->>FP: 200 { success, message, data: { createdAt } }  (same shape for unknown e-mails)
    FP->>VO: navigate({ email, createdAt })  (router state only)
    Note over VO: countdown from createdAt + 5 min, "Resend Otp" when it hits 0
    U->>VO: types the code
    VO->>C: POST /auth/forgot-password/verify-otp { email, otp }
    C->>S: forgotPasswordOtpVerification(email, otp)
    S->>DB: newest OTP with consumedAt = null and expiresAt in the future
    alt none / expired
        S-->>VO: 400 "Otp expired or invalid"
    else attempts >= 5
        S-->>VO: 400 "Too many otp attempts"
    else wrong code or unknown e-mail
        S->>DB: attempts + 1
        S-->>VO: 400 "Otp does not match"
    else correct
        S->>DB: consumedAt = now
        S->>S: sign { userId, passwordVersion } with JWT_RESET_SECRET (5m) = resetToken
        S-->>VO: 200 { success, message, data: { resetToken } }
    end
    VO->>RP: navigate({ email, resetToken }, replace)
    U->>RP: new password + confirmation (compared in the browser)
    RP->>C: POST /auth/reset-password { resetToken, password }
    C->>S: resetPassword(resetToken, password)
    S->>S: verify resetToken signature + expiry (else 400 Session is Expired)
    S->>US: resetForgottenPassword(userId, { password })
    rect rgb(232, 245, 236)
    Note over US,DB: one $transaction
    US->>DB: UPDATE users SET password_hash, password_updated_at = now()<br/>WHERE password_updated_at = token.passwordVersion
    Note over US,DB: 0 rows updated = token already used, 400 Session is Expired
    US->>DB: UPDATE user_sessions SET revoked_at = now() (ALL live sessions)
    end
    US-->>RP: 200 { success, user, message: "Password changed successfully" }
    RP->>RP: "Password Updated" screen -> link to /auth/login
```

> Hardening (details in `AUTH_FLOW.md`, section 14a): the `resetToken` is single-use because
> it is bound to the password version (`password_updated_at`) it was issued against; an
> invalid or expired token is a `400`; `POST /auth/reset-password` enforces the same 8–72
> character rule as `change-password`. Remaining gap: resetting does not require 2FA.

---

## 8. Active sessions, revoke, logout

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as SessionsList (My account)
    participant G as JwtAuthGuard
    participant C as AuthController
    participant S as AuthService
    participant DB as PostgreSQL

    UI->>G: GET /auth/sessions (Bearer)
    G->>C: user = { userId, sessionId }
    C->>S: listSessions(userId)
    S->>DB: SELECT sessions WHERE user_id AND revoked_at IS NULL ORDER BY last_active_at DESC
    C-->>UI: [{ sessionId, isCurrent, os, browser, device, ipAddress, lastActiveAt, ... }]
    Note over C: isCurrent = (session.id === sid from the access token)

    U->>UI: "Revoke" on another device, confirm
    UI->>G: POST /auth/sessions/:id/revoke
    G->>C: user
    C->>S: revokeSession(userId, id)
    S->>DB: find session
    alt missing or belongs to someone else
        S-->>UI: 400 "Session not found"
    else own session
        S->>DB: UPDATE revoked_at = now()
        S-->>UI: 200 { success: true }
    end
    UI->>G: GET /auth/sessions (refresh the list)

    U->>UI: "Sign out all other sessions"
    UI->>G: POST /auth/sessions/revoke-others
    C->>S: revokeOtherSessions(userId, currentSessionId)
    S->>DB: UPDATE revoked_at = now() WHERE user_id AND revoked_at IS NULL AND id != current
    S-->>UI: 200 { success: true }

    U->>UI: "Log out" (sidebar)
    UI->>G: POST /auth/logout
    C->>S: logout(userId, sessionId)
    S->>DB: UPDATE revoked_at = now() WHERE id = current AND revoked_at IS NULL
    S-->>UI: 200 { success: true }  -> tokens cleared, redirect to /auth/login
```

---

## 9. Edit profile

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as EditProfile form
    participant G as JwtAuthGuard
    participant C as UsersController
    participant S as UsersService
    participant DB as PostgreSQL

    U->>UI: change name / e-mail / phone / photo, "Save changes"
    UI->>G: PUT /users/me { fullName, email, phone, profileImage }
    Note over G: ValidationPipe whitelists exactly these 4 optional fields, so a password field is rejected
    G->>C: user = { userId }
    C->>S: update(userId, dto)
    S->>DB: UPDATE users SET ... (omit passwordHash, twoFactorSecret)
    alt e-mail already used (Prisma P2002)
        S-->>UI: 409 "Email is already in use"
    else ok
        S-->>UI: 200 { success, message: "Updated successfully", user }
        UI->>UI: replace state.auth.user, recompute avatar initials
    end
```

---

## Endpoint index

| Endpoint | Auth | Throttle / min | Diagram |
|---|---|---|---|
| `POST /auth/login` | public | 10 | 2 |
| `POST /auth/2fa-verify-login-otp` | public (`twoFactorToken`) | 5 | 2 |
| `POST /auth/refresh` | public (`refreshToken`) | 20 | 3 |
| `GET /auth/me` | Bearer | — | 2, 4 |
| `POST /auth/2fa-generate-otp` | Bearer | 5 | 5 |
| `POST /auth/2fa-verify-enable` | Bearer | 5 | 5 |
| `PUT /users/change-password` | Bearer | — | 6 |
| `POST /auth/forgot-password` | public | 5 | 7 |
| `POST /auth/forgot-password/verify-otp` | public | 5 | 7 |
| `POST /auth/reset-password` | public (`resetToken`) | 5 | 7 |
| `GET /auth/sessions` | Bearer | — | 8 |
| `POST /auth/sessions/:id/revoke` | Bearer | — | 8 |
| `POST /auth/sessions/revoke-others` | Bearer | — | 8 |
| `POST /auth/logout` | Bearer | — | 8 |
| `PUT /users/me` | Bearer | — | 9 |
