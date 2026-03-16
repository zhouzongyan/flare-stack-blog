import type {
  OAuthBlogAction,
  OAuthBlogResource,
  OAuthBlogScope,
  OAuthBlogScopeGroups,
  OAuthBlogScopeSelection,
} from "../oauth-provider.config";

function typedEntries<T extends Record<string, unknown>>(obj: T) {
  return Object.entries(obj) as Array<
    {
      [K in keyof T & string]: [K, T[K]];
    }[keyof T & string]
  >;
}

function toBlogScope<R extends OAuthBlogResource>(
  resource: R,
  action: OAuthBlogAction<R>,
): OAuthBlogScope {
  return `${resource}:${action}`;
}

export function flattenBlogScopeGroups(
  scopeGroups: OAuthBlogScopeGroups | OAuthBlogScopeSelection,
): OAuthBlogScope[] {
  return typedEntries(scopeGroups).flatMap(([resource, actions]) =>
    (actions ?? []).map((action) => toBlogScope(resource, action)),
  );
}

export function flattenScopeRequest(
  scopeRequest: OAuthBlogScopeSelection,
): OAuthBlogScope[] {
  return typedEntries(scopeRequest).flatMap(([resource, actions]) =>
    (actions ?? []).map((action) => toBlogScope(resource, action)),
  );
}
