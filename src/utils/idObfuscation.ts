// Function to encode MongoDB ObjectId to a numeric string
export function encodeId(objectId: string): string {
    // Simple example: Convert hexadecimal to decimal
    return BigInt('0x' + objectId).toString(10);
}

// Function to decode the numeric string back to MongoDB ObjectId
export function decodeId(encodedId: string): string {
    return BigInt(encodedId).toString(16).padStart(24, '0');
}

