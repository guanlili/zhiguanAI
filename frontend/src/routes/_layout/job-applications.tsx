import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Trash2, Download, Plus, Database, RefreshCw, Search } from "lucide-react"
import { Suspense, useState, useCallback } from "react"
import * as XLSX from "xlsx"

import { JobApplicationsService, MyJobApplicationsService, type UserJobApplicationPublic, type UserJobApplicationUpdate } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import { columns as catalogColumns } from "@/components/JobApplications/columns"
import { columns as myColumns } from "@/components/MyJobApplications/columns"
import PendingJobApplications from "@/components/Pending/PendingJobApplications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const getJobApplicationsQueryOptions = (skip = 0, limit = 100) => {
    return {
        queryFn: () => JobApplicationsService.readJobApplications({ skip, limit }),
        queryKey: ["job-applications", skip, limit],
    }
}

const getMyJobApplicationsQueryOptions = (skip = 0, limit = 100) => {
    return {
        queryFn: () => MyJobApplicationsService.readMyJobApplications({ skip, limit }),
        queryKey: ["my-job-applications", skip, limit],
    }
}

export const Route = createFileRoute("/_layout/job-applications")({
    component: JobApplications,
})

function CatalogTable({ filter }: { filter: string }) {
    const { data: jobApplications } = useSuspenseQuery(getJobApplicationsQueryOptions())

    if (jobApplications.data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-6 mb-6">
                    <Database className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">大厅暂无招聘信息</h3>
                <p className="text-muted-foreground mb-4">
                    请等待平台加载数据或手动配置
                </p>
                <InitMockDataButton />
            </div>
        )
    }

    return (
        <div className="px-2 pb-2">
            <DataTable
                columns={catalogColumns}
                data={jobApplications.data}
                globalFilter={filter}
            />
        </div>
    )
}

function InitMockDataButton() {
    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()

    const mutation = useMutation({
        mutationFn: () => JobApplicationsService.initMockData(),
        onSuccess: (data) => {
            showSuccessToast(data.message)
            queryClient.invalidateQueries({ queryKey: ["job-applications"] })
        },
        onError: handleError.bind(showErrorToast),
    })

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="h-8 gap-2"
        >
            {mutation.isPending ? (
                <RefreshCw className="size-4 animate-spin" />
            ) : (
                <Database className="size-4" />
            )}
            加载示例数据
        </Button>
    )
}

function JobApplications() {
    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()
    const { data: myApplications } = useSuspenseQuery(getMyJobApplicationsQueryOptions())

    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
    const [catalogFilter, setCatalogFilter] = useState("")
    const [myFilter, setMyFilter] = useState("")

    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id])

    const deleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            await Promise.all(ids.map(id => MyJobApplicationsService.deleteMyJobApplication({ id })))
        },
        onSuccess: () => {
            showSuccessToast(`成功删除 ${selectedIds.length} 条记录`)
            setRowSelection({})
            queryClient.invalidateQueries({ queryKey: ["my-job-applications"] })
        },
        onError: handleError.bind(showErrorToast),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: UserJobApplicationUpdate }) =>
            MyJobApplicationsService.updateMyJobApplication({ id, requestBody: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-job-applications"] })
        },
        onError: handleError.bind(showErrorToast),
    })

    const addMutation = useMutation({
        mutationFn: () => MyJobApplicationsService.createMyJobApplication({
            requestBody: { company: "", status: "未投递", priority: "中" }
        }),
        onSuccess: () => {
            showSuccessToast("已插入新行")
            queryClient.invalidateQueries({ queryKey: ["my-job-applications"] })
        },
        onError: handleError.bind(showErrorToast),
    })

    const reorderMutation = useMutation({
        mutationFn: async (newData: UserJobApplicationPublic[]) => {
            const updates = newData
                .filter((app, index) => app.order !== index)
                .map((app, index) =>
                    MyJobApplicationsService.updateMyJobApplication({
                        id: app.id,
                        requestBody: { order: index }
                    })
                )
            await Promise.all(updates)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-job-applications"] })
        },
        onError: handleError.bind(showErrorToast),
    })

    const updateData = (rowIndex: number, columnId: string, value: any) => {
        const row = myApplications.data[rowIndex]
        if (row) {
            updateMutation.mutate({ id: row.id, data: { [columnId]: value } })
        }
    }

    const exportToExcel = useCallback(() => {
        const exportData = myApplications.data.map(app => ({
            "公司": app.company,
            "职位": app.position,
            "进展状态": app.status,
            "重视度": app.priority,
            "行业": app.industry,
            "地点": app.location,
            "投递时间": app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "",
            "当前进展": app.progress,
            "备注": app.remarks,
            "内推码": app.referral_code,
            "链接1": app.apply_url,
            "链接2": app.apply_url2,
            "链接3": app.apply_url3,
        }))

        const worksheet = XLSX.utils.json_to_sheet(exportData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "我的投递进展")
        XLSX.writeFile(workbook, `我的网申进度_${new Date().toLocaleDateString()}.xlsx`)
    }, [myApplications.data])

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        网申中心
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        浏览招聘大厅并管理您的网申进展
                    </p>
                </div>
            </div>

            <Tabs defaultValue="my-applications" className="w-full">
                <TabsList className="grid w-[400px] grid-cols-2 mb-4">
                    <TabsTrigger value="catalog">招聘大厅</TabsTrigger>
                    <TabsTrigger value="my-applications">我的进展</TabsTrigger>
                </TabsList>

                <TabsContent value="catalog" className="m-0 space-y-4">
                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b bg-muted/30 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">全库招聘信息</span>
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="搜索地点..."
                                        className="pl-8 h-8 text-xs"
                                        value={catalogFilter}
                                        onChange={(e) => setCatalogFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                            <InitMockDataButton />
                        </div>
                        <Suspense fallback={<PendingJobApplications />}>
                            <CatalogTable filter={catalogFilter} />
                        </Suspense>
                    </div>
                </TabsContent>

                <TabsContent value="my-applications" className="m-0">
                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-b bg-muted/30">
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => addMutation.mutate()}
                                    disabled={addMutation.isPending}
                                    className="bg-primary hover:bg-primary/90 h-8 gap-2"
                                >
                                    <Plus className="size-4" />
                                    插入新行
                                </Button>

                                {selectedIds.length > 0 && (
                                    <div className="flex items-center gap-2 pl-3 border-l">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-8 px-3"
                                            onClick={() => deleteMutation.mutate(selectedIds)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            删除选中 ({selectedIds.length})
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => setRowSelection({})}
                                        >
                                            取消
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative w-48 mr-2">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="搜索地点..."
                                        className="pl-8 h-8 text-xs font-normal border-dashed"
                                        value={myFilter}
                                        onChange={(e) => setMyFilter(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 border-dashed"
                                    onClick={exportToExcel}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    导出 Excel
                                </Button>
                            </div>
                        </div>

                        <Suspense fallback={<PendingJobApplications />}>
                            <div className="px-2 pb-2">
                                <DataTable
                                    columns={myColumns}
                                    data={myApplications.data}
                                    rowSelection={rowSelection}
                                    onRowSelectionChange={setRowSelection}
                                    getRowId={(row) => row.id}
                                    reorderable
                                    onReorder={(newData) => reorderMutation.mutate(newData)}
                                    updateData={updateData}
                                    globalFilter={myFilter}
                                />
                            </div>
                        </Suspense>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
