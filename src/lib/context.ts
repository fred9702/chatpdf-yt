import { Pinecone, QueryOptions } from "@pinecone-database/pinecone";
import md5 from "md5";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!
    })

    const index = await pinecone.Index("chatgpt-yt");

    try {
        const namespace = md5(fileKey);
        const queryRequest: QueryOptions = {
            vector: embeddings,
            topK: 5,
            includeMetadata: true
        }
        const queryResult = await index.namespace(namespace).query(queryRequest);
        return queryResult.matches || [];
    } catch (error) {
        console.log('error querying embeddings', error)
    }
}

export async function getContext(query: string, fileKey: string) {
    const queryEmbeddings = await getEmbeddings(query);

    if (queryEmbeddings) {
        const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey)
        const qualifyingDocs = matches!.filter((match) => match.score && match.score > 0.7)

        type Metadata = {
            text: string,
            pageNumber: number
        }

        let docs = qualifyingDocs.map(match => (match.metadata as Metadata).text)
        return docs.join('\n').substring(0, 3000);
    } else {
        console.log('no embeddings')
    }
}