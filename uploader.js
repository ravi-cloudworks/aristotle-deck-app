import { AWS_CONFIG, getUserId } from './config.js';

// Import AWS SDK v3 modules
// You need to include these via CDN or npm in your actual deployment
// For CDN, add these script tags to your HTML:
// <script src="https://sdk.amazonaws.com/js/aws-sdk-2.1000.0.min.js"></script>
// Or use AWS SDK v3 with import maps

class S3Uploader {
    constructor() {
        this.s3Client = null;
        this.sqsClient = null;
        this.initializeClients();
    }

    async initializeClients() {
        try {
            // Using AWS SDK v2 for browser compatibility
            // Configure credentials via Cognito Identity Pool
            AWS.config.region = AWS_CONFIG.region;
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: AWS_CONFIG.identityPoolId
            });

            // Get credentials
            await AWS.config.credentials.getPromise();

            this.s3Client = new AWS.S3({
                apiVersion: '2006-03-01',
                params: { Bucket: AWS_CONFIG.s3.bucket }
            });

            this.sqsClient = new AWS.SQS({
                apiVersion: '2012-11-05'
            });

            console.log('AWS clients initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize AWS clients:', error);
            throw new Error('AWS initialization failed: ' + error.message);
        }
    }

    createMetadata(file, userInfo) {
        const uploadTime = new Date().toISOString();
        
        return {
            file: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified).toISOString()
            },
            upload: {
                uploadTime: uploadTime,
                uploadTimestamp: Date.now(),
                userId: getUserId()
            },
            user: {
                name: userInfo.name || 'Unknown',
                email: userInfo.email || 'Unknown',
                userAgent: navigator.userAgent,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            metadata: {
                version: '1.0',
                source: 'web-upload'
            }
        };
    }

    generateS3Key(fileName, prefix = '') {
        const timestamp = Date.now();
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `${prefix}${timestamp}_${sanitizedName}`;
    }

    async uploadFile(file, userInfo, onProgress) {
        try {
            // Generate unique S3 key
            const s3Key = this.generateS3Key(file.name, AWS_CONFIG.s3.prefix);
            
            console.log('Uploading file to S3:', s3Key);

            // Upload the ZIP file to S3
            const uploadParams = {
                Bucket: AWS_CONFIG.s3.bucket,
                Key: s3Key,
                Body: file,
                ContentType: file.type || 'application/zip'
            };

            const upload = this.s3Client.upload(uploadParams);

            // Track upload progress
            upload.on('httpUploadProgress', (progress) => {
                const percentComplete = Math.round((progress.loaded / progress.total) * 100);
                if (onProgress) {
                    onProgress(percentComplete, 'Uploading file');
                }
            });

            const uploadResult = await upload.promise();
            console.log('File uploaded successfully:', uploadResult);

            // Create metadata marker file
            if (onProgress) {
                onProgress(100, 'Creating metadata marker');
            }

            const metadata = this.createMetadata(file, userInfo);
            const markerKey = s3Key.replace('.zip', '_metadata.json');

            const markerParams = {
                Bucket: AWS_CONFIG.s3.bucket,
                Key: markerKey,
                Body: JSON.stringify(metadata, null, 2),
                ContentType: 'application/json'
            };

            await this.s3Client.putObject(markerParams).promise();
            console.log('Metadata marker created:', markerKey);

            // Send message to SQS queue
            if (onProgress) {
                onProgress(100, 'Notifying processing queue');
            }

            await this.sendSQSMessage(s3Key, markerKey, metadata);

            return {
                success: true,
                s3Key: s3Key,
                markerKey: markerKey,
                location: uploadResult.Location,
                metadata: metadata
            };

        } catch (error) {
            console.error('Upload failed:', error);
            throw new Error('Upload failed: ' + error.message);
        }
    }

    async sendSQSMessage(s3Key, markerKey, metadata) {
        try {
            const messageBody = {
                bucket: AWS_CONFIG.s3.bucket,
                key: s3Key,
                markerKey: markerKey,
                uploadTime: metadata.upload.uploadTime,
                fileName: metadata.file.name,
                fileSize: metadata.file.size,
                userId: metadata.upload.userId,
                userName: metadata.user.name,
                userEmail: metadata.user.email
            };

            const params = {
                QueueUrl: AWS_CONFIG.sqs.queueUrl,
                MessageBody: JSON.stringify(messageBody),
                MessageAttributes: {
                    'fileType': {
                        DataType: 'String',
                        StringValue: 'zip'
                    },
                    'source': {
                        DataType: 'String',
                        StringValue: 'web-upload'
                    }
                }
            };

            const result = await this.sqsClient.sendMessage(params).promise();
            console.log('SQS message sent:', result.MessageId);
            return result;

        } catch (error) {
            console.error('Failed to send SQS message:', error);
            throw new Error('Failed to send queue message: ' + error.message);
        }
    }
}

export default S3Uploader;
