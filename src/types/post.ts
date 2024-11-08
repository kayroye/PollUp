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
    visibility: "public" | "friends" | "private";
}

interface PollContentType {
    _id: string;
    question: string;
    type: "multiple" | "single" | "slider";
    options: string[];
    min?: number;
    max?: number;
    votes: Record<string, number>;
    createdAt: string;
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
      }
      pollContent {
        question
        type
        options
        min
        max
        votes
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
      }
      type
      pollContent {
        question
        type
        options
        min
        max
        votes
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
      }
      type
      createdAt
      likes
      comments
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($content: String!, $author: String!, $parentPost: String!, $createdAt: String!) {
    addComment(
      content: $content
      author: $author
      parentPost: $parentPost
      createdAt: $createdAt
    ) {
      _id
      content
      author {
        preferred_username
        profilePicture
      }
      createdAt
    }
  }
`;