import { z } from "zod";
import { OAUTH_PROVIDER_SCOPES } from "@/features/oauth-provider/oauth-provider.config";

const OAUTH_SCOPE_SET = new Set<string>(OAUTH_PROVIDER_SCOPES);

export const OAuthClientTypeSchema = z.enum([
  "web",
  "native",
  "user-agent-based",
]);

export const OAuthScopeListSchema = z
  .array(z.string())
  .refine(
    (scopes) => scopes.every((scope) => OAUTH_SCOPE_SET.has(scope)),
    "Invalid scope",
  );

export const OAuthConnectionSchema = z.object({
  consentId: z.string(),
  clientId: z.string(),
  clientName: z.string().nullable(),
  clientType: OAuthClientTypeSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  public: z.boolean(),
  redirectUris: z.array(z.string()),
  scopes: OAuthScopeListSchema,
});

export const UpdateOAuthConnectionScopesInputSchema = z.object({
  consentId: z.string(),
  scopes: OAuthScopeListSchema.min(1),
});

export const DeleteOAuthConnectionInputSchema = z.object({
  consentId: z.string(),
});

export type OAuthConnectionRecord = z.infer<typeof OAuthConnectionSchema>;
export type UpdateOAuthConnectionScopesInput = z.infer<
  typeof UpdateOAuthConnectionScopesInputSchema
>;
