
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

interface LongTextCellProps {
    content?: string | null
    maxLength?: number
    className?: string
}

export function LongTextCell({ content, maxLength = 20, className }: LongTextCellProps) {
    if (!content) return <span className="text-muted-foreground">-</span>

    const isLong = content.length > maxLength
    const displayContent = isLong ? `${content.slice(0, maxLength)}...` : content

    if (!isLong) {
        return <div className={className}>{content}</div>
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="link" className={`p-0 h-auto font-normal justify-start text-foreground ${className}`}>
                    <span className="truncate max-w-[200px] text-left">
                        {displayContent} <Info className="inline h-3 w-3 ml-1 opacity-50" />
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
