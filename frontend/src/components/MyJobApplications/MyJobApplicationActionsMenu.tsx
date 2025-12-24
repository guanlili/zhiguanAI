import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"

import type { UserJobApplicationPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteMyJobApplication from "./DeleteMyJobApplication"
import EditMyJobApplication from "./EditMyJobApplication"

interface MyJobApplicationActionsMenuProps {
    myJobApplication: UserJobApplicationPublic
}

export function MyJobApplicationActionsMenu({ myJobApplication }: MyJobApplicationActionsMenuProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">操作菜单</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 size-4" />
                        编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setDeleteOpen(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 size-4" />
                        删除
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <EditMyJobApplication
                myJobApplication={myJobApplication}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
            <DeleteMyJobApplication
                myJobApplication={myJobApplication}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </>
    )
}
