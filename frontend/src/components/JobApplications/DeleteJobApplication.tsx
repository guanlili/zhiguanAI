import { useMutation, useQueryClient } from "@tanstack/react-query"

import { type JobApplicationPublic, JobApplicationsService } from "@/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

interface DeleteJobApplicationProps {
    jobApplication: JobApplicationPublic
    open: boolean
    onOpenChange: (open: boolean) => void
}

const DeleteJobApplication = ({ jobApplication, open, onOpenChange }: DeleteJobApplicationProps) => {
    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()

    const mutation = useMutation({
        mutationFn: () =>
            JobApplicationsService.deleteJobApplication({ id: jobApplication.id }),
        onSuccess: () => {
            showSuccessToast("网申信息删除成功")
            onOpenChange(false)
        },
        onError: handleError.bind(showErrorToast),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["job-applications"] })
        },
    })

    const handleDelete = () => {
        mutation.mutate()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>确认删除</DialogTitle>
                    <DialogDescription>
                        您确定要删除 <span className="font-semibold text-foreground">{jobApplication.company_name}</span> 的网申信息吗？
                        此操作无法撤销。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                        <Button variant="outline" disabled={mutation.isPending}>
                            取消
                        </Button>
                    </DialogClose>
                    <LoadingButton
                        variant="destructive"
                        onClick={handleDelete}
                        loading={mutation.isPending}
                    >
                        删除
                    </LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteJobApplication
