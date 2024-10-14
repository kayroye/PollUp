import { createUser, createPost, getUserByEmail, getUserById, getAllUsers, getAllPosts, getPostById, getUserByUsername, createPoll, getPollById, getAllPolls, updatePollVotes } from '@/lib/mongodb';
import { GraphQLScalarType, Kind, ValueNode, ObjectValueNode } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JSONResolver = new GraphQLScalarType({
  name: 'JSON',
  description: 'Custom scalar type for JSON objects',
  parseValue(value: unknown) {
    return value; // value from the client input
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
}

interface VoteData {
  [option: string]: number;
}

export const resolvers = {
  JSON: JSONResolver,
  ObjectId: ObjectIdScalar,

  Query: {
    getUserById: async (_: unknown, { _id }: { _id: ObjectId }) => {
      return getUserById(_id);
    },
    getUserByEmail: async (_: unknown, { email }: { email: string }) => {
      return getUserByEmail(email);
    },
    listUsers: async () => {
      return getAllUsers();
    },
    getPostById: async (_: unknown, { id }: { id: ObjectId }) => {
      return getPostById(id);
    },
    listPosts: async () => {
      return getAllPosts();
    },
    getPollById: async (_: unknown, { id }: { id: ObjectId }) => {
      return getPollById(id);
    },
    listPolls: async () => {
      return getAllPolls();
    },
  },

  Mutation: {
    createUser: async (
      _: unknown,
      {
        preferred_username,
        email,
        name,
        profilePicture,
        oauthProviders,
        bio,
        preferences,
        password,
      }: {
        _id: string;
        preferred_username: string;
        email: string;
        name: string;
        profilePicture: string;
        oauthProviders: string[];
        bio: string;
        preferences: object;
        password: string;
      }
    ) => {
      const newUser = await createUser({
        preferred_username,
        email,
        name,
        profilePicture,
        oauthProviders,
        bio,
        preferences,
        password,
      });
      return newUser;
    },
    createPost: async (
      _: unknown,
      {
        title,
        content,
        author,
        createdAt,
        pollContent,
      }: {
        title: string;
        content: string;
        author: number;
        createdAt: string;
        pollContent?: PollContent;
      }
    ) => {
      const newPostId = await createPost({ title, content, author, createdAt, pollContent });
      const newPost = await getPostById(newPostId);
      return newPost;
    },
    signUp: async (_: unknown, { email, password, username }: { email: string; password: string; username: string }) => {
      const existingUserByEmail = await getUserByEmail(email);
      const existingUserByUsername = await getUserByUsername(username);
      if (existingUserByEmail) {
        throw new Error('This email is already in use. Please sign in.');
      }

      if (existingUserByUsername) {
        throw new Error('This username is already in use. Try a different username.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserId = await createUser({
        email,
        password: hashedPassword,
        preferred_username: username,
        name: username,
        profilePicture: '',
        oauthProviders: [],
        bio: '',
        preferences: {},
      });

      const newUser = await getUserById(newUserId);
      if (!newUser) {
        throw new Error('Failed to create user');
      }

      const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1d' });

      return {
        token,
        user: newUser,
      };
    },

    signIn: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const user = await getUserByEmail(email);
      if (!user) {
        throw new Error('Incorrect email or password');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Incorrect email or password');
      }

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

      return {
        token,
        user,
      };
    },

    // Add new mutations for polls
    createPoll: async (_: unknown, { pollData }: { pollData: PollContent }) => {
      const newPollId = await createPoll(pollData);
      const newPoll = await getPollById(newPollId);
      return newPoll;
    },

    updatePollVotes: async (_: unknown, { pollId, voteData }: { pollId: ObjectId; voteData: VoteData }) => {
      const updatedCount = await updatePollVotes(pollId, voteData);
      if (updatedCount === 0) {
        throw new Error('Failed to update poll votes');
      }
      return getPollById(pollId);
    },
  },
};
