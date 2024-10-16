import { gql } from 'apollo-server-micro';

export const typeDefs = gql`
  scalar JSON
  scalar ObjectId

  type User {
    _id: ObjectId!
    preferred_username: String!
    password: String!
    email: String!
    name: String!
    profilePicture: String!
    oauthProviders: [String!]!
    bio: String!
    preferences: JSON
    followers: [ObjectId!]!
    following: [ObjectId!]!
    createdAt: String!
    posts: [ObjectId!]!
  }

  type Post {
    _id: ObjectId!
    title: String!
    content: String!
    author: ObjectId!
    createdAt: String!
    pollContent: PollContent
  }

  type PollContent {
    _id: ObjectId!
    question: String!
    type: PollType!
    options: [String]
    min: Int
    max: Int
    votes: JSON
    createdAt: String!
  }

  enum PollType {
    multiple
    single
    slider
  }

  type Query {
    getUserById(_id: String!): User
    getUserByEmail(email: String!): User
    listUsers: [User!]!
    getPostById(id: String!): Post
    listPosts: [Post!]!
    getPollById(id: String!): PollContent
    listPolls: [PollContent!]!
  }

  type Mutation {
    createUser(
      preferred_username: String!
      password: String!
      email: String!
      name: String!
      profilePicture: String!
      oauthProviders: [String!]!
      bio: String!
      preferences: JSON!
    ): User!

    createPost(
      content: String!
      author: String!
      createdAt: String!
      pollContent: JSON
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

    createPoll(pollData: PollContentInput!): PollContent!

    updatePollVotes(pollId: ObjectId!, voteData: JSON!): PollContent!
  }

  input PollContentInput {
    question: String!
    type: PollType!
    options: [String]
    min: Int
    max: Int
  }

  type AuthPayload {
    token: String!
    user: User!
  }
`;
