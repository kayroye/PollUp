interface User {
  __id: string;
  preferred_username: string;
  password: string;
  email: string;
  name: string;
  profilePicture: string;
  oauthProviders: string[];
  bio: string;
  preferences: object;
}

// Mock in-memory database
const users: User[] = [{
    __id: "0001",
  preferred_username: "test",
  email: "test@example.com",
  name: "test",
  profilePicture: "test",
  password: "test",
  oauthProviders: ["test"],
  bio: "test",
  preferences: {}
}, {
    __id: "0002",
    preferred_username: "test2",
    email: "test2@example.com",
    name: "test2",
    profilePicture: "test2",
    password: "test2",
    oauthProviders: ["test2"],
    bio: "test2",
    preferences: {}
}];

export async function connectToDatabase() {
  console.log('Connected to mock database');
  return { collection: (name: string) => ({ name }) };
}

export async function createUser(userData: {
  __id: string;
  preferred_username: string;
  email: string;
  name: string;
  profilePicture: string;
  oauthProviders: string[];
  bio: string;
  preferences: object;
  password: string;
}) {
  users.push(userData);
  console.log('User created:', userData);
}

export async function getUserByEmail(email: string) {
  return users.find(user => user.email === email);
}

export async function getUserById(userId: string) {
  return users.find(user => user.__id === userId);
}

export async function updateUser(userId: string, updateData: Partial<{
  email: string;
  username: string;
  name: string;
  profilePicture: string;
  oauthProviders: string[];
  bio: string;
  preferences: object;
}>) {
  const userIndex = users.findIndex(user => user.__id === userId);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updateData };
    console.log('User updated:', users[userIndex]);
  }
}

// Helper function to view all users (for testing)
export async function getAllUsers() {
  return users;
}
/*
* userData: {
  __id: string;
  preferred_username: string;
  email: string;
  name: string;
  profilePicture: string;
  oauthProviders: string[];
  bio: string;
  preferences: object;
}
*/