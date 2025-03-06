import AWS from "aws-sdk";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const uploadProfilePicture = async (file: File, userId: string) => {
  try {
    // First, get a pre-signed URL from our API
    const filename = `${Date.now()}-${file.name}`;
    const response = await fetch('/api/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: filename,
        fileType: file.type,
        userId: userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { url, key } = await response.json();

    // Then, upload the file directly to S3 using the pre-signed URL
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
      mode: 'cors',
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    // Return the public URL of the file
    return `https://pollup-profile-pics.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
};

export const deleteProfilePicture = async (userId: string) => {
  const params = {
    Bucket: "pollup-profile-pics",
    Key: `profile-pictures/${userId}`,
  };
  await s3.deleteObject(params).promise();
};

export const getPresignedUrl = (key: string) => {
  const params = {
    Bucket: "pollup-profile-pics",
    Key: key,
    Expires: 60 * 60, // URL valid for 1 hour
  };

  return s3.getSignedUrl("getObject", params);
};

export async function configureBucketCors() {
  const corsParams = {
    Bucket: "pollup-profile-pics",
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["PUT", "POST", "DELETE", "GET"],
          AllowedOrigins: [
            "http://localhost:3000",  // Development
            "https://pollup-v1-dev.vercel.app" // Add your production domain
          ],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  };

  try {
    await s3.putBucketCors(corsParams).promise();
    console.log("Successfully configured CORS");
  } catch (error) {
    console.error("Error configuring CORS:", error);
  }
}

// You can call this once when initializing your application
configureBucketCors();
