// lib/apolloClient.js

import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: '/api/graphql',  // Change this line
  cache: new InMemoryCache()
});

export function getClient() {
  return new ApolloClient({
    uri: '/api/graphql',
    cache: new InMemoryCache()
  });
}

export default client;
