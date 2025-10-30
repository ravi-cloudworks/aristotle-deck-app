// AWS Configuration
// Replace these values with your actual AWS settings

export const AWS_CONFIG = {
    region: 'us-east-1', // Your AWS region
    
    // Cognito Identity Pool ID for authentication
    identityPoolId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    
    // S3 Bucket configuration
    s3: {
        bucket: 'your-bucket-name',
        // Optional: folder prefix for uploads
        prefix: 'uploads/'
    },
    
    // SQS Queue URL
    sqs: {
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/your-queue-name'
    }
};

// User identification (you can customize this)
export function getUserId() {
    // Generate or retrieve a unique user session ID
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }
    return userId;
}
