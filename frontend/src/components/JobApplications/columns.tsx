import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLink, Calendar, MapPin, Building2, Briefcase } from "lucide-react"

import type { JobApplicationPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { JobApplicationActionsMenu } from "./JobApplicationActionsMenu"
import { AddToMyApplicationsButton } from "@/components/MyJobApplications/AddToMyApplicationsButton"

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

function formatDateTime(dateString: string): string {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}

function isDeadlineExpired(deadline: string | null | undefined): boolean {
    if (!deadline) return false
    return new Date(deadline) < new Date()
}

function TagsList({ tags }: { tags: string | null | undefined }) {
    if (!tags) return <span className="text-muted-foreground italic">-</span>
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean)
    return (
        <div className="flex flex-wrap gap-1">
            {tagList.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                </Badge>
            ))}
            {tagList.length > 3 && (
                <Badge variant="outline" className="text-xs">
                    +{tagList.length - 3}
                </Badge>
            )}
        </div>
    )
}

export const columns: ColumnDef<JobApplicationPublic>[] = [
    {
        accessorKey: "updated_at",
        header: "更新时间",
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDateTime(row.original.updated_at)}
            </span>
        ),
    },
    {
        accessorKey: "company_name",
        header: "公司名称",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <span className="font-medium">{row.original.company_name}</span>
            </div>
        ),
    },
    {
        accessorKey: "announcement_url",
        header: "公告链接",
        cell: ({ row }) => {
            const url = row.original.announcement_url
            if (!url) return <span className="text-muted-foreground italic">-</span>
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-blue-600 hover:text-blue-800"
                    asChild
                >
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4 mr-1" />
                        查看
                    </a>
                </Button>
            )
        },
    },
    {
        accessorKey: "apply_url",
        header: "投递链接",
        cell: ({ row }) => {
            const url = row.original.apply_url
            if (!url) return <span className="text-muted-foreground italic">-</span>
            return (
                <Button
                    variant="default"
                    size="sm"
                    className="h-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    asChild
                >
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4 mr-1" />
                        投递
                    </a>
                </Button>
            )
        },
    },
    {
        accessorKey: "industry",
        header: "行业",
        cell: ({ row }) => {
            const industry = row.original.industry
            if (!industry) return <span className="text-muted-foreground italic">-</span>
            return (
                <Badge variant="outline" className="font-normal">
                    {industry}
                </Badge>
            )
        },
    },
    {
        accessorKey: "tags",
        header: "标签",
        cell: ({ row }) => <TagsList tags={row.original.tags} />,
    },
    {
        accessorKey: "batch",
        header: "批次",
        cell: ({ row }) => {
            const batch = row.original.batch
            if (!batch) return <span className="text-muted-foreground italic">-</span>
            return (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {batch}
                </Badge>
            )
        },
    },
    {
        accessorKey: "position",
        header: "职位",
        cell: ({ row }) => {
            const position = row.original.position
            if (!position) return <span className="text-muted-foreground italic">-</span>
            return (
                <div className="flex items-center gap-1">
                    <Briefcase className="size-3 text-muted-foreground" />
                    <span className="text-sm">{position}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "location",
        header: "地点",
        cell: ({ row }) => {
            const location = row.original.location
            if (!location) return <span className="text-muted-foreground italic">-</span>
            return (
                <div className="flex items-center gap-1">
                    <MapPin className="size-3 text-muted-foreground" />
                    <span className="text-sm">{location}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "deadline",
        header: "投递截止",
        cell: ({ row }) => {
            const deadline = row.original.deadline
            const expired = isDeadlineExpired(deadline)
            if (!deadline) return <span className="text-muted-foreground italic">-</span>
            return (
                <div className="flex items-center gap-1">
                    <Calendar className={cn("size-3", expired ? "text-red-500" : "text-green-500")} />
                    <span className={cn("text-sm whitespace-nowrap", expired && "text-red-500 line-through")}>
                        {formatDate(deadline)}
                    </span>
                </div>
            )
        },
    },
    {
        id: "operation",
        header: "操作",
        cell: ({ row }) => (
            <AddToMyApplicationsButton
                data={{
                    company: row.original.company_name,
                    position: row.original.position || undefined,
                    apply_url: row.original.apply_url || undefined,
                    industry: row.original.industry || undefined,
                    location: row.original.location || undefined,
                    tags: row.original.tags || undefined,
                }}
            />
        ),
    },
    {
        id: "actions",
        header: () => <span className="sr-only">更多操作</span>,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <JobApplicationActionsMenu jobApplication={row.original} />
            </div>
        ),
    },
]
