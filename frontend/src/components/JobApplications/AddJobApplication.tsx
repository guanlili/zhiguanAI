import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type JobApplicationCreate, JobApplicationsService } from "@/client"
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
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const formSchema = z.object({
    company_name: z.string().min(1, { message: "公司名称不能为空" }),
    announcement_url: z.string().url({ message: "请输入有效的URL" }).optional().or(z.literal("")),
    apply_url: z.string().url({ message: "请输入有效的URL" }).optional().or(z.literal("")),
    industry: z.string().optional(),
    tags: z.string().optional(),
    batch: z.string().optional(),
    position: z.string().optional(),
    location: z.string().optional(),
    deadline: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const AddJobApplication = () => {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const { showSuccessToast, showErrorToast } = useCustomToast()

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            company_name: "",
            announcement_url: "",
            apply_url: "",
            industry: "",
            tags: "",
            batch: "",
            position: "",
            location: "",
            deadline: "",
        },
    })

    const mutation = useMutation({
        mutationFn: (data: JobApplicationCreate) =>
            JobApplicationsService.createJobApplication({ requestBody: data }),
        onSuccess: () => {
            showSuccessToast("网申信息添加成功")
            form.reset()
            setIsOpen(false)
        },
        onError: handleError.bind(showErrorToast),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["job-applications"] })
        },
    })

    const onSubmit = (data: FormData) => {
        const submitData: JobApplicationCreate = {
            company_name: data.company_name,
            announcement_url: data.announcement_url || null,
            apply_url: data.apply_url || null,
            industry: data.industry || null,
            tags: data.tags || null,
            batch: data.batch || null,
            position: data.position || null,
            location: data.location || null,
            deadline: data.deadline || null,
        }
        mutation.mutate(submitData)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="my-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    <Plus className="mr-2" />
                    添加网申
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>添加网申信息</DialogTitle>
                    <DialogDescription>
                        填写网申信息，带 * 的为必填项
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="company_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                公司名称 <span className="text-destructive">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="例如：阿里巴巴" {...field} required />
                                            </FormControl>
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
                                            <FormControl>
                                                <Input placeholder="例如：后端开发工程师" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="announcement_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>公告链接</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://..." type="url" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="apply_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>投递链接</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://..." type="url" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="industry"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>行业</FormLabel>
                                            <FormControl>
                                                <Input placeholder="例如：互联网/电子商务" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="batch"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>批次</FormLabel>
                                            <FormControl>
                                                <Input placeholder="例如：2025届秋招" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>工作地点</FormLabel>
                                            <FormControl>
                                                <Input placeholder="例如：北京/上海/深圳" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="deadline"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>投递截止时间</FormLabel>
                                            <FormControl>
                                                <Input type="datetime-local" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="tags"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>标签</FormLabel>
                                        <FormControl>
                                            <Input placeholder="多个标签用逗号分隔，例如：大厂,技术,AI" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" disabled={mutation.isPending}>
                                    取消
                                </Button>
                            </DialogClose>
                            <LoadingButton type="submit" loading={mutation.isPending}>
                                保存
                            </LoadingButton>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default AddJobApplication
