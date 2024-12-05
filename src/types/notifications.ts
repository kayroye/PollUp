import { ObjectId } from 'mongodb';
import { Post, User } from './post';

export interface Notification {
    _id: ObjectId;
    userId: ObjectId;
    type: 'like' | 'comment' | 'follow' | 'vote' | 'mention';
    actor: User; // User who triggered the notification
    entity: Post | User; // Post/Comment/Poll ID
    read: boolean;
    createdAt: Date;
}

export const GET_NOTIFICATIONS = `#graphql
  query GetNotifications($userId: ObjectId!, $limit: Int, $offset: Int) {
    getNotifications(userId: $userId, limit: $limit, offset: $offset) {
      notifications {
        _id
        type
        read
        createdAt
        actor {
          _id
          name
          preferred_username
          profilePicture
        }
        entity {
          __typename
          ... on Post {
            _id
            content
            author {
              preferred_username
            }
          }
          ... on User {
            _id
            preferred_username
          }
        }
      }
      totalCount
      hasMore
    }
  }
`;

export const MARK_NOTIFICATION_READ = `#graphql
  mutation MarkNotificationRead($notificationId: ObjectId!) {
    markNotificationRead(notificationId: $notificationId)
  }
`;

export const DELETE_NOTIFICATION = `#graphql
  mutation DeleteNotification($notificationId: ObjectId!) {
    deleteNotification(notificationId: $notificationId)
  }
`;

export const CREATE_NOTIFICATION = `#graphql
  mutation CreateNotification(
    $userId: String!
    $type: NotificationType!
    $actorId: String!
    $entityId: String!
  ) {
    createNotification(
      userId: $userId
      type: $type
      actorId: $actorId
      entityId: $entityId
    ) {
      _id
      type
      read
      createdAt
      actor {
        _id
        name
        preferred_username
        profilePicture
      }
      entity {
        __typename
        ... on Post {
          _id
          content
          author {
            preferred_username
          }
        }
        ... on User {
          _id
          preferred_username
        }
      }
    }
  }
`;


