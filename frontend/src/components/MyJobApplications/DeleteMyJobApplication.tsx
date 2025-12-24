import { useMutation, useQueryClient } from "@tanstack/react-query"

import { MyJobApplicationsService, type UserJobApplicationPublic } from "@/client"
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

interface DeleteMyJobApplicationProps {
    myJobApplication: UserJobApplicationPublic
    open: boolean
    onOpenChange: (open: boolean) => void
}

const DeleteMyJobApplication = ({ myJobApplication, open, onOpenChange }: DeleteMyJobApplicationProps) => {
    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()

    const mutation = useMutation({
        mutationFn: () => MyJobApplicationsService.deleteMyJobApplication({ id: myJobApplication.id }),
        onSuccess: () => {
            showSuccessToast("记录已成功删除")
            onOpenChange(false)
        },
        onError: handleError.bind(showErrorToast),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["my-job-applications"] })
        },
    })

    const handleDelete = () => {
        mutation.mutate()
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>确定要删除此网申记录吗？</AlertDialogTitle>
                    <AlertDialogDescription>
                        您将删除 "{myJobApplication.company}" 的投递进展记录。此操作无法撤销。
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={mutation.isPending}>取消</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "正在删除..." : "确定删除"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default DeleteMyJobApplication
