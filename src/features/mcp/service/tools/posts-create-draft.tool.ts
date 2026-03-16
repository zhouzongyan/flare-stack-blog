import { z } from "zod";
import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as PostService from "@/features/posts/services/posts.service";
import { defineMcpTool } from "../mcp-tool";

const POSTS_CREATE_DRAFT_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

const PostsCreateDraftOutputSchema = z.object({
  id: z.number(),
});

export const postsCreateDraftTool = defineMcpTool({
  name: "posts.createDraft",
  description: "Create a new empty draft post and return its numeric ID.",
  requiredScopes: POSTS_CREATE_DRAFT_REQUIRED_SCOPES,
  outputSchema: PostsCreateDraftOutputSchema,
  async handler(context) {
    const draft = await PostService.createEmptyPost(context);

    return {
      content: [
        {
          type: "text",
          text: `Created draft post ${draft.id}`,
        },
      ],
      structuredContent: draft,
    };
  },
});
