import { z } from "zod";
import {
  FindPostByIdInputSchema,
  PostSelectSchema,
} from "@/features/posts/schema/posts.schema";
import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as PostService from "@/features/posts/services/posts.service";
import { TagSelectSchema } from "@/features/tags/tags.schema";
import { defineMcpTool } from "../mcp-tool";

const POSTS_GET_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["read"],
};

const PostsGetOutputSchema = PostSelectSchema.extend({
  hasPublicCache: z.boolean(),
  isSynced: z.boolean(),
  tags: z.array(TagSelectSchema).optional(),
});

export const postsGetTool = defineMcpTool({
  name: "posts.get",
  description: "Get a single blog post by numeric ID, including tags and sync metadata.",
  requiredScopes: POSTS_GET_REQUIRED_SCOPES,
  inputSchema: FindPostByIdInputSchema,
  outputSchema: PostsGetOutputSchema,
  async handler(args, context) {
    const post = await PostService.findPostById(context, args);

    if (!post) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.id} not found`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(post, null, 2),
        },
      ],
      structuredContent: post,
    };
  },
});
