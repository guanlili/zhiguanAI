
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FileText, Play, RefreshCw } from "lucide-react"
import { Suspense, useState } from "react"

import { AnnouncementsService, SchedulerService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import { columns } from "@/components/Announcements/columns"
import PendingJobApplications from "@/components/Pending/PendingJobApplications"
import { Button } from "@/components/ui/button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

function getAnnouncementsQueryOptions() {
    return {
        queryFn: () => AnnouncementsService.readAnnouncements({ skip: 0, limit: 100 }),
        queryKey: ["announcements"],
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

function AnnouncementsTableContent() {
    const { data: announcements } = useSuspenseQuery(getAnnouncementsQueryOptions())

    if (announcements.data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-6 mb-6">
                    <FileText className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">暂无招聘简章</h3>
                <p className="text-muted-foreground mb-4">
                    目前还没有采集到任何招聘简章数据。你可以尝试手动执行采集任务。
                </p>
                <RunCrawlerButton days={30} />
            </div>
        )
    }

    return <DataTable columns={columns} data={announcements.data} />
}

function AnnouncementsTable() {
    return (
        <Suspense fallback={<PendingJobApplications />}>
            <AnnouncementsTableContent />
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
            // Invalidate queries to refresh data eventually, though crawl takes time
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

function AnnouncementsPage() {
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard
                    title="总计公告"
                    icon={<FileText className="size-5" />}
                    colorClass="from-blue-500 to-cyan-500"
                />
            </div>

            {/* Main Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <AnnouncementsTable />
            </div>
        </div>
    )
}

interface StatsCardProps {
    title: string
    icon: React.ReactNode
    colorClass: string
}

function StatsCard({ title, icon, colorClass }: StatsCardProps) {
    const { data } = useSuspenseQuery(getAnnouncementsQueryOptions())

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
