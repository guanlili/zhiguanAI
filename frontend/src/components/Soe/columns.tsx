
import { ColumnDef } from "@tanstack/react-table"
import { ExternalLink, Trash2, Pencil } from "lucide-react"
import { SoeEnterprisePublic } from "@/client"
import { Button } from "@/components/ui/button"

interface ColumnsProps {
    onEdit: (enterprise: SoeEnterprisePublic) => void
    onDelete: (enterprise: SoeEnterprisePublic) => void
}

export const getColumns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<SoeEnterprisePublic>[] => [
    {
        accessorKey: "name",
        header: "企业名称",
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("name")}</div>
        ),
    },
    {
        accessorKey: "website",
        header: "官网",
        cell: ({ row }) => {
            const url = row.original.website
            if (!url) return <span className="text-muted-foreground">-</span>
            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
                >
                    官网
                    <ExternalLink className="h-3 w-3" />
                </a>
            )
        },
    },
    {
        accessorKey: "category",
        header: "行业分类",
        cell: ({ row }) => <div>{row.getValue("category") || "-"}</div>,
    },
    {
        accessorKey: "regulatory_unit_name",
        header: "所属监管单位",
        cell: ({ row }) => <div>{row.original.regulatory_unit_name || "-"}</div>,
    },
    {
        accessorKey: "deepseek_comment",
        header: "Deepseek锐评",
        cell: ({ row }) => <div className="max-w-[200px] truncate" title={row.getValue("deepseek_comment")}>{row.getValue("deepseek_comment") || "-"}</div>,
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const enterprise = row.original
            return (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(enterprise)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(enterprise)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
    },
]
