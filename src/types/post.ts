import { gql } from '@apollo/client';
import { ObjectId } from 'mongodb';

interface User {
    _id: ObjectId;
    preferred_username: string;
    password: string;
    email: string;
    name: string;
    profilePicture: string;
    oauthProviders: string[];
    bio: string;
    preferences: object;
    followers: ObjectId[];
    following: ObjectId[];
    createdAt: Date;
    posts: ObjectId[];
  }

export interface Post {
    _id: string;
    content: string;
    parentPost?: ObjectId | null;
    author: User;
    createdAt: string;
    type: "comment" | "poll";
    pollContent?: PollContentType;
    mediaUrls?: string[];
    likes: ObjectId[];
    comments: ObjectId[];
    tags: string[];
    visibility: "public" | "friends" | "private" | "deleted";
}

interface PollContentType {
    _id: string;
    question: string;
    type: "multiple" | "single" | "slider";
    options: string[];
    min?: number;
    max?: number;
    votes: VoteData;
    createdAt: string;
  }

interface VoteData {
  total: number;
  sum: number;
  average: number;
  options: { [key: string]: number };
}

export interface Comment {
    _id: string;
    content: string;
    author: string;
    createdAt: string;
  }
// GraphQL Queries
export const LIST_POSTS = gql`
  query ListPosts {
    listPosts {
      _id
      content
      type
      likes
      comments
      parentPost
      createdAt
      author {
        preferred_username
        profilePicture
        name
        followers
        following
        bio
      }
      pollContent {
        _id
        question
        type
        options
        min
        max
        votes {
          total
          sum
          average
          options
        }
      }
    }
  }
`;

export const GET_POST_BY_ID = gql`
  query GetPostById($postId: String!) {
    getPostById(id: $postId) {
      _id
      content
      author {
        preferred_username
        profilePicture
        name
        bio
        followers
        following
      }
      type
      pollContent {
        _id
        question
        type
        options
        min
        max
        votes {
          total
          sum
          average
          options
        }
      }
      createdAt
      likes
      comments
    }
  }
`;

export const GET_COMMENT_BY_ID = gql`
  query GetCommentById($commentId: String!) {
    getPostById(id: $commentId) {
      _id
      content
      author {
        preferred_username
        profilePicture
        name
        bio
        followers
        following
      }
      type
      createdAt
      likes
      comments
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($content: String!, $author: String!, $parentPost: String!, $createdAt: String!, $visibility: Visibility) {
    addComment(
      content: $content
      author: $author
      parentPost: $parentPost
      createdAt: $createdAt
      visibility: $visibility
    ) {
      _id
      content
      author {
        preferred_username
        profilePicture
      }
      createdAt
      visibility
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($postId: String!) {
    deletePost(postId: $postId)
  }
`;

export const CAST_VOTE = gql`
  mutation CastVote($userId: String!, $pollId: String!, $postId: String!, $choices: VoteChoiceInput!) {
    castVote(
      userId: $userId
      pollId: $pollId
      postId: $postId
      choices: $choices
    )
  }
`;

export const GET_USER_VOTES = gql`
  query GetUserVotes($userId: ObjectId!) {
    getUserVotes(userId: $userId) {
      _id
      pollId
      postId
      choices {
        ... on SingleChoice {
          singleChoice
        }
        ... on MultipleChoice {
          multipleChoices
        }
        ... on SliderChoice {
          sliderValue
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_POLL_VOTERS = gql`
  query GetPollVoters($pollId: ObjectId!) {
    getPollVoters(pollId: $pollId)
  }
`;
