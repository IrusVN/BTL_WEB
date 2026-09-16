const crypto = require('crypto');

let s3ClientInstance = null;
let S3Sdk = null;

try {
    S3Sdk = require('@aws-sdk/client-s3');
} catch (e) {
    S3Sdk = null;
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
    const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    return kSigning;
}

async function uploadWithNativeSigV4({ buffer, mimeType, key, accountId, accessKeyId, secretAccessKey, bucketName, publicUrl }) {
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${bucketName}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');

    const canonicalUri = `/${bucketName}/${key}`;
    const canonicalHeaders = `content-type:${mimeType}\nhost:${host}\nx-amz-content-sha256:${contentHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${contentHash}`;
    const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${dateStamp}/auto/s3/aws4_request\n${hashedCanonicalRequest}`;
    const signingKey = getSignatureKey(secretAccessKey, dateStamp, 'auto', 's3');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${dateStamp}/auto/s3/aws4_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Content-Type': mimeType,
            'Host': host,
            'x-amz-content-sha256': contentHash,
            'x-amz-date': amzDate,
            'Authorization': authorizationHeader
        },
        body: buffer
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`R2 upload failed (${response.status}): ${errorText}`);
    }

    const cleanPublicUrl = publicUrl ? publicUrl.replace(/\/+$/, '') : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
    return `${cleanPublicUrl}/${key}`;
}

async function uploadWithAwsSdk({ buffer, mimeType, key, accountId, accessKeyId, secretAccessKey, bucketName, publicUrl }) {
    if (!s3ClientInstance) {
        s3ClientInstance = new S3Sdk.S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey
            }
        });
    }

    const command = new S3Sdk.PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType
    });

    await s3ClientInstance.send(command);

    const cleanPublicUrl = publicUrl ? publicUrl.replace(/\/+$/, '') : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
    return `${cleanPublicUrl}/${key}`;
}

exports.uploadToR2 = async function ({ buffer, mimeType, originalName, folder = 'products' }) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
        throw new Error('Chưa cấu hình đầy đủ biến môi trường Cloudflare R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)');
    }

    const ext = originalName && originalName.includes('.') ? originalName.split('.').pop().toLowerCase() : 'jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const key = `${folder}/${uniqueSuffix}.${ext}`;

    const params = {
        buffer,
        mimeType: mimeType || 'image/jpeg',
        key,
        accountId,
        accessKeyId,
        secretAccessKey,
        bucketName,
        publicUrl
    };

    if (S3Sdk && S3Sdk.S3Client) {
        return await uploadWithAwsSdk(params);
    }
    return await uploadWithNativeSigV4(params);
};
