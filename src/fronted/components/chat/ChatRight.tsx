import {cn} from "@/fronted/lib/utils";
import ChatRightSentences from "@/fronted/components/chat/ChatRightSentences";
import ChatRightSumary from "@/fronted/components/chat/ChatRightSumary";

const api = window.electron;
const ChatRight = ({sentence, className, points}: {
    sentence: string,
    points: string[],
    className: string,
    // updateWordPoint: (p: string[]) => void;
    // updatePhrasePoint: (p: string[]) => void;
}) => {
    return (
        <div className={cn('w-full flex flex-col gap-4 pr-6 px-10 overflow-y-auto')}>
            <ChatRightSumary sentence={sentence} points={points} className={cn('flex-shrink-0',className)}/>
            <ChatRightSentences sentence={sentence} points={points} className={cn('flex-shrink-0',className)}/>
        </div>
    )
}

export default ChatRight;
