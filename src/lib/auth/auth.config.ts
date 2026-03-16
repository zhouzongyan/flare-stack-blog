import type { BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";
import {
  createOAuthProviderPlugin,
  oauthJwtPlugin,
} from "@/features/oauth-provider/oauth-provider.config";

export function createAuthConfig(baseURL: string) {
  return {
    emailAndPassword: {
      enabled: true,
    },
    session: {
      storeSessionInDatabase: true,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    plugins: [admin(), oauthJwtPlugin, createOAuthProviderPlugin(baseURL)],
  } satisfies BetterAuthOptions;
}
