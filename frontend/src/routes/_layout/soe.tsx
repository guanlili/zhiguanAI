
import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Building2, Plus, Filter, Upload, Download } from "lucide-react"
import { Suspense, useState } from "react"

import { SoeService, SoeEnterprisePublic, RegulatoryUnitPublic, ApiError } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import { getColumns } from "@/components/Soe/columns"
import { getRegulatoryUnitColumns } from "@/components/Soe/regulatoryUnitColumns"
import { EnterpriseDialog } from "@/components/Soe/EnterpriseDialog"
import { ComboboxMultiSelect } from "@/components/Common/ComboboxMultiSelect"
import { RegulatoryUnitDialog } from "@/components/Soe/RegulatoryUnitDialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export const Route = createFileRoute("/_layout/soe")({
    component: SoePage,
    head: () => ({
        meta: [
            {
                title: "国央企扫盲 - zhiguanAI",
            },
        ],
    }),
})

function SoePage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        国央企扫盲
                    </h1>
                    <p className="text-muted-foreground">
                        介绍中国境内的国央企及其监管单位，提供官网直达，AI锐评解析企业。
                    </p>
                </div>
            </div>

            <Tabs defaultValue="enterprises" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="enterprises">央企名录</TabsTrigger>
                    <TabsTrigger value="regulatory-units">监管单位</TabsTrigger>
                </TabsList>
                <TabsContent value="enterprises" className="mt-6">
                    <EnterprisesTab />
                </TabsContent>
                <TabsContent value="regulatory-units" className="mt-6">
                    <RegulatoryUnitsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function EnterprisesTab() {
    const [selectedUnit, setSelectedUnit] = useState<string>("all")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingEnterprise, setEditingEnterprise] = useState<SoeEnterprisePublic | undefined>()
    const [deleteEnterprise, setDeleteEnterprise] = useState<SoeEnterprisePublic | undefined>()
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])

    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()

    // Query for regulatory units for filter
    const { data: regulatoryUnits } = useQuery({
        queryKey: ["regulatory-units"],
        queryFn: () => SoeService.readRegulatoryUnits({ limit: 1000 }),
    })

    // Query for categories
    const { data: categories = [] } = useQuery({
        queryKey: ["enterprise-categories"],
        queryFn: () => SoeService.getEnterpriseCategories(),
    })

    const onEdit = (ent: SoeEnterprisePublic) => {
        setEditingEnterprise(ent)
        setDialogOpen(true)
    }

    const onDelete = (ent: SoeEnterprisePublic) => {
        setDeleteEnterprise(ent)
    }

    const deleteMutation = useMutation({
        mutationFn: (id: string) => SoeService.deleteEnterprise({ id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["enterprises"] })
            showSuccessToast("删除成功")
            setDeleteEnterprise(undefined)
        },
        onError: (err) => {
            const handler = handleError.bind(showErrorToast)
            handler(err as ApiError)
        }
    })

    const importMutation = useMutation({
        mutationFn: (file: File) => SoeService.importSoeData({ formData: { file } }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ["enterprises"] })
            queryClient.invalidateQueries({ queryKey: ["regulatory-units"] })
            showSuccessToast(response.message)
        },
        onError: (err) => {
            const handler = handleError.bind(showErrorToast)
            handler(err as ApiError)
        }
    })

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="筛选监管单位" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">所有监管单位</SelectItem>
                            {regulatoryUnits?.data.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <ComboboxMultiSelect
                        options={categories.map(c => ({ label: c, value: c }))}
                        selected={selectedCategories}
                        onChange={setSelectedCategories}
                        placeholder="筛选行业分类"
                        searchPlaceholder="搜索行业..."
                        className="w-[200px]"
                    />
                </div>
                <Button onClick={() => {
                    setEditingEnterprise(undefined)
                    setDialogOpen(true)
                }} className="gap-1">
                    <Plus className="h-4 w-4" /> 新增企业
                </Button>
                <div className="relative flex">
                    <input
                        type="file"
                        id="import-file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                importMutation.mutate(file)
                                // Reset value so same file can be selected again if needed
                                e.target.value = ''
                            }
                        }}
                    />
                    <Button variant="outline" className="gap-1 rounded-r-none border-r-0" onClick={() => {
                        const link = document.createElement('a');
                        link.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/soe/template`;
                        link.download = 'soe_import_template.xlsx';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}>
                        <Download className="h-4 w-4" /> 下载模板
                    </Button>
                    <Button variant="outline" className="gap-1 rounded-l-none" onClick={() => document.getElementById('import-file')?.click()}>
                        <Upload className="h-4 w-4" /> 导入数据
                    </Button>
                </div>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
                <EnterprisesTable
                    filterUnitId={selectedUnit === "all" ? undefined : selectedUnit}
                    selectedCategories={selectedCategories}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </Suspense>

            <EnterpriseDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                enterprise={editingEnterprise}
            />

            <AlertDialog open={!!deleteEnterprise} onOpenChange={(open) => !open && setDeleteEnterprise(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除?</AlertDialogTitle>
                        <AlertDialogDescription>
                            这将永久删除企业 "{deleteEnterprise?.name}"。此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteEnterprise && deleteMutation.mutate(deleteEnterprise.id)}
                        >
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function EnterprisesTable({
    filterUnitId,
    selectedCategories,
    onEdit,
    onDelete
}: {
    filterUnitId?: string,
    selectedCategories?: string[],
    onEdit: (ent: SoeEnterprisePublic) => void
    onDelete: (ent: SoeEnterprisePublic) => void
}) {
    // Fetch enterprises
    const { data: enterprises } = useSuspenseQuery({
        queryKey: ["enterprises", filterUnitId, selectedCategories],
        queryFn: () => SoeService.readEnterprises({
            limit: 1000,
            regulatoryUnitId: filterUnitId || undefined,
            category: selectedCategories && selectedCategories.length > 0 ? selectedCategories.join(',') : undefined
        }),
    })

    if (enterprises.data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16 border rounded-xl bg-card">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-6 mb-6">
                    <Building2 className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">暂无企业数据</h3>
                <p className="text-muted-foreground mb-4">
                    请尝试添加新的企业或切换筛选条件。
                </p>
            </div>
        )
    }

    return <DataTable columns={getColumns({ onEdit, onDelete })} data={enterprises.data} />
}

function RegulatoryUnitsTab() {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<RegulatoryUnitPublic | undefined>()
    const [deleteUnit, setDeleteUnit] = useState<RegulatoryUnitPublic | undefined>()

    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()

    const onEdit = (unit: RegulatoryUnitPublic) => {
        setEditingUnit(unit)
        setDialogOpen(true)
    }

    const onDelete = (unit: RegulatoryUnitPublic) => {
        setDeleteUnit(unit)
    }

    const deleteMutation = useMutation({
        mutationFn: (id: string) => SoeService.deleteRegulatoryUnit({ id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["regulatory-units"] })
            showSuccessToast("删除成功")
            setDeleteUnit(undefined)
        },
        onError: (err) => {
            const handler = handleError.bind(showErrorToast)
            handler(err as ApiError)
        }
    })

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <Button onClick={() => {
                    setEditingUnit(undefined)
                    setDialogOpen(true)
                }} className="gap-1">
                    <Plus className="h-4 w-4" /> 新增监管单位
                </Button>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
                <RegulatoryUnitsTable onEdit={onEdit} onDelete={onDelete} />
            </Suspense>

            <RegulatoryUnitDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                unit={editingUnit}
            />

            <AlertDialog open={!!deleteUnit} onOpenChange={(open: boolean) => !open && setDeleteUnit(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除?</AlertDialogTitle>
                        <AlertDialogDescription>
                            这将永久删除监管单位 "{deleteUnit?.name}" 及其下属的所有企业。此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteUnit && deleteMutation.mutate(deleteUnit.id)}
                        >
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function RegulatoryUnitsTable({
    onEdit,
    onDelete
}: {
    onEdit: (unit: RegulatoryUnitPublic) => void
    onDelete: (unit: RegulatoryUnitPublic) => void
}) {
    const { data: units } = useSuspenseQuery({
        queryKey: ["regulatory-units"],
        queryFn: () => SoeService.readRegulatoryUnits({ limit: 1000 }),
    })

    if (units.data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16 border rounded-xl bg-card">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-6 mb-6">
                    <Building2 className="h-12 w-12 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">暂无监管单位</h3>
                <p className="text-muted-foreground mb-4">
                    请尝试添加新的监管单位。
                </p>
            </div>
        )
    }

    return <DataTable columns={getRegulatoryUnitColumns({ onEdit, onDelete })} data={units.data} />
}
