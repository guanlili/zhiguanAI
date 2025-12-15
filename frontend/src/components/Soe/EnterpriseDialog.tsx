
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SoeService, SoeEnterprisePublic, ApiError } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { useEffect } from "react"
import { handleError } from "@/utils"

const schema = z.object({
    name: z.string().min(1, "企业名称不能为空"),
    website: z.string().url("请输入有效的URL").optional().or(z.literal("")),
    description: z.string().optional(),
    deepseek_comment: z.string().optional(),
    category: z.string().optional(),
    regulatory_unit_id: z.string().min(1, "请选择监管单位"),
})

type FormValues = z.infer<typeof schema>

interface EnterpriseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    enterprise?: SoeEnterprisePublic
}

export function EnterpriseDialog({ open, onOpenChange, enterprise }: EnterpriseDialogProps) {
    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()
    const isEditing = !!enterprise

    // Fetch regulatory units for the select
    const { data: regulatoryUnits } = useQuery({
        queryKey: ["regulatory-units"],
        queryFn: () => SoeService.readRegulatoryUnits({ limit: 1000 }),
    })

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            website: "",
            description: "",
            deepseek_comment: "",
            category: "",
            regulatory_unit_id: "",
        },
    })

    useEffect(() => {
        if (open) {
            if (enterprise) {
                form.reset({
                    name: enterprise.name,
                    website: enterprise.website || "",
                    description: enterprise.description || "",
                    deepseek_comment: enterprise.deepseek_comment || "",
                    category: enterprise.category || "",
                    regulatory_unit_id: enterprise.regulatory_unit_id,
                })
            } else {
                form.reset({
                    name: "",
                    website: "",
                    description: "",
                    deepseek_comment: "",
                    category: "",
                    regulatory_unit_id: "",
                })
            }
        }
    }, [open, enterprise, form])

    const mutation = useMutation({
        mutationFn: (values: FormValues) => {
            const data = {
                ...values,
                website: values.website || null,
                description: values.description || null,
                deepseek_comment: values.deepseek_comment || null,
                category: values.category || null,
            }
            if (isEditing) {
                return SoeService.updateEnterprise({
                    id: enterprise.id,
                    requestBody: data,
                })
            }
            return SoeService.createEnterprise({ requestBody: data })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["enterprises"] })
            showSuccessToast(isEditing ? "企业已更新" : "企业已创建")
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
                    <DialogTitle>{isEditing ? "编辑企业" : "新增企业"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>企业名称</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入企业名称" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="regulatory_unit_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>监管单位</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择监管单位" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {regulatoryUnits?.data.map((unit) => (
                                                <SelectItem key={unit.id} value={unit.id}>
                                                    {unit.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>行业分类</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例如：能源、通讯" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>官网链接</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
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
                                    <FormLabel>简介</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="企业简介..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="deepseek_comment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deepseek锐评</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Deepseek锐评..." className="min-h-[100px]" {...field} />
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
