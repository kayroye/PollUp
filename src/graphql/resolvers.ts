import {
  createUser,
  createPost,
  getUserByEmail,
  getUserById,
  getAllUsers,
  getAllPosts,
  getPostById,
  getUserByUsername,
  createPoll,
  getPollById,
  getAllPolls,
  updatePollVotes,
  updateUser,
  deleteUser,
  addOrRemoveLike,
  addComment,
  updatePost,
  getUserPosts,
  getUserVotes,
  castVote,
} from "@/lib/mongodb";
import { GraphQLScalarType, Kind, ValueNode, ObjectValueNode } from "graphql";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { AuthenticationError } from "apollo-server-micro";
import { NextApiResponse } from "next";

const JSONResolver = new GraphQLScalarType({
  name: "JSON",
  description: "Custom scalar type for JSON objects",
  parseValue(value: unknown) {
    return value;
  },
  serialize(value: unknown): unknown {
    if (value instanceof ObjectId) {
      return value.toHexString();
    }
    return value;
  },
  parseLiteral(ast: ValueNode) {
    if (ast.kind === Kind.OBJECT) {
      return parseObject(ast);
    }
    return null;
  },
});

const parseObject = (ast: ObjectValueNode): Record<string, unknown> => {
  const value: Record<string, unknown> = {};
  ast.fields.forEach((field) => {
    value[field.name.value] =
      field.value.kind === Kind.STRING ? field.value.value : undefined;
  });
  return value;
};

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

const ObjectIdScalar = new GraphQLScalarType({
  name: "ObjectId",
  description: "MongoDB ObjectId scalar type",
  serialize(value: unknown): string {
    return value instanceof ObjectId ? value.toHexString() : String(value);
  },
  parseValue(value: unknown): ObjectId {
    if (typeof value === "string") {
      return new ObjectId(value);
    }
    throw new Error("Invalid ObjectId");
  },
  parseLiteral(ast): ObjectId | null {
    if (ast.kind === Kind.STRING) {
      return new ObjectId(ast.value);
    }
    return null;
  },
});

interface PollContent {
  _id?: ObjectId;
  question: string;
  type: "multiple" | "single" | "slider";
  options?: string[];
  min?: number;
  max?: number;
  votes?: VoteData;
  createdAt: Date;
  closedAt?: Date;
  voterIds: ObjectId[];
}

interface VoteData {
  [option: string]: number;
}

interface VoteChoiceResult {
  sliderValue?: number;
  singleChoice?: string;
  multipleChoices?: string[];
}

export const resolvers = {
  JSON: JSONResolver,
  ObjectId: ObjectIdScalar,

  LikeResult: {
    __resolveType(obj: {
      content?: unknown;
      parentComment?: unknown;
    }): string | null {
      if ("content" in obj) {
        return "Post";
      }
      if ("parentComment" in obj) {
        return "Comment";
      }
      return null;
    },
  },

  Query: {
    getUserById: async (_: unknown, { _id }: { _id: string }) => {
      try {
        const objectId = new ObjectId(_id);
        const user = await getUserById(objectId);
        if (!user) {
          throw new Error("User not found");
        }
        return user;
      } catch (error) {
        throw error;
      }
    },
    getUserByEmail: async (_: unknown, { email }: { email: string }) => {
      return getUserByEmail(email);
    },
    listUsers: async () => {
      return getAllUsers();
    },
    getPostById: async (_: unknown, { id }: { id: string }) => {
      const objectId = new ObjectId(id);
      return getPostById(objectId);
    },
    listPosts: async () => {
      return getAllPosts();
    },
    getPollById: async (_: unknown, { id }: { id: string }) => {
      const objectId = new ObjectId(id);
      return getPollById(objectId);
    },
    listPolls: async () => {
      return getAllPolls();
    },
    getUserByUsername: async (
      _: unknown,
      { username }: { username: string }
    ) => {
      return getUserByUsername(username);
    },
    getUserPosts: async (
      _: unknown, 
      { username, limit = 10, offset = 0 }: { username: string; limit?: number; offset?: number }
    ) => {
      return getUserPosts(username, limit, offset);
    },
    getUserVotes: async (_: unknown, { userId }: { userId: ObjectId }) => {
      const votes = await getUserVotes(userId);
      return votes.map(vote => ({
        ...vote,
        createdAt: vote.createdAt.toISOString(),
        updatedAt: vote.updatedAt?.toISOString(),
        // Transform the choices based on their type
        choices: transformVoteChoices(vote.choices)
      }));
    },
  },

  Mutation: {
    createUser: async (
      _: unknown,
      {
        preferred_username,
        email,
        name,
        clerkUserId,
        profilePicture,
        oauthProviders,
        bio,
        preferences,
      }: {
        preferred_username: string;
        email: string;
        name: string;
        clerkUserId: string;
        profilePicture?: string;
        oauthProviders?: string[];
        bio?: string;
        preferences?: object;
      }
    ) => {
      const newUser = await createUser({
        preferred_username,
        email,
        name,
        clerkUserId,
        profilePicture: profilePicture || "",
        oauthProviders: oauthProviders || [],
        bio: bio || "",
        preferences: preferences || {},
        followers: [],
        following: [],
        createdAt: new Date(),
        posts: [],
        likedPosts: [],
        votes: [],
      });
      return newUser;
    },
    createPost: async (
      _: unknown,
      {
        content,
        author,
        type,
        createdAt,
        pollContent,
        mediaUrls,
        tags,
        visibility,
      }: {
        content: string;
        createdAt: string;
        author: string;
        type: "poll" | "comment" | "post";
        pollContent?: PollContent;
        mediaUrls?: string[];
        tags?: string[];
        visibility?: "public" | "friends" | "private" | "deleted";
      }
    ) => {
      // Authentication check
      const userId = author;
      if (!userId) {
        throw new AuthenticationError(
          "You must be logged in to create a post."
        );
      }

      const postAuthor = new ObjectId(userId);
      const createdAtDate = new Date(createdAt);

      const newPostId = await createPost({
        content,
        author: postAuthor,
        createdAt: createdAtDate,
        type: type || 'post',
        pollContent,
        likes: [],
        comments: [],
        mediaUrls,
        tags,
        visibility,
      });

      const newPost = await getPostById(newPostId);
      return newPost;
    },
    signUp: async (
      _: unknown,
      {
        email,
        username,
        name,
        clerkUserId,
        profilePicture,
      }: {
        email: string;
        username: string;
        name: string;
        clerkUserId: string;
        profilePicture?: string;
      },
      context: { res: NextApiResponse }
    ) => {
      const existingUserByEmail = await getUserByEmail(email);
      const existingUserByUsername = await getUserByUsername(username);
      if (existingUserByEmail) {
        throw new Error("This email is already in use. Please sign in.");
      }

      if (existingUserByUsername) {
        throw new Error(
          "This username is already in use. Try a different username."
        );
      }
      const newUserId = await createUser({
        email,
        preferred_username: username,
        clerkUserId: clerkUserId,
        name: name,
        profilePicture: profilePicture || "",
        oauthProviders: [],
        bio: "",
        preferences: {},
        followers: [],
        following: [],
        createdAt: new Date(),
        posts: [],
        likedPosts: [],
        votes: [],
      });

      const newUser = await getUserById(newUserId);
      if (!newUser) {
        throw new Error("Failed to create user");
      }

      const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
        expiresIn: "1d",
      });

      // Set HttpOnly cookie with the JWT
      context.res.setHeader("Set-Cookie", [
        `authToken=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict; Secure`,
      ]);

      return {
        user: newUser,
      };
    },
    createPoll: async (_: unknown, { pollData }: { pollData: PollContent }) => {
      const newPollId = await createPoll(pollData);
      const newPoll = await getPollById(newPollId);
      return newPoll;
    },

    updatePollVotes: async (
      _: unknown,
      { pollId, voteData }: { pollId: ObjectId; voteData: VoteData }
    ) => {
      const updatedCount = await updatePollVotes(pollId, voteData);
      if (updatedCount === 0) {
        throw new Error("Failed to update poll votes");
      }
      return getPollById(pollId);
    },

    updatePost: async (
      _: unknown,
      { postId, update }: { postId: string; update: object }
    ) => {
      const objectId = new ObjectId(postId);
      const updatedCount = await updatePost(objectId, update);
      if (updatedCount === 0) {
        throw new Error("Failed to update post");
      }
      return getPostById(objectId);
    },

    deletePost: async (_: unknown, { postId }: { postId: string }) => {
      const objectId = new ObjectId(postId);
      const post = await getPostById(objectId);
      if (!post) {
        throw new Error("Post not found");
      }
      
      // Update the author's posts array first
      if (post.author && post.author._id) {
        await updateUser(new ObjectId(post.author._id), {
          $pull: { posts: objectId }
        });
      }

      // Then update the post visibility
      const updatedCount = await updatePost(objectId, {
        $set: { visibility: "deleted" }
      });

      // If there is a parent post, remove the comment from the parent post
      if (post.parentPost) {
        await updatePost(post.parentPost, { $pull: { comments: objectId } });
      }

      return updatedCount > 0;
    },

    updateUser: async (
      _: unknown,
      { userId, update }: { userId: ObjectId; update: object }
    ) => {
      const updatedCount = await updateUser(userId, update);
      if (updatedCount === 0) {
        throw new Error("Failed to update user");
      }
      return getUserById(userId);
    },

    deleteUser: async (_: unknown, { userId }: { userId: ObjectId }) => {
      const deletedCount = await deleteUser(userId);
      return deletedCount > 0;
    },

    addOrRemoveLike: async (
      _: unknown,
      {
        targetId,
        userId,
        onWhat,
      }: { targetId: string; userId: string; onWhat: "post" }
    ) => {
      const targetObjectId = new ObjectId(targetId);
      const userObjectId = new ObjectId(userId);
      const updatedCount = await addOrRemoveLike(
        targetObjectId,
        userObjectId,
        onWhat
      );
      if (updatedCount === 0) {
        throw new Error("Failed to update likes");
      }
      if (onWhat === "post") {
        return getPostById(targetObjectId);
      }
      return null;
    },

    addComment: async (
      _: unknown,
      {
        content,
        author,
        parentPost,
        createdAt,
        mediaUrls,
        tags,
        visibility,
      }: {
        content: string;
        author: string;
        parentPost: string;
        createdAt: string;
        mediaUrls?: string[];
        tags?: string[];
        visibility?: "public" | "friends" | "private";
      }
    ) => {
      // Authentication check
      const userId = author;
      if (!userId) {
        throw new AuthenticationError(
          "You must be logged in to add a comment."
        );
      }

      const commentAuthor = new ObjectId(userId);
      const parentPostId = new ObjectId(parentPost);
      const createdAtDate = new Date(createdAt);

      const newCommentId = await createPost({
        content,
        author: commentAuthor,
        createdAt: createdAtDate,
        type: "comment",
        parentPost: parentPostId,
        likes: [],
        comments: [],
        mediaUrls,
        tags,
        visibility: visibility as "public" | "friends" | "private" | undefined,
      });

      // Add the new comment to the parent post
      await addComment(parentPostId, newCommentId);

      const newComment = await getPostById(newCommentId);
      return newComment;
    },
    castVote: async (
      _: unknown,
      {
        userId,
        pollId,
        postId,
        choices,
      }: {
        userId: string;
        pollId: string;
        postId: string;
        choices: {
          singleChoice?: string;
          multipleChoices?: string[];
          sliderValue?: number;
        };
      }
    ) => {
      const userIdObject = new ObjectId(userId);
      const pollObjectId = new ObjectId(pollId);
      const postObjectId = new ObjectId(postId);
      // Transform the choices into the correct format for storage
      let transformedChoices: number | string[];
      if (choices.sliderValue !== undefined) {
        transformedChoices = choices.sliderValue;
      } else if (choices.singleChoice) {
        transformedChoices = [choices.singleChoice]; // Convert single choice to array
      } else if (choices.multipleChoices) {
        transformedChoices = choices.multipleChoices;
      } else {
        throw new Error('Invalid vote choices provided');
      }

      return castVote({
        userId: userIdObject,
        pollId: pollObjectId,
        postId: postObjectId,
        choices: transformedChoices,
        createdAt: new Date(),
      });
    },
  },

  VoteChoice: {
    __resolveType(obj: VoteChoiceResult) {
      if (obj.singleChoice) return 'SingleChoice';
      if (obj.sliderValue !== undefined) return 'SliderChoice';
      if (obj.multipleChoices) return 'MultipleChoice';
      return null;
    },
  },
};

// Helper function to transform vote choices into the correct format
function transformVoteChoices(choices: string | number | string[]): VoteChoiceResult {
  if (typeof choices === 'number') {
    return { sliderValue: choices };
  } else if (Array.isArray(choices)) {
    return { multipleChoices: choices };
  } else if (typeof choices === 'string') {
    return { singleChoice: choices };
  }
  throw new Error('Invalid vote choice type');
}
