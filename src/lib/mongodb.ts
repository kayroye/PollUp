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

export async function getUserById(userId: string) {
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  return collection.findOne({ _id: new ObjectId(userId) });
}

export async function createPost(postData: Post) {
  const db = client.db();
  const collection: Collection<Post> = db.collection('posts');
  const result = await collection.insertOne(postData);
  console.log('Post created:', result.insertedId);
  return result.insertedId;
}

export async function getPostById(postId: string) {
  const db = client.db();
  const collection: Collection<Post> = db.collection('posts');
  return collection.findOne({ _id: new ObjectId(postId) });
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

export async function updateUser(userId: string, userData: Partial<User>) {
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  const result = await collection.updateOne({ __id: userId }, { $set: userData });
  console.log('User updated:', result.upsertedId);
  return result.upsertedId;
}

export async function deleteUser(userId: string) {  
  const db = client.db();
  const collection: Collection<User> = db.collection('users');
  const result = await collection.deleteOne({ __id: userId });
  console.log('User deleted:', result.deletedCount);
  return result.deletedCount;
}

