import { gql } from 'apollo-server-micro';

export const typeDefs = gql`
  scalar JSON
  scalar ObjectId
  scalar Reaction

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
    likedPosts: [ObjectId!]!
  }

  type Post {
    _id: ObjectId!
    content: String!
    author: User!
    createdAt: String!
    type: PostType
    pollContent: PollContent
    mediaUrls: [String]
    likes: [ObjectId!]!
    comments: [ObjectId!]!
    tags: [String]
    visibility: Visibility
  }

  type Comment {
    _id: ObjectId!
    post: ObjectId
    parentComment: ObjectId
    content: String!
    author: ObjectId!
    createdAt: String!
    likes: [ObjectId!]!
    replies: [ObjectId!]!
    reactions: [Reaction]
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
    text
    image
    video
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
    getCommentById(id: String!): Comment
    getCommentsByPostId(postId: String!): [Comment!]!
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
    ): Post!

    signUp(
      email: String!
      password: String!
      username: String!
      name: String!
    ): AuthPayload!

    signIn(
      email: String!
      password: String!
    ): AuthPayload!

    createPoll(pollData: PollContentInput!): PollContent!

    updatePollVotes(pollId: ObjectId!, voteData: JSON!): PollContent!

    createComment(
      post: ObjectId
      parentComment: ObjectId
      content: String!
      author: ObjectId!
    ): Comment!

    updateComment(commentId: ObjectId!, update: CommentUpdateInput!): Comment!

    deleteComment(commentId: ObjectId!): Boolean!

    updateUser(userId: ObjectId!, update: UserUpdateInput!): User!

    deleteUser(userId: ObjectId!): Boolean!
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

  input CommentUpdateInput {
    content: String
    likes: [ObjectId]
    replies: [ObjectId]
    reactions: [ReactionInput]
  }

  input ReactionInput {
    user: ObjectId!
    type: ReactionType!
  }

  enum ReactionType {
    like
    love
    funny
    sad
  }

  input UserUpdateInput {
    preferred_username: String
    password: String
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
