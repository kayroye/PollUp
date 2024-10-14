import { createUser, createPost, getUserByEmail, getUserById, getAllUsers, getAllPosts, getPostById } from '@/lib/mongodb';
import { GraphQLScalarType, Kind, ValueNode, ObjectValueNode } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JSONResolver = new GraphQLScalarType({
  name: 'JSON',
  description: 'Custom scalar type for JSON objects',
  parseValue(value: unknown) {
    return value; // value from the client input
  },
  serialize(value: unknown) {
    return value; // value sent to the client
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

export const resolvers = {
  JSON: JSONResolver,

  Query: {
    getUserById: async (_: unknown, { _id }: { _id: string }) => {
      return getUserById(_id);
    },
    getUserByEmail: async (_: unknown, { email }: { email: string }) => {
      return getUserByEmail(email);
    },
    listUsers: async () => {
      return getAllUsers();
    },
    getPostById: async (_: unknown, { id }: { id: string }) => {
      return getPostById(id);
    },
    listPosts: async () => {
      return getAllPosts();
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
      }: {
        title: string;
        content: string;
        author: number;
        createdAt: string;
      }
    ) => {
      await createPost({ title, content, author, createdAt });
      const newPost = await getPostById(title);
      return newPost;
    },
    signUp: async (_: unknown, { email, password, username }: { email: string; password: string; username: string }) => {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists!');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await createUser({
        email,
        password: hashedPassword,
        preferred_username: username,
        name: username,
        profilePicture: '',
        oauthProviders: [],
        bio: '',
        preferences: {},
      });

      const token = jwt.sign({ userId: newUser }, JWT_SECRET, { expiresIn: '1d' });

      return {
        token,
        user: newUser,
      };
    },

    signIn: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const user = await getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

      return {
        token,
        user,
      };
    },
  },
};
