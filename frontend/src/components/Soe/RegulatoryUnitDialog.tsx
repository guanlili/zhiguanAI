
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SoeService, RegulatoryUnitPublic, ApiError } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { useEffect } from "react"
import { handleError } from "@/utils"

const schema = z.object({
    name: z.string().min(1, "单位名称不能为空"),
    description: z.string().optional(),
    level: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface RegulatoryUnitDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    unit?: RegulatoryUnitPublic
}

export function RegulatoryUnitDialog({ open, onOpenChange, unit }: RegulatoryUnitDialogProps) {
    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()
    const isEditing = !!unit

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            description: "",
            level: "",
        },
    })

    useEffect(() => {
        if (open) {
            if (unit) {
                form.reset({
                    name: unit.name,
                    description: unit.description || "",
                    level: unit.level || "",
                })
            } else {
                form.reset({
                    name: "",
                    description: "",
                    level: "",
                })
            }
        }
    }, [open, unit, form])

    const mutation = useMutation({
        mutationFn: (values: FormValues) => {
            const data = {
                ...values,
                description: values.description || null,
                level: values.level || null,
            }
            if (isEditing) {
                return SoeService.updateRegulatoryUnit({
                    id: unit.id,
                    requestBody: data,
                })
            }
            return SoeService.createRegulatoryUnit({ requestBody: data })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["regulatory-units"] })
            showSuccessToast(isEditing ? "监管单位已更新" : "监管单位已创建")
            onOpenChange(false)
        },
        onError: (err) => {
            const handler = handleError.bind(showErrorToast)
            handler(err as ApiError)
        },
    })

    const onSubmit = (values: FormValues) => {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "编辑监管单位" : "新增监管单位"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>单位名称</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入单位名称" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>级别</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例如：部级、副部级" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>描述</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="描述..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                取消
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "保存中..." : "保存"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
