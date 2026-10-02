import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchSessionsList,
  revokeOtherSessions,
  revokeSession,
} from "./sessions.thunks";
import { itBehavesLikeSimpleThunk, makeStore } from "./thunk-test-utils";

const api = vi.hoisted(() => ({
  sessions: vi.fn(),
  sessionRevoke: vi.fn(),
  sessionRevokeOthers: vi.fn(),
}));

vi.mock("@/api/auth", () => ({ authApi: api }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("fetchSessionsList", () => {
  const sessions = [{ id: "s1" }, { id: "s2" }];

  itBehavesLikeSimpleThunk({
    api: api.sessions,
    run: (store) => store.dispatch(fetchSessionsList()),
    expectedArgs: [],
    data: sessions,
    fallback: "Failed to fetch sessions",
  });

  it("stores the sessions and clears the loading flag", async () => {
    api.sessions.mockResolvedValue(sessions);
    const store = makeStore();

    const pending = store.dispatch(fetchSessionsList());
    expect(store.getState().auth.isSessionsLoading).toBe(true);
    await pending;

    expect(store.getState().auth.isSessionsLoading).toBe(false);
    expect(store.getState().auth.sessions).toEqual(sessions);
  });

  it("empties the sessions when loading fails", async () => {
    api.sessions.mockResolvedValueOnce(sessions);
    const store = makeStore();
    await store.dispatch(fetchSessionsList());

    api.sessions.mockRejectedValueOnce(new Error("boom"));
    await store.dispatch(fetchSessionsList());

    expect(store.getState().auth.sessions).toEqual([]);
    expect(store.getState().auth.isSessionsLoading).toBe(false);
  });
});

describe("revokeSession", () => {
  const payload = { sessionId: "s1" };

  itBehavesLikeSimpleThunk({
    api: api.sessionRevoke,
    run: (store) => store.dispatch(revokeSession(payload as never)),
    expectedArgs: [payload],
    data: { success: true },
    fallback: "Failed to revoke the session",
  });
});

describe("revokeOtherSessions", () => {
  itBehavesLikeSimpleThunk({
    api: api.sessionRevokeOthers,
    run: (store) => store.dispatch(revokeOtherSessions()),
    expectedArgs: [],
    data: { success: true },
    fallback: "Failed to sign out other sessions",
  });
});
