import { loadS3IntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
    try {
        const body = await req.json()
        const {fileKey, fileName} = body;
        console.log(fileKey, fileName);
        await loadS3IntoPinecone(fileKey);
        return NextResponse.json({message: 'success'})
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {error: "Internal server error"},
            {status: 500}
        )
    }
}