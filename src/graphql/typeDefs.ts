import { gql } from 'apollo-server-micro';

export const typeDefs = gql`
  scalar JSON

  type User {
    _id: String!
    preferred_username: String!
    email: String!
    name: String!
    profilePicture: String!
    oauthProviders: [String!]!
    bio: String!
    preferences: JSON
  }

  type Post {
    id: Int!
    title: String!
    content: String!
    author: Int!
    createdAt: String!
  }

  type Query {
    getUserById(_id: String!): User
    getUserByEmail(email: String!): User
    listUsers: [User!]!
    getPostById(id: Int!): Post
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
      author: Int!
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
