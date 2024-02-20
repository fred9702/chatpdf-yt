import ChatComponent from '@/components/ChatComponent'
import ChatSideBar from '@/components/ChatSideBar'
import PDFViewer from '@/components/PDFViewer'
import { db } from '@/lib/db'
import { chats } from '@/lib/db/schema'
import { auth } from '@clerk/nextjs'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
    params: {
        chatId: string
    }
}

const ChatPage = async ({params: { chatId }}: Props) => {
    console.log(`I am in chat: ${chatId}`)
    const { userId } = await auth();

    console.log(`UserID: ${userId}`);

    if (!userId) {
        return redirect('/sign-in');
    }

    const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
    
    if (!_chats) {
        console.log(`No _chats ${_chats}`)
        return redirect('/')
    }

    if (!_chats.find(chat => chat.id === parseInt(chatId))) {
        console.log(`No _chats.find ${_chats[0].id === parseInt(chatId)}`)
        return redirect('/')
    }

    const currentChat = _chats.find(chat => chat.id === parseInt(chatId));    
    
    return (
        <div className='flex max-h-screen'>
            <div className="flex w-full max-h-screen">
                <div className='flex-[1] max-w-xs'>
                    <ChatSideBar chats={_chats} chatId={parseInt(chatId)} />
                </div>
                <div className='p-4 flex-[5]'>
                    <PDFViewer pdf_url={currentChat?.pdfUrl || ''} />
                </div>
                <div className='flex-[3] border-l-4 border-l-slate-200'>
                    <ChatComponent />
                </div>
            </div>
        </div>
    )
}

export default ChatPage