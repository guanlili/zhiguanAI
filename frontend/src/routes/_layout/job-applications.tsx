import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FileText, Database, RefreshCw } from "lucide-react"
import { Suspense } from "react"

import { JobApplicationsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddJobApplication from "@/components/JobApplications/AddJobApplication"
import { columns } from "@/components/JobApplications/columns"
import PendingJobApplications from "@/components/Pending/PendingJobApplications"
import { Button } from "@/components/ui/button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

function getJobApplicationsQueryOptions() {
    return {
        queryFn: () => JobApplicationsService.readJobApplications({ skip: 0, limit: 100 }),
        queryKey: ["job-applications"],
    }
}

export const Route = createFileRoute("/_layout/job-applications")({
    component: JobApplications,
    head: () => ({
        meta: [
            {
                title: "网申表格 - zhiguanAI",
            },
        ],
    }),
})

function JobApplicationsTableContent() {
    const { data: jobApplications } = useSuspenseQuery(getJobApplicationsQueryOptions())

    if (jobApplications.data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-6 mb-6">
                    <FileText className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">暂无网申信息</h3>
                <p className="text-muted-foreground mb-4">
                    点击上方"添加网申"按钮添加新信息，或者加载 Mock 数据进行测试
                </p>
            </div>
        )
    }

    return <DataTable columns={columns} data={jobApplications.data} />
}

function JobApplicationsTable() {
    return (
        <Suspense fallback={<PendingJobApplications />}>
            <JobApplicationsTableContent />
        </Suspense>
    )
}

function InitMockDataButton() {
    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()

    const mutation = useMutation({
        mutationFn: () => JobApplicationsService.initMockData(),
        onSuccess: (data) => {
            showSuccessToast(data.message)
        },
        onError: handleError.bind(showErrorToast),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["job-applications"] })
        },
    })

    return (
        <Button
            variant="outline"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="gap-2"
        >
            {mutation.isPending ? (
                <RefreshCw className="size-4 animate-spin" />
            ) : (
                <Database className="size-4" />
            )}
            加载 Mock 数据
        </Button>
    )
}

function JobApplications() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        网申表格
                    </h1>
                    <p className="text-muted-foreground">
                        管理校招/社招网申信息，追踪投递进度
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <InitMockDataButton />
                    <AddJobApplication />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard
                    title="总计网申"
                    icon={<FileText className="size-5" />}
                    colorClass="from-blue-500 to-cyan-500"
                />
            </div>

            {/* Main Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <JobApplicationsTable />
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
    const { data } = useSuspenseQuery(getJobApplicationsQueryOptions())

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
