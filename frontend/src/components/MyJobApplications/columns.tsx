import React, { useState, useEffect, useRef } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLink, Calendar, MapPin, Building2, Briefcase, Star, Clock } from "lucide-react"

import type { UserJobApplicationPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MyJobApplicationActionsMenu } from "./MyJobApplicationActionsMenu"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const EditableCell = ({
    value: initialValue,
    row,
    column,
    table,
    type = "text",
    options = [],
    customRender,
    noTruncate = false,
}: any) => {
    const [value, setValue] = useState(initialValue)
    const [isEditing, setIsEditing] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const onSave = (newValue: any) => {
        setIsEditing(false)
        if (newValue !== initialValue) {
            table.options.meta?.updateData(row.index, column.id, newValue)
        }
    }

    const onBlur = () => {
        if (type !== "select") {
            onSave(value)
        }
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && type !== "select") {
            onSave(value)
        }
        if (e.key === "Escape") {
            setValue(initialValue)
            setIsEditing(false)
        }
    }

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        if (isEditing && inputRef.current && type !== "select") {
            inputRef.current.focus()
            if (type === "text") {
                inputRef.current.select()
            }
        }
    }, [isEditing, type])

    if (isEditing) {
        if (type === "select") {
            return (
                <Select
                    open={true}
                    onOpenChange={(open) => !open && setIsEditing(false)}
                    value={value || ""}
                    onValueChange={(val) => onSave(val)}
                >
                    <SelectTrigger className="h-8 w-full min-w-[100px] py-0 px-2 focus:ring-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((opt: any) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }

        if (type === "date") {
            return (
                <Input
                    ref={inputRef}
                    type="date"
                    value={value ? new Date(value).toISOString().split('T')[0] : ""}
                    onChange={e => setValue(e.target.value)}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    className="h-8 w-full min-w-[120px] px-2 py-1 text-sm focus-visible:ring-1"
                />
            )
        }

        return (
            <Input
                ref={inputRef}
                value={value as string || ""}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className="h-8 w-full min-w-[100px] px-2 py-1 text-sm focus-visible:ring-1"
            />
        )
    }

    const displayValue = () => {
        if (customRender) return customRender(initialValue)
        if (!initialValue) return <span className="text-muted-foreground/30 italic text-[10px]">双击编辑...</span>

        const str = String(initialValue).trim()

        // Find YYYY-MM-DD pattern anywhere in the string
        const match = str.match(/(\d{4}-\d{2}-\d{2})/)

        if (type === "date" || match) {
            return match ? match[1] : str.substring(0, 10)
        }

        return initialValue
    }

    return (
        <div
            onDoubleClick={() => setIsEditing(true)}
            className={cn(
                "w-full min-w-[50px] min-h-[1.5rem] flex items-center cursor-text hover:bg-muted/50 rounded px-1 -mx-1 transition-colors",
                !noTruncate && "overflow-hidden"
            )}
        >
            <div className={cn("w-full text-sm", !noTruncate && "truncate")}>
                {displayValue()}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string | null | undefined }) {
    if (!status) return <span className="text-muted-foreground italic">-</span>

    const colors: Record<string, string> = {
        "未投递": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        "已投递": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
        "笔试": "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
        "面试": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
        "Offer": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
        "感谢信": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
        "已结束": "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    }

    const colorClass = colors[status] || "bg-secondary text-secondary-foreground"

    return (
        <Badge variant="secondary" className={cn("font-medium", colorClass)}>
            {status}
        </Badge>
    )
}

function PriorityBadge({ priority }: { priority: string | null | undefined }) {
    if (!priority) return <span className="text-muted-foreground italic">-</span>

    const levels: Record<string, { color: string, icon: boolean }> = {
        "高": { color: "text-red-500 fill-red-500", icon: true },
        "中": { color: "text-amber-500 fill-amber-500", icon: true },
        "低": { color: "text-blue-500 fill-blue-500", icon: true },
    }

    const level = levels[priority]

    return (
        <div className="flex items-center gap-1">
            {level?.icon && <Star className={cn("size-3", level.color)} />}
            <span className={cn("text-xs font-medium", level?.color)}>{priority}</span>
        </div>
    )
}

export const columns: ColumnDef<UserJobApplicationPublic>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "company",
        header: "公司",
        cell: (props) => (
            <div className="flex items-center gap-2 w-full min-w-0">
                <Building2 className="size-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                    <EditableCell value={props.getValue()} {...props} noTruncate />
                </div>
            </div>
        ),
    },
    {
        accessorKey: "position",
        header: "职位",
        cell: (props) => (
            <div className="flex items-center gap-1 w-full min-w-0">
                <Briefcase className="size-3 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                    <EditableCell value={props.getValue()} {...props} noTruncate />
                </div>
            </div>
        ),
    },
    {
        accessorKey: "status",
        header: "进展状态",
        cell: (props) => (
            <EditableCell
                value={props.getValue()}
                {...props}
                type="select"
                options={[
                    { label: "未投递", value: "未投递" },
                    { label: "已投递", value: "已投递" },
                    { label: "笔试", value: "笔试" },
                    { label: "面试", value: "面试" },
                    { label: "Offer", value: "Offer" },
                    { label: "感谢信", value: "感谢信" },
                    { label: "已结束", value: "已结束" },
                ]}
                customRender={(val: string) => <StatusBadge status={val} />}
            />
        ),
    },
    {
        accessorKey: "priority",
        header: "重视度",
        cell: (props) => (
            <EditableCell
                value={props.getValue()}
                {...props}
                type="select"
                options={[
                    { label: "高", value: "高" },
                    { label: "中", value: "中" },
                    { label: "低", value: "低" },
                ]}
                customRender={(val: string) => <PriorityBadge priority={val} />}
            />
        ),
    },
    {
        accessorKey: "progress",
        header: "当前进展",
        cell: (props) => (
            <div className="w-full h-full flex items-center min-w-0">
                <EditableCell value={props.getValue()} {...props} />
            </div>
        ),
    },
    {
        accessorKey: "status_updated_at",
        header: "进展时间",
        cell: (props) => (
            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Clock className="size-3" />
                <EditableCell value={props.getValue()} {...props} type="date" />
            </div>
        ),
    },
    {
        accessorKey: "location",
        header: "地点",
        cell: (props) => (
            <div className="flex items-center gap-1 w-full min-w-0">
                <MapPin className="size-3 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                    <EditableCell value={props.getValue()} {...props} />
                </div>
            </div>
        ),
    },
    {
        accessorKey: "industry",
        header: "行业",
        cell: (props) => (
            <div className="w-full flex items-center min-w-0">
                <EditableCell value={props.getValue()} {...props} />
            </div>
        ),
    },
    {
        accessorKey: "applied_at",
        header: "投递时间",
        cell: (props) => (
            <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                <Calendar className="size-3 text-muted-foreground" />
                <EditableCell value={props.getValue()} {...props} type="date" />
            </div>
        ),
    },
    {
        accessorKey: "tags",
        header: "标签",
        cell: (props) => (
            <div className="w-full flex items-center min-w-0">
                <EditableCell value={props.getValue()} {...props} />
            </div>
        ),
    },
    {
        accessorKey: "referral_code",
        header: "内推码",
        cell: (props) => (
            <div className="w-full flex items-center min-w-0 text-[10px]">
                <EditableCell value={props.getValue()} {...props} />
            </div>
        ),
    },
    {
        accessorKey: "remarks",
        header: "备注",
        cell: (props) => (
            <div className="w-full flex items-center min-w-0">
                <EditableCell value={props.getValue()} {...props} />
            </div>
        ),
    },
    {
        id: "links",
        header: "相关链接",
        cell: ({ row }) => {
            const urls = [row.original.apply_url, row.original.apply_url2, row.original.apply_url3].filter(Boolean)
            if (urls.length === 0) return <span className="text-muted-foreground italic">-</span>
            return (
                <div className="flex gap-1">
                    {urls.map((url, i) => (
                        <a key={i} href={url!} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700" title={`链接 ${i + 1}`}>
                            <ExternalLink className="size-4" />
                        </a>
                    ))}
                </div>
            )
        }
    },
    {
        id: "actions",
        header: "操作",
        cell: ({ row }) => (
            <div className="flex justify-end">
                <MyJobApplicationActionsMenu myJobApplication={row.original} />
            </div>
        ),
    },
]
