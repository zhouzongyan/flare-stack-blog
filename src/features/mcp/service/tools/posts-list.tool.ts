import { z } from "zod";
import { GetPostsInputSchema, PostItemSchema } from "@/features/posts/schema/posts.schema";
import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as PostService from "@/features/posts/services/posts.service";
import { defineMcpTool } from "../mcp-tool";

const POSTS_LIST_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["read"],
};

const PostsListOutputSchema = z.object({
  items: z.array(PostItemSchema),
});

export const postsListTool = defineMcpTool({
  name: "posts.list",
  description: "List blog posts with optional filters for admin-style management.",
  requiredScopes: POSTS_LIST_REQUIRED_SCOPES,
  inputSchema: GetPostsInputSchema,
  outputSchema: PostsListOutputSchema,
  async handler(args, context) {
    const items = await PostService.getPosts(context, args);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ items }, null, 2),
        },
      ],
      structuredContent: {
        items,
      },
    };
  },
});
