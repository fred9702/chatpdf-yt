import {Pinecone, PineconeRecord} from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import {Document, RecursiveCharacterTextSplitter} from "@pinecone-database/doc-splitter"
import { getEmbeddings } from './embeddings';
import md5 from "md5";
import { Vector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
import { convertToAscii } from './utils';

let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!
        });
    }
    return pinecone;
}

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: { pageNumber: number }
    }
}

export async function loadS3IntoPinecone(fileKey: string) {
    //1. Obtain the pdf
    console.log("Downloading s3 into file system");
    const fileName = await downloadFromS3(fileKey);
    if (!fileName) {
        throw new Error("Could not download from S3");
    }
    const loader = new PDFLoader(fileName)
    const pages = (await loader.load()) as PDFPage[];

    //2. Split and segment the pdf
    const documents = await Promise.all(pages.map(prepareDocument))
    
    //3. Vectorise and embed indidual documents 
    const vectors = await Promise.all(documents.flat().map(embedDocument))
    
    //4. Upload to pinecone
    const client = await getPineconeClient();
    const pineconeIndex = client.index("chatgpt-yt")

    console.log('inserting vertors into pinecone')
   
    
    await pineconeIndex.namespace(md5(fileKey)).upsert(vectors)

    return documents[0]
    
}

async function embedDocument(doc: Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent);
        const hash = md5(doc.pageContent);
        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            }
        } as PineconeRecord
    } catch (error) {
        console.log(error);
        throw error
    }
}
export const truncateStringByBytes = (str: string, bytes: number) => {
    const enc = new TextEncoder();
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes))
}

async function prepareDocument(page: PDFPage) {
    let { pageContent, metadata } = page;
    pageContent = pageContent.replace(/\n/g, '')


    const splitter = new RecursiveCharacterTextSplitter()
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            }
        })
    ])
    return docs
}