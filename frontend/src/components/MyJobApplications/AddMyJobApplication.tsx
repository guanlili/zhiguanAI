import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type UserJobApplicationCreate, MyJobApplicationsService } from "@/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const formSchema = z.object({
    company: z.string().min(1, { message: "公司名称不能为空" }),
    apply_url: z.string().url({ message: "请输入有效的URL" }).optional().or(z.literal("")),
    priority: z.string().optional(),
    industry: z.string().optional(),
    tags: z.string().optional(),
    position: z.string().optional(),
    location: z.string().optional(),
    progress: z.string().optional(),
    status: z.string().optional(),
    status_updated_at: z.string().optional(),
    remarks: z.string().optional(),
    applied_at: z.string().optional(),
    referral_code: z.string().optional(),
    apply_url2: z.string().url({ message: "请输入有效的URL" }).optional().or(z.literal("")),
    apply_url3: z.string().url({ message: "请输入有效的URL" }).optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

const AddMyJobApplication = () => {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: "onBlur",
        defaultValues: {
            company: "",
            apply_url: "",
            priority: "中",
            industry: "",
            tags: "",
            position: "",
            location: "",
            progress: "",
            status: "未投递",
            status_updated_at: "",
            remarks: "",
            applied_at: "",
            referral_code: "",
            apply_url2: "",
            apply_url3: "",
        },
    })

    const mutation = useMutation({
        mutationFn: (data: UserJobApplicationCreate) =>
            MyJobApplicationsService.createMyJobApplication({ requestBody: data }),
        onSuccess: () => {
            showSuccessToast("进展记录添加成功")
            form.reset()
            setIsOpen(false)
        },
        onError: handleError.bind(showErrorToast),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["my-job-applications"] })
        },
    })

    const onSubmit = (data: FormData) => {
        const submitData: UserJobApplicationCreate = {
            ...data,
            applied_at: data.applied_at ? new Date(data.applied_at).toISOString() : null,
            status_updated_at: data.status_updated_at ? new Date(data.status_updated_at).toISOString() : null,
        }
        mutation.mutate(submitData)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-md">
                    <Plus className="mr-2 h-4 w-4" />
                    手动新增进展记录
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>手动新增进展</DialogTitle>
                    <DialogDescription>
                        您可以手动管理任何来源的投递记录
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>公司名称 *</FormLabel>
                                        <FormControl><Input placeholder="例如：阿里巴巴" {...field} required /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="position"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>职位</FormLabel>
                                        <FormControl><Input placeholder="例如：后端开发工程师" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>进展状态</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择状态" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="未投递">未投递</SelectItem>
                                                <SelectItem value="已投递">已投递</SelectItem>
                                                <SelectItem value="笔试">笔试</SelectItem>
                                                <SelectItem value="面试">面试</SelectItem>
                                                <SelectItem value="Offer">Offer</SelectItem>
                                                <SelectItem value="感谢信">感谢信</SelectItem>
                                                <SelectItem value="已结束">已结束</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>重视度</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择重视度" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="高">高</SelectItem>
                                                <SelectItem value="中">中</SelectItem>
                                                <SelectItem value="低">低</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="progress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>当前详细进展</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例如：投递成功 / 等待通知" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="applied_at"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>投递时间</FormLabel>
                                        <FormControl><Input type="datetime-local" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status_updated_at"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>进展更新时间</FormLabel>
                                        <FormControl><Input type="datetime-local" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="industry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>行业</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>地点</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="referral_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>内推码</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <FormLabel>相关链接</FormLabel>
                            <div className="grid grid-cols-1 gap-2">
                                <FormField
                                    control={form.control}
                                    name="apply_url"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <span className="text-xs text-muted-foreground w-12 shrink-0">链接1</span>
                                            <FormControl><Input placeholder="主要投递链接" className="h-8" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="apply_url2"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <span className="text-xs text-muted-foreground w-12 shrink-0">链接2</span>
                                            <FormControl><Input className="h-8" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="apply_url3"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <span className="text-xs text-muted-foreground w-12 shrink-0">链接3</span>
                                            <FormControl><Input className="h-8" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>备注</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="输入其它备注信息..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button variant="outline" disabled={mutation.isPending}>
                                    取消
                                </Button>
                            </DialogClose>
                            <LoadingButton type="submit" loading={mutation.isPending}>
                                确认新增
                            </LoadingButton>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default AddMyJobApplication
