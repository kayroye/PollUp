import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4',
});

export async function POST(request: Request) {
  try {
    const { fileName, fileType, userId } = await request.json();
    
    const key = `profile-pictures/${userId}/${fileName}`;
    
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: "pollup-profile-pics",
      Key: key,
      ContentType: fileType,
      Expires: 60,
      ACL: 'public-read',
    });

    return NextResponse.json({
      url: presignedUrl,
      key: key,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 