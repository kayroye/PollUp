import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { createHttpLink } from '@apollo/client/link/http';
import { NormalizedCacheObject } from '@apollo/client';

const createApolloClient = (serverSide: boolean = false) => {
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        )
      );
    }
    if (networkError) console.log(`[Network error]: ${networkError}`);
  });

  let uri = '/api/graphql';
  if (serverSide) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    uri = `${baseUrl}/api/graphql`;
  }

  const httpLink = createHttpLink({
    uri,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });

  return new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
    },
    ssrMode: serverSide,
  });
};

let clientSideInstance: ApolloClient<NormalizedCacheObject> | null = null;
let serverSideInstance: ApolloClient<NormalizedCacheObject> | null = null;

export function getClient() {
  if (typeof window === 'undefined') {
    return serverSideInstance || (serverSideInstance = createApolloClient(true));
  }
  return clientSideInstance || (clientSideInstance = createApolloClient(false));
}

export default getClient();
