import { gql } from 'apollo-server-micro';

export const typeDefs = gql`
  scalar JSON
  scalar ObjectId
  scalar Reaction

  type User {
    _id: ObjectId!
    preferred_username: String!
    clerkUserId: String!
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
    likedPosts: [LikedPost!]!
  }

  type Post {
    _id: ObjectId!
    content: String!
    author: User!
    createdAt: String!
    type: PostType
    parentPost: ObjectId
    pollContent: PollContent
    mediaUrls: [String]
    likes: [ObjectId!]!
    comments: [ObjectId!]!
    tags: [String]
    visibility: Visibility
    closedAt: String
  }

  type LikedPost {
    _id: ObjectId!
    type: String!
    post: ObjectId!
    createdAt: String!
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

  enum PostType {
    comment
    poll
  }

  enum Visibility {
    public
    friends
    private
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
    getUserByUsername(username: String!): User
  }

  type Mutation {
    createUser(
      clerkUserId: String!
      preferred_username: String!
      email: String!
      name: String!
      profilePicture: String!
      oauthProviders: [String!]!
      bio: String!
      preferences: JSON!
      followers: [ObjectId]
      following: [ObjectId]
      posts: [ObjectId]
      likedPosts: [ObjectId]
    ): User!

    createPost(
      content: String!
      author: String!
      createdAt: String!
      type: PostType!
      pollContent: JSON
      mediaUrls: [String]
      tags: [String]
      visibility: Visibility
      closedAt: String
    ): Post!

    signUp(
      email: String!
      username: String!
      clerkUserId: String!
      name: String!
      profilePicture: String
    ): AuthPayload!

    signIn(
      email: String!
    ): AuthPayload!

    createPoll(pollData: PollContentInput!): PollContent!

    updatePollVotes(pollId: ObjectId!, voteData: JSON!): PollContent!

    updateUser(userId: ObjectId!, update: UserUpdateInput!): User!

    deleteUser(userId: ObjectId!): Boolean!

    addOrRemoveLike(targetId: String!, userId: String!, onWhat: LikeTarget!): LikeResult

    addComment(
      content: String!
      author: String!
      parentPost: ObjectId!
      createdAt: String!
      mediaUrls: [String]
      tags: [String]
      visibility: Visibility
    ): Post!
  }

  union LikeResult = Post

  enum LikeTarget {
    post
  }

  input PollContentInput {
    question: String!
    type: PollType!
    options: [String]
    min: Int
    max: Int
    closedAt: String
  }

  type AuthPayload {
    user: User!
  }

  input UserUpdateInput {
    preferred_username: String
    email: String
    name: String
    profilePicture: String
    oauthProviders: [String]
    bio: String
    preferences: JSON
    followers: [ObjectId]
    following: [ObjectId]
    posts: [ObjectId]
  }
`;
