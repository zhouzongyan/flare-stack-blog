import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { adminMiddleware } from "@/lib/middlewares";
import {
  DeleteOAuthConnectionInputSchema,
  UpdateOAuthConnectionScopesInputSchema,
} from "../schema/oauth-client.schema";
import * as OAuthClientService from "../service/oauth-client.service";

export const getOAuthConnectionsFn = createServerFn()
  .middleware([adminMiddleware])
  .handler(({ context }) =>
    OAuthClientService.listOAuthConnections(context.auth, getRequestHeaders()),
  );

export const updateOAuthConnectionScopesFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(UpdateOAuthConnectionScopesInputSchema)
  .handler(({ context, data }) =>
    OAuthClientService.updateOAuthConnectionScopes(
      context.auth,
      data,
      getRequestHeaders(),
    ),
  );

export const deleteOAuthConnectionFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(DeleteOAuthConnectionInputSchema)
  .handler(({ context, data }) =>
    OAuthClientService.deleteOAuthConnection(
      context.auth,
      data.consentId,
      getRequestHeaders(),
    ),
  );
