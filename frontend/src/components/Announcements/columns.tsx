
import { ColumnDef } from "@tanstack/react-table"
import { ExternalLink } from "lucide-react"

import { RecruitmentAnnouncementPublic } from "@/client"
import { AddToMyApplicationsButton } from "@/components/MyJobApplications/AddToMyApplicationsButton"

export const columns: ColumnDef<RecruitmentAnnouncementPublic>[] = [
    {
        accessorKey: "title",
        header: "公告标题",
        cell: ({ row }) => {
            const url = row.original.url
            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    {row.getValue("title")}
                    <ExternalLink className="h-3 w-3" />
                </a>
            )
        },
    },
    {
        accessorKey: "source",
        header: "来源",
        cell: ({ row }) => <div className="max-w-[150px] truncate" title={row.getValue("source")}>{row.getValue("source")}</div>,
    },
    {
        accessorKey: "category",
        header: "分类",
        cell: ({ row }) => <div className="max-w-[150px] truncate">{row.getValue("category")}</div>,
    },
    {
        accessorKey: "publish_date",
        header: "发布日期",
        cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("publish_date")}</div>,
    },
    {
        id: "operation",
        header: "操作",
        cell: ({ row }) => (
            <AddToMyApplicationsButton
                data={{
                    company: row.original.title,
                    apply_url: row.original.url,
                    industry: row.original.category || undefined,
                }}
            />
        ),
    },
]
