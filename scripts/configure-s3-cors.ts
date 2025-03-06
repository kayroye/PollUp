import { configureBucketCors } from '../src/lib/aws';

// Run the configuration
configureBucketCors()
  .then(() => console.log('CORS configuration completed'))
  .catch(console.error); 