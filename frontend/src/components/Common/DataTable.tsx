import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (row: TData) => void
  onRowDoubleClick?: (row: TData) => void
  onRowSelectionChange?: (rowSelection: any) => void
  rowSelection?: any
  getRowId?: (row: TData) => string
  reorderable?: boolean
  onReorder?: (data: TData[]) => void
  updateData?: (rowIndex: number, columnId: string, value: any) => void
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
}

function DraggableTableRow<TData>({
  row,
  onRowClick,
  onRowDoubleClick,
  reorderable,
}: {
  row: any
  onRowClick?: (row: TData) => void
  onRowDoubleClick?: (row: TData) => void
  reorderable?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
    position: "relative" as const,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      onClick={() => onRowClick?.(row.original)}
      onDoubleClick={() => onRowDoubleClick?.(row.original)}
      className={cn(
        (onRowClick || onRowDoubleClick) && "cursor-pointer select-none",
        isDragging && "bg-muted shadow-lg"
      )}
    >
      {row.getVisibleCells().map((cell: any) => (
        <TableCell key={cell.id}>
          <div className="flex items-center gap-2">
            {reorderable && cell.column.id === "select" && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
              >
                <GripVertical className="size-4 text-muted-foreground" />
              </div>
            )}
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  onRowDoubleClick,
  onRowSelectionChange,
  rowSelection = {},
  getRowId,
  reorderable,
  onReorder,
  updateData,
  globalFilter,
  onGlobalFilterChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange,
    onGlobalFilterChange,
    getRowId,
    state: {
      rowSelection,
      globalFilter,
    },
    meta: {
      updateData,
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id && data) {
      const oldIndex = data.findIndex((item) => (getRowId?.(item) || (item as any).id) === active.id)
      const newIndex = data.findIndex((item) => (getRowId?.(item) || (item as any).id) === over?.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder?.(arrayMove(data, oldIndex, newIndex))
      }
    }
  }

  const tableRows = table.getRowModel().rows

  const tableComponent = (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {tableRows.length ? (
          reorderable ? (
            <SortableContext
              items={tableRows.map((row) => row.id)}
              strategy={verticalListSortingStrategy}
            >
              {tableRows.map((row) => (
                <DraggableTableRow
                  key={row.id}
                  row={row}
                  onRowClick={onRowClick}
                  onRowDoubleClick={onRowDoubleClick}
                  reorderable={reorderable}
                />
              ))}
            </SortableContext>
          ) : (
            tableRows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                onDoubleClick={() => onRowDoubleClick?.(row.original)}
                className={cn(
                  (onRowClick || onRowDoubleClick) && "cursor-pointer select-none"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )
        ) : (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={columns.length}
              className="h-32 text-center text-muted-foreground"
            >
              No results found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="flex flex-col gap-4">
      {reorderable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          {tableComponent}
        </DndContext>
      ) : (
        tableComponent
      )}

      {table.getPageCount() > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-t bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{" "}
              to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
                data.length,
              )}{" "}
              of{" "}
              <span className="font-medium text-foreground">{data.length}</span>{" "}
              entries
            </div>
            <div className="flex items-center gap-x-2">
              <p className="text-sm text-muted-foreground">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 25, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-x-6">
            <div className="flex items-center gap-x-1 text-sm text-muted-foreground">
              <span>Page</span>
              <span className="font-medium text-foreground">
                {table.getState().pagination.pageIndex + 1}
              </span>
              <span>of</span>
              <span className="font-medium text-foreground">
                {table.getPageCount()}
              </span>
            </div>

            <div className="flex items-center gap-x-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
