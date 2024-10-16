import { Collection, MongoClient, ObjectId } from "mongodb";

interface User {
    _id?: ObjectId;
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

interface Post {
  _id?: ObjectId;
  content: string;
  author: ObjectId;
  createdAt: Date;
  type?: 'text' | 'image' | 'video' | 'poll';
  pollContent?: object;
  mediaUrls?: string[];
  likes: ObjectId[];
  comments: ObjectId[];
  tags?: string[];
  visibility?: 'public' | 'friends' | 'private';
}

interface Comment {
  _id?: ObjectId;
  post?: ObjectId;
  parentComment?: ObjectId;
  content: string;
  author: ObjectId;
  createdAt: Date;
  likes: ObjectId[];
  replies: ObjectId[];
  reactions?: { user: ObjectId; type: 'like' | 'love' | 'funny' | 'sad' }[];
}
interface PollContent {
    _id?: ObjectId;
    question: string;
    type: 'multiple' | 'single' | 'slider';
    options?: string[]; // For 'multiple' and 'single' types
    min?: number;        // For 'slider' type
    max?: number;        // For 'slider' type
    votes?: VoteData;     // Structure to store votes
    createdAt: Date;
}

interface VoteData {
    [option: string]: number; // e.g., { "Option A": 10, "Option B": 5 }
}

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = { appName: "pollup-v1" };

let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }
  client = globalWithMongo._mongoClient;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
}

// Export a module-scoped MongoClient. By doing this in a
// separate module, the client can be shared across functions.

export default client;

export async function createUser(userData: User) {
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  const result = await collection.insertOne(userData);
  console.log('User created:', result.insertedId);
  return result.insertedId;
}

export async function getUserByEmail(email: string) {
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  return collection.findOne({ email });
}

export async function getUserByUsername(username: string) {
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  return collection.findOne({ preferred_username: username });
}

export async function getUserById(userId: ObjectId) {
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  try {
    const user = await collection.findOne({ _id: userId });
    if (!user) {
      console.log('User not found for ID:', userId);
    }
    return user;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
}

export async function createPost(postData: Post) {
  const db = client.db();
  const postsCollection: Collection<Post> = db.collection('posts');

  // If pollContent is provided, create a Poll first
  if (postData.pollContent) {
    const pollContent = postData.pollContent as PollContent;
    const pollId = await createPoll(pollContent);
    postData.pollContent = {
      _id: pollId,
    };
  }

  const result = await postsCollection.insertOne(postData);
  console.log('Post created:', result.insertedId);

  // Update the user's posts array
  await updateUser(postData.author, { $push: { posts: result.insertedId } });
  return result.insertedId;
}

export async function updatePost(postId: ObjectId, update: object) {
  const db = client.db();
  const collection: Collection<Post> = db.collection('posts');
  const result = await collection.updateOne({ _id: postId }, update);
  console.log('Post updated:', result.modifiedCount);
  return result.modifiedCount;
}

export async function getPostById(postId: ObjectId) {
  const db = client.db();
  const collection: Collection<Post> = db.collection('posts');
  return collection.findOne({ _id: postId });
}

export async function getAllPosts() {
  const db = client.db();
  const collection: Collection<Post> = db.collection('posts');
  return collection.find({}).toArray();
}

export async function createComment(commentData: Comment) {
  const db = client.db();
  const collection: Collection<Comment> = db.collection('comments');
  const result = await collection.insertOne(commentData);
  console.log('Comment created:', result.insertedId);

  // Update the post's comments array if it exists
  if (commentData.post) {
    await updatePost(commentData.post, { $push: { comments: result.insertedId } });
  }

  // Update the parent comment's replies array if it exists
  if (commentData.parentComment) {
    await updateComment(commentData.parentComment, { $push: { replies: result.insertedId } });
  }

  return result.insertedId;
}

export async function getCommentById(commentId: ObjectId) {
  const db = client.db();
  const collection: Collection<Comment> = db.collection('comments');
  return collection.findOne({ _id: commentId });
}

export async function getCommentsByPostId(postId: ObjectId) {
  const db = client.db();
  const collection: Collection<Comment> = db.collection('comments');
  return collection.find({ post: postId }).toArray();
}

export async function updateComment(commentId: ObjectId, update: object) {
  const db = client.db();
  const collection: Collection<Comment> = db.collection('comments');
  const result = await collection.updateOne({ _id: commentId }, update);
  console.log('Comment updated:', result.modifiedCount);
  return result.modifiedCount;
}

export async function deleteComment(commentId: ObjectId) {
  const db = client.db();

  // Update the post's comments array
  const comment = await getCommentById(commentId);

  if (!comment) {
    console.log('Comment not found for ID:', commentId);
    return 0;
  }

  if (comment.post) {
    await updatePost(comment.post, { $pull: { comments: commentId } });
  }

  // Update the parent comment's replies array
  if (comment.parentComment) {
    await updateComment(comment.parentComment, { $pull: { replies: commentId } });
  }

  const collection: Collection<Comment> = db.collection('comments');
  const result = await collection.deleteOne({ _id: commentId });
  console.log('Comment deleted:', result.deletedCount);

  
  return result.deletedCount;
}

export async function getAllUsers() {
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  return collection.find({}).toArray();
}

export async function updateUser(userId: ObjectId, update: object) {
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  const result = await collection.updateOne({ _id: userId }, update);
  console.log('User updated:', result.modifiedCount);
  return result.modifiedCount;
}

export async function deleteUser(userId: ObjectId) {  
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  const result = await collection.deleteOne({ _id: userId });
  console.log('User deleted:', result.deletedCount);
  return result.deletedCount;
}

export async function createPoll(pollData: PollContent) {
  const db = client.db();
  const collection: Collection<PollContent> = db.collection('polls');
  const result = await collection.insertOne({
    ...pollData,
    createdAt: new Date(),
  });
  console.log('Poll created:', result.insertedId);
  return result.insertedId;
}

export async function getPollById(pollId: ObjectId) {
  const db = client.db();
  const collection: Collection<PollContent> = db.collection('polls');
  return collection.findOne({ _id: pollId });
}

export async function updatePollVotes(pollId: ObjectId, voteData: VoteData) {
  const db = client.db();
  const collection: Collection<PollContent> = db.collection('polls');
  const result = await collection.updateOne(
    { _id: pollId },
    { $set: { votes: voteData } }
  );
  console.log('Poll votes updated:', result.modifiedCount);
  return result.modifiedCount;
}

export async function getAllPolls() {
  const db = client.db();
  const collection: Collection<PollContent> = db.collection('polls');
  return collection.find({}).toArray();
}
