import type { McpToolDefinition } from "../../service/mcp-tool";
import { postsCreateDraftTool } from "./tools/posts-create-draft.tool";
import { postsGetTool } from "./tools/posts-get.tool";
import { postsListTool } from "./tools/posts-list.tool";

export const mcpPostsTools: McpToolDefinition[] = [
  postsListTool,
  postsGetTool,
  postsCreateDraftTool,
];
