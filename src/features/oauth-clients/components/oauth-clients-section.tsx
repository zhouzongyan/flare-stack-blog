import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import {
  OAUTH_MANAGED_SCOPES,
  OAUTH_PROVIDER_SCOPES,
} from "@/features/oauth-provider/oauth-provider.config";
import { formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { useOAuthClients } from "../hooks/use-oauth-clients";
import type {
  OAuthConnectionRecord,
  UpdateOAuthConnectionScopesInput,
} from "../schema/oauth-client.schema";

function splitScopes(scopes: string[]) {
  const managed = scopes.filter((scope) =>
    OAUTH_MANAGED_SCOPES.includes(
      scope as (typeof OAUTH_MANAGED_SCOPES)[number],
    ),
  );
  const system = scopes.filter((scope) => !managed.includes(scope));

  return { managed, system };
}

function ScopeChecklist({
  scopes,
  onChange,
}: {
  scopes: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {OAUTH_MANAGED_SCOPES.map((scope) => {
        const checked = scopes.includes(scope);
        return (
          <label
            key={scope}
            className="flex items-center gap-3 border border-border/20 bg-muted/10 px-3 py-2 text-sm"
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(nextChecked) => {
                onChange(
                  nextChecked
                    ? [...new Set([...scopes, scope])]
                    : scopes.filter((item) => item !== scope),
                );
              }}
            />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em]">
              {scope}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function OAuthConnectionCard({
  connection,
  onDelete,
  onSave,
}: {
  connection: OAuthConnectionRecord;
  onDelete: (consentId: string) => Promise<void>;
  onSave: (input: UpdateOAuthConnectionScopesInput) => Promise<void>;
}) {
  const { managed: managedScopes, system: systemScopes } = splitScopes(
    connection.scopes,
  );
  const [scopes, setScopes] = useState<string[]>(managedScopes);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="space-y-6 border border-border/20 bg-muted/5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-lg font-serif text-foreground">
              {connection.clientName || m.settings_mcp_connection_unnamed()}
            </h4>
            <p className="text-sm text-muted-foreground break-all">
              {connection.clientId}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-none">
              {connection.clientType ?? "web"}
            </Badge>
            <Badge variant="secondary" className="rounded-none">
              {connection.public ? "public" : "confidential"}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              {m.settings_mcp_connection_connected_at({
                date: formatDate(connection.createdAt, { includeTime: true }),
              })}
            </p>
            <p>
              {m.settings_mcp_connection_updated_at({
                date: formatDate(connection.updatedAt, { includeTime: true }),
              })}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
          className="rounded-none text-[10px] font-mono uppercase tracking-[0.2em]"
        >
          <Trash2 size={12} className="mr-2" />
          {m.settings_mcp_connection_disconnect_btn()}
        </Button>
      </div>

      {connection.redirectUris.length > 0 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {m.settings_mcp_connection_redirect_uris()}
          </label>
          <div className="space-y-2 border border-border/20 bg-background/40 p-4">
            {connection.redirectUris.map((redirectUri) => (
              <p
                key={redirectUri}
                className="break-all text-sm text-muted-foreground"
              >
                {redirectUri}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <label className="text-sm font-medium">
          {m.settings_mcp_connection_granted_scopes()}
        </label>
        <ScopeChecklist scopes={scopes} onChange={setScopes} />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() =>
            onSave({
              consentId: connection.consentId,
              scopes: [...systemScopes, ...scopes].filter((scope) =>
                OAUTH_PROVIDER_SCOPES.includes(
                  scope as (typeof OAUTH_PROVIDER_SCOPES)[number],
                ),
              ) as UpdateOAuthConnectionScopesInput["scopes"],
            })
          }
          className="rounded-none text-[10px] font-mono uppercase tracking-[0.2em]"
        >
          {m.settings_mcp_connection_update_scopes_btn()}
        </Button>
      </div>

      <ConfirmationModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await onDelete(connection.consentId);
          setDeleteOpen(false);
        }}
        title={m.settings_mcp_connection_disconnect_title()}
        message={m.settings_mcp_connection_disconnect_desc({
          client: connection.clientName || connection.clientId,
        })}
        confirmLabel={m.settings_mcp_connection_disconnect_btn()}
        isDanger
      />
    </div>
  );
}

export function OAuthClientsSection() {
  const { connections, deleteConnection, isLoading, updateConnectionScopes } =
    useOAuthClients();
  const [baseUrl] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin,
  );

  const connectionCountLabel = useMemo(() => {
    return m.settings_mcp_connected_count({ count: connections.length });
  }, [connections.length]);

  const mcpEndpoint = baseUrl ? `${baseUrl}/mcp` : "/mcp";

  const handleUpdateScopes = async (
    input: UpdateOAuthConnectionScopesInput,
  ) => {
    try {
      await updateConnectionScopes({ data: input });
      toast.success(m.settings_mcp_toast_scopes_updated());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : m.settings_mcp_toast_update_failed(),
      );
    }
  };

  const handleDelete = async (consentId: string) => {
    try {
      await deleteConnection({ data: { consentId } });
      toast.success(m.settings_mcp_toast_disconnected());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : m.settings_mcp_toast_disconnect_failed(),
      );
      throw error;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="overflow-hidden border border-border/30 bg-background/50 divide-y divide-border/20">
        <div className="space-y-8 p-8">
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-foreground">
              {m.settings_mcp_connections_title()}
            </h5>
            <p className="text-sm text-muted-foreground">
              {m.settings_mcp_connections_desc()}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {connectionCountLabel}
            </p>
          </div>

          <div className="space-y-2 border border-border/20 bg-muted/5 p-6">
            <p className="text-sm font-medium text-foreground">
              {m.settings_mcp_endpoint_label()}
            </p>
            <p className="break-all font-mono text-xs text-muted-foreground">
              {mcpEndpoint}
            </p>
          </div>
        </div>

        <div className="space-y-6 p-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              {m.settings_mcp_loading_connections()}
            </p>
          ) : connections.length > 0 ? (
            connections.map((connection) => (
              <OAuthConnectionCard
                key={connection.consentId}
                connection={connection}
                onDelete={handleDelete}
                onSave={handleUpdateScopes}
              />
            ))
          ) : (
            <div className="border border-dashed border-border/30 bg-muted/5 p-6">
              <p className="text-sm text-muted-foreground">
                {m.settings_mcp_empty_connections()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
