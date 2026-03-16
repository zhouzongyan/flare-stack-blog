import { describe, expect, it, vi } from "vitest";
import type { Auth } from "@/lib/auth/auth.server";
import {
  deleteOAuthConnection,
  listOAuthConnections,
  updateOAuthConnectionScopes,
} from "./oauth-client.service";

function createAuthMock(overrides?: Record<string, unknown>) {
  return {
    api: {
      deleteOAuthConsent: vi.fn(),
      getOAuthClients: vi.fn(),
      getOAuthConsents: vi.fn(),
      updateOAuthConsent: vi.fn(),
      ...overrides,
    } as unknown as Auth["api"],
  } as unknown as Auth;
}

describe("oauth-client service", () => {
  it("combines consents with client metadata", async () => {
    const auth = createAuthMock({
      getOAuthClients: vi.fn().mockResolvedValue([
        {
          client_id: "client_123",
          client_name: "Codex",
          redirect_uris: ["http://localhost:6274/oauth/callback/debug"],
          public: false,
          type: "web",
        },
      ]),
      getOAuthConsents: vi.fn().mockResolvedValue([
        {
          id: "consent_123",
          clientId: "client_123",
          scopes: ["posts:read", "posts:write"],
          createdAt: new Date("2026-03-15T10:00:00.000Z"),
          updatedAt: new Date("2026-03-15T12:00:00.000Z"),
        },
      ]),
    });

    const connections = await listOAuthConnections(auth, new Headers());

    expect(connections).toEqual([
      {
        consentId: "consent_123",
        clientId: "client_123",
        clientName: "Codex",
        clientType: "web",
        createdAt: "2026-03-15T10:00:00.000Z",
        updatedAt: "2026-03-15T12:00:00.000Z",
        public: false,
        redirectUris: ["http://localhost:6274/oauth/callback/debug"],
        scopes: ["posts:read", "posts:write"],
      },
    ]);
  });

  it("updates scopes through consent endpoint", async () => {
    const updateOAuthConsent = vi.fn().mockResolvedValue({
      id: "consent_123",
      scopes: ["posts:read"],
    });
    const auth = createAuthMock({ updateOAuthConsent });

    const result = await updateOAuthConnectionScopes(
      auth,
      {
        consentId: "consent_123",
        scopes: ["posts:read"],
      },
      new Headers(),
    );

    expect(updateOAuthConsent).toHaveBeenCalledWith({
      body: {
        id: "consent_123",
        update: {
          scopes: ["posts:read"],
        },
      },
      headers: expect.any(Headers),
    });
    expect(result).toEqual({
      consentId: "consent_123",
      scopes: ["posts:read"],
    });
  });

  it("deletes a connection through consent revoke endpoint", async () => {
    const deleteOAuthConsent = vi.fn().mockResolvedValue(undefined);
    const auth = createAuthMock({ deleteOAuthConsent });

    await deleteOAuthConnection(auth, "consent_123", new Headers());

    expect(deleteOAuthConsent).toHaveBeenCalledWith({
      body: {
        id: "consent_123",
      },
      headers: expect.any(Headers),
    });
  });
});
