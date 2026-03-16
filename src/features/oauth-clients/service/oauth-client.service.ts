import type { Auth } from "@/lib/auth/auth.server";
import type {
  OAuthConnectionRecord,
  UpdateOAuthConnectionScopesInput,
} from "../schema/oauth-client.schema";

type OAuthClientInfo = {
  clientId: string;
  clientName: string | null;
  clientType: OAuthConnectionRecord["clientType"];
  public: boolean;
  redirectUris: string[];
};

function parseStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toIsoString(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(0).toISOString();
}

function mapOAuthClientInfo(client: Record<string, unknown>): OAuthClientInfo {
  return {
    clientId: typeof client.client_id === "string" ? client.client_id : "",
    clientName:
      typeof client.client_name === "string" ? client.client_name : null,
    clientType:
      typeof client.type === "string"
        ? (client.type as OAuthConnectionRecord["clientType"])
        : null,
    public: client.public === true,
    redirectUris: parseStringArray(client.redirect_uris),
  };
}

function mapOAuthConnection(
  consent: Record<string, unknown>,
  clientsById: Map<string, OAuthClientInfo>,
): OAuthConnectionRecord {
  const clientId = typeof consent.clientId === "string" ? consent.clientId : "";
  const client = clientsById.get(clientId);

  return {
    consentId: typeof consent.id === "string" ? consent.id : "",
    clientId,
    clientName: client?.clientName ?? null,
    clientType: client?.clientType ?? null,
    createdAt: toIsoString(consent.createdAt),
    updatedAt: toIsoString(consent.updatedAt),
    public: client?.public ?? false,
    redirectUris: client?.redirectUris ?? [],
    scopes: parseStringArray(consent.scopes) as OAuthConnectionRecord["scopes"],
  };
}

export async function listOAuthConnections(auth: Auth, headers: Headers) {
  const [clients, consents] = await Promise.all([
    auth.api.getOAuthClients({ headers }),
    auth.api.getOAuthConsents({ headers }),
  ]);

  const clientsById = new Map(
    (clients ?? []).map((client) => {
      const normalizedClient = mapOAuthClientInfo(
        client as Record<string, unknown>,
      );
      return [normalizedClient.clientId, normalizedClient] as const;
    }),
  );

  return (consents ?? [])
    .map((consent) =>
      mapOAuthConnection(consent as Record<string, unknown>, clientsById),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function updateOAuthConnectionScopes(
  auth: Auth,
  data: UpdateOAuthConnectionScopesInput,
  headers: Headers,
) {
  const consent = await auth.api.updateOAuthConsent({
    body: {
      id: data.consentId,
      update: {
        scopes: data.scopes,
      },
    },
    headers,
  });

  return {
    consentId: consent?.id ?? data.consentId,
    scopes: parseStringArray(
      consent?.scopes,
    ) as OAuthConnectionRecord["scopes"],
  };
}

export async function deleteOAuthConnection(
  auth: Auth,
  consentId: string,
  headers: Headers,
) {
  await auth.api.deleteOAuthConsent({
    body: {
      id: consentId,
    },
    headers,
  });

  return { success: true };
}
