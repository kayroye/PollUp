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
    getUserById(_id: ObjectId!): User
    getUserByEmail(email: String!): User
    listUsers: [User!]!
    getPostById(id: ObjectId!): Post
    listPosts: [Post!]!
    getPollById(id: ObjectId!): PollContent
    listPolls: [PollContent!]!
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
      pollContent: PollContentInput
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
