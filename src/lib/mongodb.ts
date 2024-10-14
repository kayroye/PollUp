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
}

interface Post {
    _id?: ObjectId;
    title: string;
    content: string;
    author: number;
    createdAt: string;
    pollContent?: PollContent;
}

interface PollContent {
    _id?: ObjectId;
    question: string;
    type: 'multiple' | 'single' | 'slider';
    options?: string[]; // For 'multiple' and 'single' types
    min?: number;        // For 'slider' type
    max?: number;        // For 'slider' type
    votes?: VoteData;    // Structure to store votes
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
  return collection.findOne({ _id: userId });
}

export async function createPost(postData: Post) {
  const db = client.db();
  const postsCollection: Collection<Post> = db.collection('posts');

  // If pollContent is provided, create a Poll first
  if (postData.pollContent) {
    const pollId = await createPoll(postData.pollContent);
    postData.pollContent._id = pollId;
  }

  const result = await postsCollection.insertOne(postData);
  console.log('Post created:', result.insertedId);
  return result.insertedId;
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

export async function getAllUsers() {
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  return collection.find({}).toArray();
}

export async function updateUser(userId: ObjectId, userData: Partial<User>) {
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  const result = await collection.updateOne({ _id: userId }, { $set: userData });
  console.log('User updated:', result.upsertedId);
  return result.upsertedId;
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
