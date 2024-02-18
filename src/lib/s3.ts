import AWS from 'aws-sdk';

export async function uploadToS3(file: File) {
    try {
        AWS.config.update({
            accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.NEXT_PUBLIC_S3_ACCESS_SECRET_KEY
        })
        const s3 = new AWS.S3({
            params: {
                Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
            },
            region: process.env.NEXT_PUBLIC_AWS_REGION
        })

        const fileKey = 'uploads/' + Date.now().toString() + file.name.replace(' ', '-')
        const params = {
            Bucket:  process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: fileKey,
            Body: file
        }
        const upload = s3.putObject(params).on('httpUploadProgress', evt => {
            console.log("Uploading to S3...", parseInt(((evt.loaded*100)/evt.total).toString()))
        }).promise();

        await upload.then(data => {
            console.log('successfully uploaded to s3!', fileKey)
        })

        return Promise.resolve({
            fileKey,
            fileName: file.name
        })
    } catch (error) {
        console.log(error);
    }
}

export function getS3Url(fileKey: string) {
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileKey}`
    return url;
}

// export const fileExists = async ({
// 	question,
// 	voice,
// }: {
// 	question: string;
// 	voice: string;
// }) => {
// 	const fileName = getFileName({question, voice});
// 	const s3 = new S3Client({
// 		region: env.AWS_S3_REGION,
// 		credentials: {
// 			accessKeyId: env.AWS_ACCESS_KEY_ID,
// 			secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
// 		},
// 	});

// 	try {
// 		return await s3.send(
// 			new HeadObjectCommand({Bucket: env.AWS_S3_BUCKET_NAME, Key: fileName})
// 		);
// 	} catch {
// 		console.log("WHATS GOING ON")
// 		return false;
// 	}
// };
