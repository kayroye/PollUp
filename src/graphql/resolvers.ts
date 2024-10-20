import { createUser, createPost, getUserByEmail, getUserById, getAllUsers, getAllPosts, getPostById, getUserByUsername, createPoll, getPollById, getAllPolls, updatePollVotes, updateUser, deleteUser, addOrRemoveLike } from '@/lib/mongodb';
import { GraphQLScalarType, Kind, ValueNode, ObjectValueNode } from 'graphql';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { AuthenticationError } from 'apollo-server-micro';
import { NextApiResponse } from 'next';

const JSONResolver = new GraphQLScalarType({
  name: 'JSON',
  description: 'Custom scalar type for JSON objects',
  parseValue(value: unknown) {
    return value;
  },
  serialize(value: unknown): string {
    return value instanceof ObjectId ? value.toHexString() : String(value);
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
    value[field.name.value] = field.value.kind === Kind.STRING ? field.value.value : undefined;
  });
  return value;
};

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

const ObjectIdScalar = new GraphQLScalarType({
  name: 'ObjectId',
  description: 'MongoDB ObjectId scalar type',
  serialize(value: unknown): string {
    return value instanceof ObjectId ? value.toHexString() : String(value);
  },
  parseValue(value: unknown): ObjectId {
    if (typeof value === 'string') {
      return new ObjectId(value);
    }
    throw new Error('Invalid ObjectId');
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
  type: 'multiple' | 'single' | 'slider';
  options?: string[];
  min?: number;
  max?: number;
  votes?: VoteData;
  createdAt: Date;
  closedAt?: Date;
}

interface VoteData {
  [option: string]: number;
}

export const resolvers = {
  JSON: JSONResolver,
  ObjectId: ObjectIdScalar,

  LikeResult: {
    __resolveType(obj: { content?: unknown; parentComment?: unknown }): string | null {
      if ('content' in obj) {
        return 'Post';
      }
      if ('parentComment' in obj) {
        return 'Comment';
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
          throw new Error('User not found');
        }
        return user;
      } catch (error) {
        console.error('Error in getUserById:', error);
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
      console.log(objectId);
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
    getUserByUsername: async (_: unknown, { username }: { username: string }) => {
      return getUserByUsername(username);
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
        profilePicture: profilePicture || '',
        oauthProviders: oauthProviders || [],
        bio: bio || '',
        preferences: preferences || {},
        followers: [],
        following: [],
        createdAt: new Date(),
        posts: [],
        likedPosts: [],
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
        type: 'text' | 'image' | 'video' | 'poll';
        pollContent?: object;
        mediaUrls?: string[];
        tags?: string[];
        visibility?: 'public' | 'friends' | 'private';
      },
    ) => {
      // Authentication check
      const userId = author;
      if (!userId) {
        throw new AuthenticationError('You must be logged in to create a post.');
      }

      const postAuthor = new ObjectId(userId);
      const createdAtDate = new Date(createdAt);

      const newPostId = await createPost({
        content,
        author: postAuthor,
        createdAt: createdAtDate,
        type: type as 'poll' | 'comment',
        pollContent,
        likes: [],
        comments: [],
        mediaUrls,
        tags,
        visibility: visibility as 'public' | 'friends' | 'private' | undefined,
      });

      const newPost = await getPostById(newPostId);
      return newPost;
    },
    signUp: async (
      _: unknown,
      { email, username, name, clerkUserId, profilePicture }: { email: string; username: string; name: string; clerkUserId: string; profilePicture?: string },
      context: { res: NextApiResponse }
    ) => {
      const existingUserByEmail = await getUserByEmail(email);
      const existingUserByUsername = await getUserByUsername(username);
      if (existingUserByEmail) {
        throw new Error('This email is already in use. Please sign in.');
      }

      if (existingUserByUsername) {
        throw new Error('This username is already in use. Try a different username.');
      }
      const newUserId = await createUser({
        email,
        preferred_username: username,
        clerkUserId: clerkUserId,
        name: name,
        profilePicture: profilePicture || '',
        oauthProviders: [],
        bio: '',
        preferences: {},
        followers: [],
        following: [],
        createdAt: new Date(),
        posts: [],
        likedPosts: [],
      });

      const newUser = await getUserById(newUserId);
      if (!newUser) {
        throw new Error('Failed to create user');
      }

      const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1d' });

      // Set HttpOnly cookie with the JWT
      context.res.setHeader('Set-Cookie', [
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
        throw new Error('Failed to update poll votes');
      }
      return getPollById(pollId);
    },

    updateUser: async (
      _: unknown,
      { userId, update }: { userId: ObjectId; update: object }
    ) => {
      const updatedCount = await updateUser(userId, update);
      if (updatedCount === 0) {
        throw new Error('Failed to update user');
      }
      return getUserById(userId);
    },

    deleteUser: async (_: unknown, { userId }: { userId: ObjectId }) => {
      const deletedCount = await deleteUser(userId);
      return deletedCount > 0;
    },

    addOrRemoveLike: async (_: unknown, { targetId, userId, onWhat }: { targetId: string; userId: string; onWhat: "post" }) => {
      const targetObjectId = new ObjectId(targetId);
      const userObjectId = new ObjectId(userId);
      console.log('Target ID:', targetObjectId);
      const updatedCount = await addOrRemoveLike(targetObjectId, userObjectId, onWhat);
      if (updatedCount === 0) {
        throw new Error('Failed to update likes');
      }
      if (onWhat === 'post') {
        return getPostById(targetObjectId);
      }
      return null;
    },
  },
};
