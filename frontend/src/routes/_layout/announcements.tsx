
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FileText, Play, RefreshCw, Filter } from "lucide-react"
import { Suspense, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { AnnouncementsService, SchedulerService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import { columns } from "@/components/Announcements/columns"
import PendingJobApplications from "@/components/Pending/PendingJobApplications"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

// Filter Schema
const filterSchema = z.object({
    source: z.string().optional(),
    category: z.string().optional(),
})

type FilterValues = z.infer<typeof filterSchema>

function getAnnouncementsQueryOptions(filters: FilterValues) {
    return {
        queryFn: () => AnnouncementsService.readAnnouncements({
            skip: 0,
            limit: 100,
            source: filters.source || undefined,
            category: filters.category || undefined,
        }),
        queryKey: ["announcements", filters],
    }
}

export const Route = createFileRoute("/_layout/announcements")({
    component: AnnouncementsPage,
    head: () => ({
        meta: [
            {
                title: "招聘简章 - zhiguanAI",
            },
        ],
    }),
})

function AnnouncementsTableContent({ filters }: { filters: FilterValues }) {
    const { data: announcements } = useSuspenseQuery(getAnnouncementsQueryOptions(filters))

    if (announcements.data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-6 mb-6">
                    <FileText className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">未找到招聘简章</h3>
                <p className="text-muted-foreground mb-4">
                    {Object.values(filters).some(Boolean) ? "请尝试清除过滤条件" : "目前还没有采集到任何招聘简章数据。你可以尝试手动执行采集任务。"}
                </p>
                {!Object.values(filters).some(Boolean) && <RunCrawlerButton days={30} />}
            </div>
        )
    }

    return <DataTable columns={columns} data={announcements.data} />
}

function AnnouncementsTable({ filters }: { filters: FilterValues }) {
    return (
        <Suspense fallback={<PendingJobApplications />}>
            <AnnouncementsTableContent filters={filters} />
        </Suspense>
    )
}

function RunCrawlerButton({ days = 7 }: { days?: number }) {
    const { showSuccessToast, showErrorToast } = useCustomToast()
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: () => SchedulerService.runNow({ days }),
        onSuccess: () => {
            showSuccessToast("采集任务已在后台启动，请稍后刷新查看结果")
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["announcements"] })
            }, 5000)
        },
        onError: handleError.bind(showErrorToast),
    })

    return (
        <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="gap-2"
        >
            {mutation.isPending ? (
                <RefreshCw className="size-4 animate-spin" />
            ) : (
                <Play className="size-4" />
            )}
            立即采集 (近{days}天)
        </Button>
    )
}

function FilterSection({ onFilter }: { onFilter: (values: FilterValues) => void }) {
    // Hardcoded options for now based on what we know. 
    // Ideally these come from a "distinct" API endpoint.
    const sourceOptions = [
        "所有来源",
        "北京市人力资源和社会保障局",
        "人力资源和社会保障部",
    ]
    const categoryOptions = [
        "所有分类",
        "事业单位公开招聘",
        "中央和国家机关事业单位公开招聘",
    ]

    const form = useForm<FilterValues>({
        resolver: zodResolver(filterSchema),
        defaultValues: {
            source: "",
            category: "",
        },
    })

    function onSubmit(data: FilterValues) {
        // Handle "All" selection by converting to empty string
        const fixedData = {
            source: data.source === "所有来源" ? "" : data.source,
            category: data.category === "所有分类" ? "" : data.category,
        }
        onFilter(fixedData)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4 rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <Filter className="w-4 h-4" /> 筛选:
                </div>
                <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                        <FormItem className="w-[200px]">
                            <Select onValueChange={(val) => {
                                field.onChange(val)
                                form.handleSubmit(onSubmit)()
                            }} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="来源" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {sourceOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem className="w-[200px]">
                            <Select onValueChange={(val) => {
                                field.onChange(val)
                                form.handleSubmit(onSubmit)()
                            }} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="分类" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categoryOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
                {/* Reset Button could go here */}
            </form>
        </Form>
    )
}

function AnnouncementsPage() {
    const [filters, setFilters] = useState<FilterValues>({})

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        招聘简章
                    </h1>
                    <p className="text-muted-foreground">
                        汇集各渠道的最新招聘公告和简章
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <RunCrawlerButton days={7} />
                </div>
            </div>

            {/* Filter Section */}
            <FilterSection onFilter={setFilters} />

            {/* Stats Cards - Pass filters to update counts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard
                    title="符合条件公告"
                    icon={<FileText className="size-5" />}
                    colorClass="from-blue-500 to-cyan-500"
                    filters={filters}
                />
            </div>

            {/* Main Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <AnnouncementsTable filters={filters} />
            </div>
        </div>
    )
}

interface StatsCardProps {
    title: string
    icon: React.ReactNode
    colorClass: string
    filters?: FilterValues
}

function StatsCard({ title, icon, colorClass, filters = {} }: StatsCardProps) {
    const { data } = useSuspenseQuery(getAnnouncementsQueryOptions(filters))

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`rounded-lg bg-gradient-to-br ${colorClass} p-2.5 text-white`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{data?.count ?? 0}</p>
                </div>
            </div>
        </div>
    )
}
