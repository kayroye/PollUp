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
    votes: [UserVote!]!
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
    votes: VoteData
    voterIds: [ObjectId!]!
    createdAt: String!
    closedAt: String
  }

  type VoteData {
    total: Int
    sum: Float
    average: Float
    options: JSON
  }

  enum PostType {
    poll
    comment
    post
  }

  enum Visibility {
    public
    friends
    private
    deleted
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
    getUserPosts(username: String!, limit: Int, offset: Int): PostConnection!
    getUserVotes(userId: ObjectId!): [UserVote!]!
    getPollVoters(pollId: ObjectId!): [ObjectId!]!
    getNotifications(userId: ObjectId!, limit: Int, offset: Int): NotificationConnection!
  }

  type PostConnection {
    posts: [Post!]!
    totalCount: Int!
    hasMore: Boolean!
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
      type: PostType
      parentPost: ObjectId
      pollContent: PollContentInput
      mediaUrls: [String]
      tags: [String]
      visibility: Visibility
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

    updatePollVotes(
      pollId: ObjectId!
      voteData: VoteDataInput!
    ): PollContent!

    updateUser(userId: ObjectId!, update: UserUpdateInput!): User!

    deleteUser(userId: ObjectId!): Boolean!

    addOrRemoveLike(targetId: String!, userId: String!, onWhat: LikeTarget!): LikeResult

    addComment(
      content: String!
      author: String!
      parentPost: String!
      createdAt: String!
      mediaUrls: [String]
      tags: [String]
      visibility: Visibility
    ): Post!

    deletePost(postId: String!): Boolean!

    updatePost(postId: String!, update: JSON!): Post!

    castVote(
      userId: String!
      pollId: String!
      postId: String!
      choices: VoteChoiceInput!
    ): Boolean!

    markNotificationRead(notificationId: ObjectId!): Boolean!

    markAllNotificationsRead(userId: ObjectId!): Boolean!

    createNotification(
      userId: String!
      type: NotificationType!
      actorId: String!
      entityId: String!
    ): Notification!
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
    voterIds: [ObjectId]
    votes: VoteDataInput
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

  type UserVote {
    _id: ObjectId!
    userId: ObjectId!
    pollId: ObjectId!
    postId: ObjectId!
    choices: VoteChoice!
    createdAt: String!
    updatedAt: String
  }

  union VoteChoice = SingleChoice | MultipleChoice | SliderChoice

  type SingleChoice {
    singleChoice: String!
  }

  type MultipleChoice {
    multipleChoices: [String!]!
  }

  type SliderChoice {
    sliderValue: Float!
  }

  input VoteChoiceInput {
    singleChoice: String
    multipleChoices: [String!]
    sliderValue: Float
  }

  input VoteDataInput {
    total: Int
    sum: Float
    average: Float
    options: JSON
  }

  type Notification {
    _id: ObjectId!
    userId: ObjectId!
    type: NotificationType!
    actorId: ObjectId!
    entityId: ObjectId!
    read: Boolean!
    createdAt: String!
    actor: NotificationActor
    entity: NotificationEntity
  }

  type NotificationActor {
    _id: ObjectId!
    name: String!
    profilePicture: String!
    preferred_username: String!
  }

  union NotificationEntity = Post | User

  enum NotificationType {
    like
    comment
    follow
    vote
    mention
  }

  type NotificationConnection {
    notifications: [Notification!]!
    totalCount: Int!
    hasMore: Boolean!
  }
`;
