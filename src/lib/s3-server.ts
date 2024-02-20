import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import fs from 'fs';

export async function downloadFromS3(fileKey: string) {
    try {

        const s3Client = new S3Client({
            region: process.env.NEXT_PUBLIC_AWS_REGION!,
            credentials: {
                accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.NEXT_PUBLIC_S3_ACCESS_SECRET_KEY!
            }
        });
        
        const command = new GetObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
            Key: fileKey
        });

        const response = await s3Client.send(command)
        const s3File = await response.Body?.transformToByteArray()
        const filename = `/tmp/pdf-${Date.now()}.pdf`;
        if (s3File) {
            fs.writeFileSync(filename, s3File as Buffer);
        }
        return filename
    } catch (error) {
        console.log(error);
    }
}