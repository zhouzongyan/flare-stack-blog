import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteOAuthConnectionFn,
  updateOAuthConnectionScopesFn,
} from "../api/oauth-clients.admin.api";
import { OAUTH_CONNECTION_KEYS, oauthConnectionsQuery } from "../queries";

export function useOAuthClients() {
  const queryClient = useQueryClient();
  const connectionsQuery = useQuery(oauthConnectionsQuery);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: OAUTH_CONNECTION_KEYS.list });

  const updateMutation = useMutation({
    mutationFn: updateOAuthConnectionScopesFn,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOAuthConnectionFn,
    onSuccess: invalidate,
  });

  return {
    connections: connectionsQuery.data ?? [],
    deleteConnection: deleteMutation.mutateAsync,
    isLoading: connectionsQuery.isLoading,
    updateConnectionScopes: updateMutation.mutateAsync,
  };
}
