
import { ColumnDef } from "@tanstack/react-table"
import { Trash2, Pencil } from "lucide-react"
import { RegulatoryUnitPublic } from "@/client"
import { Button } from "@/components/ui/button"

interface ColumnsProps {
    onEdit: (unit: RegulatoryUnitPublic) => void
    onDelete: (unit: RegulatoryUnitPublic) => void
}

export const getRegulatoryUnitColumns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<RegulatoryUnitPublic>[] => [
    {
        accessorKey: "name",
        header: "单位名称",
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("name")}</div>
        ),
    },
    {
        accessorKey: "level",
        header: "级别",
        cell: ({ row }) => <div>{row.getValue("level") || "-"}</div>,
    },
    {
        accessorKey: "description",
        header: "描述",
        cell: ({ row }) => <div className="max-w-[300px] truncate" title={row.getValue("description")}>{row.getValue("description") || "-"}</div>,
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const unit = row.original
            return (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(unit)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(unit)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
    },
]
