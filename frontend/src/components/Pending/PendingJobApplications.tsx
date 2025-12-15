import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const PendingJobApplications = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>更新时间</TableHead>
                <TableHead>公司名称</TableHead>
                <TableHead>公告链接</TableHead>
                <TableHead>投递链接</TableHead>
                <TableHead>行业</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>批次</TableHead>
                <TableHead>职位</TableHead>
                <TableHead>地点</TableHead>
                <TableHead>投递截止</TableHead>
                <TableHead>
                    <span className="sr-only">操作</span>
                </TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell>
                        <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-8 w-16" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-8 w-16" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                        <div className="flex gap-1">
                            <Skeleton className="h-5 w-10" />
                            <Skeleton className="h-5 w-10" />
                        </div>
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                        <div className="flex justify-end">
                            <Skeleton className="size-8 rounded-md" />
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
)

export default PendingJobApplications
