import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider";
import { Hono } from "hono";
import { baseMiddleware } from "@/lib/hono/middlewares";
import { getOAuthProtectedResourceMetadata } from "../service/oauth-provider.service";

const app = new Hono<{ Bindings: Env }>();

function createAuthAliasRequest(request: Request, pathname: string) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

app.get("/.well-known/oauth-authorization-server", baseMiddleware, (c) => {
  const auth = c.get("auth");
  return oauthProviderAuthServerMetadata(auth)(c.req.raw);
});

app.get(
  "/.well-known/oauth-authorization-server/api/auth",
  baseMiddleware,
  (c) => {
    const auth = c.get("auth");
    return oauthProviderAuthServerMetadata(auth)(c.req.raw);
  },
);

app.get("/.well-known/openid-configuration", baseMiddleware, (c) => {
  const auth = c.get("auth");
  return oauthProviderOpenIdConfigMetadata(auth)(c.req.raw);
});

app.get("/.well-known/openid-configuration/api/auth", baseMiddleware, (c) => {
  const auth = c.get("auth");
  return oauthProviderOpenIdConfigMetadata(auth)(c.req.raw);
});

app.get("/.well-known/jwks.json", baseMiddleware, (c) => {
  const auth = c.get("auth");
  return auth.handler(
    createAuthAliasRequest(c.req.raw, "/api/auth/.well-known/jwks.json"),
  );
});

app.get("/.well-known/oauth-protected-resource", baseMiddleware, async (c) => {
  const metadata = getOAuthProtectedResourceMetadata(c.env, c.req.url);
  return c.json(metadata);
});

export default app;
