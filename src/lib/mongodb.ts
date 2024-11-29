import { Collection, MongoClient, ObjectId } from "mongodb";

interface User {
    _id?: ObjectId;
    clerkUserId: string;
    preferred_username: string;
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
    likedPosts: LikedPost[];
}

interface Post {
  _id?: ObjectId;
  content: string;
  author: ObjectId;
  createdAt: Date;
  type?: 'poll' | 'comment';
  parentPost?: ObjectId;
  pollContent?: object;
  mediaUrls?: string[];
  likes: ObjectId[];
  comments: ObjectId[];
  tags?: string[];
  visibility?: 'public' | 'friends' | 'private' | 'deleted';
}

interface LikedPost {
  _id: ObjectId;
  type: 'post' | 'comment';
  post: ObjectId;
  createdAt: Date;
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
    closedAt?: Date;
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
  // Set the user's profile picture to the default profile picture if it's not provided
  if (!userData.profilePicture) {
    userData.profilePicture = '/default_avatar.png';
  }
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
      _id: pollId.toString(),
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

export async function addOrRemoveLike(postId: ObjectId, userId: ObjectId, onWhat: 'post') {
  const db = client.db();
  const userIdString = userId.toString();

  if (onWhat === 'post') {
    const collection: Collection<Post> = db.collection('posts');
    const post = await collection.findOne({ _id: postId });

    if (!post) {
      console.log('Post not found for ID:', postId);
      return 0;
    }

    if (post.likes.some(id => id.toString() === userIdString)) {
      await collection.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await updateUser(userId, { $pull: { likedPosts: { post: postId, type: 'post' } } });
      return -1;
    } else {
      await collection.updateOne({ _id: postId }, { $push: { likes: userId } });
      const newLikedPost: LikedPost = {
        _id: new ObjectId(),
        post: postId,
        type: 'post',
        createdAt: new Date(),
      };
      await updateUser(userId, { $push: { likedPosts: newLikedPost } });
      return 1;
    }
  }
}

export async function addComment(postId: ObjectId, commentId: ObjectId) {
  const db = client.db();
  const collection: Collection<Post> = db.collection('posts');
  const result = await collection.updateOne({ _id: postId }, { $push: { comments: commentId } });
  console.log('Comment added:', result.modifiedCount);
  return result.modifiedCount;
}

export async function getPostById(postId: ObjectId) {
  const db = client.db();
  const collection: Collection<Post> = db.collection('posts');
  const post = await collection.findOne({ _id: postId });

  if (!post) {
    return null;
  }

  if (post.visibility === 'deleted') {
    return null;
  }

  // Expand author information
  const author = await getUserById(post.author);

  // Expand poll content if it exists
  let expandedPollContent = null;
  if (post.pollContent && typeof post.pollContent === 'object' && '_id' in post.pollContent) {
    expandedPollContent = await getPollById(new ObjectId(post.pollContent._id as string));
  }

  // Convert createdAt to a string
  const createdAt = post.createdAt.toISOString();

  return {
    ...post,
    createdAt: createdAt,
    author: author ? {
      _id: author._id,
      name: author.name,
      profilePicture: author.profilePicture,
      preferred_username: author.preferred_username,
      bio: author.bio,
      followers: author.followers,
      following: author.following
    } : null,
    pollContent: expandedPollContent
  };
}

export async function getAllPosts() {
  const db = client.db();
  const collection: Collection<Post> = db.collection('posts');
  
  // Sort the posts by createdAt in descending order
  const posts = await collection.find({}).sort({ createdAt: -1 }).toArray();
  
  const expandedPosts = await Promise.all(posts.filter(post => post.visibility !== "deleted").map(async (post) => {
    // Expand author information
    const author = await getUserById(post.author);
    
    // Expand poll content if it exists
    let expandedPollContent = null;
    if (post.pollContent && typeof post.pollContent === 'object' && '_id' in post.pollContent) {
      expandedPollContent = await getPollById(new ObjectId(post.pollContent._id as string));
    }

    // Convert createdAt to a string
    const createdAt = post.createdAt.toISOString();
    
    return {
      ...post,
      createdAt: createdAt,
      author: author ? {
        name: author.name,
        profilePicture: author.profilePicture,
        preferred_username: author.preferred_username,
        bio: author.bio,
        followers: author.followers,
        following: author.following
      } : null,
      pollContent: expandedPollContent
    };
  }));
  
  return expandedPosts;
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

  // Initialize votes object with every option set to zero
  const initialVotes: VoteData = {};
  if (pollData.type === 'multiple' || pollData.type === 'single') {
    pollData.options?.forEach(option => {
      initialVotes[option] = 0;
    });
  } else if (pollData.type === 'slider') {
    // For slider type, initialize with min and max values
    initialVotes['min'] = 0;
    initialVotes['max'] = 0;
  }

  const result = await collection.insertOne({
    ...pollData,
    votes: initialVotes,
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

export async function getUserPosts(username: string, limit: number = 10, offset: number = 0) {
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }

  const db = client.db();
  const postsCollection = db.collection('posts');
  
  // Get total count for pagination
  const totalCount = await postsCollection.countDocuments({ 
    author: user._id,
    visibility: { $ne: "deleted" }
  });

  // Fetch paginated posts
  const posts = await postsCollection
    .find({ 
      author: user._id,
      visibility: { $ne: "deleted" }
    })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit + 1)
    .toArray();

  // Check if there are more posts
  const hasMore = posts.length > limit;
  const paginatedPosts = posts.slice(0, limit);

  // Expand the posts with author information
  const expandedPosts = await Promise.all(paginatedPosts.map(async (post) => {
    // Fetch and expand poll content if it exists
    let expandedPollContent = null;
    if (post.pollContent && typeof post.pollContent === 'object' && '_id' in post.pollContent) {
      expandedPollContent = await getPollById(new ObjectId(post.pollContent._id as string));
    }

    return {
      ...post,
      createdAt: post.createdAt.toISOString(),
      author: {
        _id: user._id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        preferred_username: user.preferred_username,
        bio: user.bio,
        oauthProviders: user.oauthProviders,
        preferences: user.preferences,
        followers: user.followers,
        following: user.following,
        createdAt: user.createdAt.toISOString(),
        posts: user.posts,
        likedPosts: user.likedPosts
      },
      pollContent: expandedPollContent
    };
  }));

  return {
    posts: expandedPosts,
    totalCount,
    hasMore
  };
}
