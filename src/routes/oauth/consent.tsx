import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OAUTH_MANAGED_SCOPES } from "@/features/oauth-provider/oauth-provider.config";
import { m } from "@/paraglide/messages";

const consentSearchSchema = z.object({
  client_id: z.string().optional(),
  redirect_uri: z.string().optional(),
  scope: z.string().optional(),
});

export const Route = createFileRoute("/oauth/consent")({
  validateSearch: (search) => consentSearchSchema.parse(search),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestedScopes = (search.scope ?? "")
    .split(" ")
    .map((scope) => scope.trim())
    .filter(Boolean);
  const requestedManagedScopes = requestedScopes.filter((scope) =>
    OAUTH_MANAGED_SCOPES.includes(
      scope as (typeof OAUTH_MANAGED_SCOPES)[number],
    ),
  );
  const requiredSystemScopes = requestedScopes.filter(
    (scope) => !requestedManagedScopes.includes(scope),
  );
  const [selectedManagedScopes, setSelectedManagedScopes] = useState(
    requestedManagedScopes,
  );

  async function submitConsent(accept: boolean) {
    setIsPending(true);
    setError(null);

    try {
      const oauthQuery = window.location.search.slice(1);

      const response = await fetch("/api/auth/oauth2/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          accept,
          scope: accept
            ? [...requiredSystemScopes, ...selectedManagedScopes].join(" ")
            : undefined,
          oauth_query: oauthQuery,
        }),
      });

      if (!response.ok) {
        const message = await response
          .text()
          .catch(() => m.oauth_consent_error_failed());
        throw new Error(message || m.oauth_consent_error_failed());
      }

      const result = (await response.json()) as {
        redirect_uri?: string;
        redirectURI?: string;
        url?: string;
      };
      const redirectUrl =
        result.redirect_uri ?? result.redirectURI ?? result.url;

      if (!redirectUrl) {
        throw new Error(m.oauth_consent_error_missing_redirect());
      }

      window.location.assign(redirectUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : m.oauth_consent_error_failed(),
      );
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          {m.oauth_consent_eyebrow()}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {m.oauth_consent_title()}
        </h1>
        <p className="text-sm text-muted-foreground">
          {m.oauth_consent_client({
            client: search.client_id ?? m.oauth_consent_unknown_client(),
          })}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {m.oauth_consent_requested_scopes()}
        </p>
        <div className="flex flex-wrap gap-2">
          {requestedScopes.length > 0 ? (
            requestedScopes.map((scope) => (
              <span
                key={scope}
                className="rounded-full border px-3 py-1 text-sm"
              >
                {scope}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              {m.oauth_consent_no_scopes()}
            </span>
          )}
        </div>
      </div>

      {requestedManagedScopes.length > 0 ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            {m.oauth_consent_choose_business_scopes()}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {requestedManagedScopes.map((scope) => (
              <label
                key={scope}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
              >
                <Checkbox
                  checked={selectedManagedScopes.includes(scope)}
                  onCheckedChange={(checked) => {
                    setSelectedManagedScopes((current) =>
                      checked
                        ? [...new Set([...current, scope])]
                        : current.filter((item) => item !== scope),
                    );
                  }}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em]">
                  {scope}
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-3">
        <Button disabled={isPending} onClick={() => submitConsent(true)}>
          {m.oauth_consent_allow()}
        </Button>
        <Button
          disabled={isPending}
          onClick={() => submitConsent(false)}
          variant="outline"
        >
          {m.oauth_consent_deny()}
        </Button>
      </div>
    </div>
  );
}
