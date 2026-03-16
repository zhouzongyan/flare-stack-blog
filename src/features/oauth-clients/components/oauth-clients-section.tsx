import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { OAUTH_PROVIDER_SCOPES } from "@/features/oauth-provider/oauth-provider.config";
import { useOAuthClients } from "../hooks/use-oauth-clients";
import type {
  OAuthConnectionRecord,
  UpdateOAuthConnectionScopesInput,
} from "../schema/oauth-client.schema";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
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
      {OAUTH_PROVIDER_SCOPES.map((scope) => {
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
  const [scopes, setScopes] = useState<string[]>(connection.scopes);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="space-y-6 border border-border/20 bg-muted/5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-lg font-serif text-foreground">
              {connection.clientName || "Unnamed client"}
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
            <p>Connected: {formatDateTime(connection.createdAt)}</p>
            <p>Last updated: {formatDateTime(connection.updatedAt)}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
          className="rounded-none text-[10px] font-mono uppercase tracking-[0.2em]"
        >
          <Trash2 size={12} className="mr-2" />
          Disconnect
        </Button>
      </div>

      {connection.redirectUris.length > 0 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Redirect URIs</label>
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
        <label className="text-sm font-medium">Granted scopes</label>
        <ScopeChecklist scopes={scopes} onChange={setScopes} />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() =>
            onSave({
              consentId: connection.consentId,
              scopes: scopes as UpdateOAuthConnectionScopesInput["scopes"],
            })
          }
          className="rounded-none text-[10px] font-mono uppercase tracking-[0.2em]"
        >
          Update scopes
        </Button>
      </div>

      <ConfirmationModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await onDelete(connection.consentId);
          setDeleteOpen(false);
        }}
        title="Disconnect client"
        message={`Disconnect ${connection.clientName || connection.clientId}? This revokes the current OAuth authorization for this client.`}
        confirmLabel="Disconnect"
        isDanger
      />
    </div>
  );
}

export function OAuthClientsSection() {
  const { connections, deleteConnection, isLoading, updateConnectionScopes } =
    useOAuthClients();

  const connectionCountLabel = useMemo(() => {
    return `${connections.length} connected client${connections.length === 1 ? "" : "s"}`;
  }, [connections.length]);

  const handleUpdateScopes = async (
    input: UpdateOAuthConnectionScopesInput,
  ) => {
    try {
      await updateConnectionScopes({ data: input });
      toast.success("Client scopes updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const handleDelete = async (consentId: string) => {
    try {
      await deleteConnection({ data: { consentId } });
      toast.success("Client disconnected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Disconnect failed");
      throw error;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="overflow-hidden border border-border/30 bg-background/50 divide-y divide-border/20">
        <div className="space-y-2 p-8">
          <h5 className="text-sm font-medium text-foreground">
            Connected MCP clients
          </h5>
          <p className="text-sm text-muted-foreground">
            These are the AI tools and apps that have already completed OAuth
            authorization against your MCP server.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            {connectionCountLabel}
          </p>
        </div>

        <div className="space-y-6 p-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading connected clients...
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
                No clients have connected yet. Once Codex or another AI agent
                finishes OAuth authorization, it will show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
