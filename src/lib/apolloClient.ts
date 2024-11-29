import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { createHttpLink } from '@apollo/client/link/http';

// Common configuration
const createApolloClient = (serverSide: boolean = false) => {
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        )
      );
    if (networkError) console.log(`[Network error]: ${networkError}`);
  });

  const httpLink = createHttpLink({
    uri: serverSide 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/graphql`
      : '/api/graphql',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  return new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
    ssrMode: serverSide,
  });
};

// Client-side singleton instance
const client = createApolloClient();

// Function for server-side usage
export function getClient() {
  return createApolloClient(true);
}

export default client;
