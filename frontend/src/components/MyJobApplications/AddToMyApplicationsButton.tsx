import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { MyJobApplicationsService, UserJobApplicationCreate } from "@/client"
import { Button } from "@/components/ui/button"
import useCustomToast from "@/hooks/useCustomToast"

interface AddToMyApplicationsButtonProps {
    data: {
        company: string
        position?: string
        apply_url?: string
        industry?: string
        location?: string
        tags?: string
    }
}

export function AddToMyApplicationsButton({ data }: AddToMyApplicationsButtonProps) {
    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()

    const mutation = useMutation({
        mutationFn: (newApp: UserJobApplicationCreate) =>
            MyJobApplicationsService.createMyJobApplication({ requestBody: newApp }),
        onSuccess: () => {
            showSuccessToast("已成功添加到我的进展")
            queryClient.invalidateQueries({ queryKey: ["my-job-applications"] })
        },
        onError: () => showErrorToast("添加失败，请重试")
    })

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        mutation.mutate({
            company: data.company,
            position: data.position || "",
            apply_url: data.apply_url || "",
            industry: data.industry || "",
            location: data.location || "",
            tags: data.tags || "",
            status: "未投递",
            priority: "中"
        })
    }

    return (
        <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-primary border-primary/20 hover:bg-primary/5 shadow-none whitespace-nowrap"
            onClick={handleAdd}
            disabled={mutation.isPending}
        >
            <Plus className="size-3.5" />
            加入我的网申
        </Button>
    )
}
