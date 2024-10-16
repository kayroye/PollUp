import { ApolloServer } from 'apollo-server-micro';
import { typeDefs } from '@/graphql/typeDefs';
import { resolvers } from '@/graphql/resolvers';
import { NextApiRequest, NextApiResponse } from 'next';

const apolloServer = new ApolloServer({ typeDefs, resolvers, context: ({ req, res }: { req: NextApiRequest; res: NextApiResponse }) => ({ req, res }) });
// Add plugins: [ApolloServerPluginLandingPageDisabled()] before deploying to production

const startServer = apolloServer.start();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await startServer;
  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};