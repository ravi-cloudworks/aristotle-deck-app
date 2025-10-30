# ZIP File Uploader to AWS S3

A web application that allows users to upload ZIP files to AWS S3 with metadata tracking and SQS queue integration for backend processing.

## Features

- Drag & drop or browse file selection
- ZIP file validation
- User information collection
- Progress tracking during upload
- Metadata marker file creation with:
  - File details (name, size, type, creation time)
  - Upload timestamp
  - User information (name, email, timezone)
  - User agent and session ID
- SQS message trigger for Lambda processing
- Cognito authentication for secure AWS access

## Files Structure

```
├── index.html        # Main HTML with drop zone UI
├── styles.css        # Styling for the application
├── config.js         # AWS configuration settings
├── uploader.js       # S3 upload and SQS messaging logic
└── app.js           # UI interaction and coordination
```

## AWS Setup Required

### 1. Create an S3 Bucket
```bash
aws s3 mb s3://your-bucket-name --region us-east-1
```

### 2. Create an SQS Queue
```bash
aws sqs create-queue --queue-name your-queue-name --region us-east-1
```

### 3. Set up Cognito Identity Pool

1. Go to AWS Cognito Console
2. Create a new Identity Pool
3. Enable "Unauthenticated identities"
4. Note the Identity Pool ID
5. Attach IAM role with permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-east-1:123456789012:your-queue-name"
    }
  ]
}
```

### 4. Configure S3 CORS

Add CORS policy to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["PUT", "POST"],
        "AllowedOrigins": ["https://yourusername.github.io"],
        "ExposeHeaders": ["ETag"]
    }
]
```

### 5. Update config.js

Edit `config.js` with your AWS settings:

```javascript
export const AWS_CONFIG = {
    region: 'us-east-1',
    identityPoolId: 'us-east-1:your-identity-pool-id',
    s3: {
        bucket: 'your-bucket-name',
        prefix: 'uploads/'
    },
    sqs: {
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/your-queue-name'
    }
};
```

## Deployment to GitHub Pages

### 1. Add AWS SDK to index.html

Update the `<head>` section to include AWS SDK:

```html
<script src="https://sdk.amazonaws.com/js/aws-sdk-2.1000.0.min.js"></script>
```

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to repository Settings
2. Navigate to Pages
3. Select "main" branch as source
4. Your app will be available at: `https://yourusername.github.io/your-repo/`

## Lambda Function (Backend)

Create a Lambda function triggered by SQS to process uploaded files:

```python
import json
import boto3

s3 = boto3.client('s3')

def lambda_handler(event, context):
    for record in event['Records']:
        # Parse SQS message
        body = json.loads(record['body'])
        bucket = body['bucket']
        key = body['key']
        marker_key = body['markerKey']
        
        # Read metadata marker
        metadata_obj = s3.get_object(Bucket=bucket, Key=marker_key)
        metadata = json.load(metadata_obj['Body'])
        
        # Verify upload details
        print(f"Processing: {metadata['file']['name']}")
        print(f"Uploaded by: {metadata['user']['name']} ({metadata['user']['email']})")
        print(f"Upload time: {metadata['upload']['uploadTime']}")
        
        # Process the ZIP file
        zip_obj = s3.get_object(Bucket=bucket, Key=key)
        # Your processing logic here
        
    return {'statusCode': 200, 'body': 'Processing complete'}
```

## Metadata JSON Structure

The marker file contains:

```json
{
  "file": {
    "name": "example.zip",
    "size": 1048576,
    "type": "application/zip",
    "lastModified": "2025-10-29T10:30:00.000Z"
  },
  "upload": {
    "uploadTime": "2025-10-29T12:45:30.123Z",
    "uploadTimestamp": 1730207130123,
    "userId": "user_1730207130123_abc123"
  },
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "userAgent": "Mozilla/5.0...",
    "timezone": "Asia/Kolkata"
  },
  "metadata": {
    "version": "1.0",
    "source": "web-upload"
  }
}
```

## Security Considerations

- Never commit AWS credentials to the repository
- Use Cognito Identity Pools for temporary credentials
- Limit IAM permissions to minimum required
- Enable S3 bucket encryption
- Set appropriate S3 lifecycle policies
- Validate file types and sizes on Lambda backend

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (requires CORS configuration)

## License

MIT
# aristotle-deck-app
