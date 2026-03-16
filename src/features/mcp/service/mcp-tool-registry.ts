import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpToolContext } from "./mcp.types";
import type { McpToolDefinition } from "./mcp-tool";
import { registerMcpTool } from "./mcp-tool";
import { postsCreateDraftTool } from "./tools/posts-create-draft.tool";
import { postsGetTool } from "./tools/posts-get.tool";
import { postsListTool } from "./tools/posts-list.tool";

const MCP_TOOLS: McpToolDefinition[] = [
  postsListTool,
  postsGetTool,
  postsCreateDraftTool,
];

export function registerMcpTools(server: McpServer, context: McpToolContext) {
  MCP_TOOLS.forEach((tool) => {
    registerMcpTool(server, context, tool);
  });
}
