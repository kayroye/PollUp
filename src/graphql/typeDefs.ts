import { gql } from 'apollo-server-micro';

export const typeDefs = gql`
  scalar JSON
  scalar ObjectId

  type User {
    _id: ObjectId!
    preferred_username: String!
    email: String!
    name: String!
    profilePicture: String!
    oauthProviders: [String!]!
    bio: String!
    preferences: JSON
  }

  type Post {
    _id: ObjectId!
    title: String!
    content: String!
    author: ObjectId!
    createdAt: String!
  }

  type Query {
    getUserById(_id: ObjectId!): User
    getUserByEmail(email: String!): User
    listUsers: [User!]!
    getPostById(id: ObjectId!): Post
    listPosts: [Post!]!
  }

  type Mutation {
    createUser(
      preferred_username: String!
      email: String!
      name: String!
      profilePicture: String!
      oauthProviders: [String!]!
      bio: String!
      preferences: JSON!
      password: String!
    ): User!

    createPost(
      title: String!
      content: String!
      author: ObjectId!
      createdAt: String!
    ): Post!

    signUp(
      email: String!
      password: String!
      username: String!
    ): AuthPayload!

    signIn(
      email: String!
      password: String!
    ): AuthPayload!
  }

  type AuthPayload {
    token: String!
    user: User!
  }
`;
