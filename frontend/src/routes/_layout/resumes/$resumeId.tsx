import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ResumesService } from "@/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Loader2,
    Trash2,
    Download,
    Undo,
    Redo,
    CloudUpload,
    Wand2,
    FileText,
    Pencil,
    Columns,
    Maximize,
    Eye,
    Code
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const Route = createFileRoute("/_layout/resumes/$resumeId")({
    component: ResumeEditPage,
})

const SUGGESTED_ROLES = [
    {
        title: "软件开发",
        jd: "1. 负责软件系统或模块的设计、编码及测试工作；\n2. 参与需求分析，编写相关技术文档；\n3. 负责代码优化和系统性能调优，解决技术难题；\n4. 协助团队完成项目的迭代开发与维护。"
    },
    {
        title: "产品经理",
        jd: "1. 负责产品的全生命周期管理，包括需求调研、原型设计及 PRD 编写；\n2. 协调研发、设计、市场等部门，确保产品按时保质上线；\n3. 持续跟踪产品数据和用户反馈，分析竞品，制定产品迭代计划；\n4. 负责用户体验优化，提升产品核心指标。"
    },
    {
        title: "数据分析师",
        jd: "1. 负责业务数据的收集、清洗、建模和分析工作；\n2. 深入挖掘数据背后的业务逻辑，产出高质量的分析报告；\n3. 建立并优化指标体系，监控核心业务数据的变化；\n4. 为业务决策提供量化的参考依据，驱动业务增长。"
    },
    {
        title: "运营专员",
        jd: "1. 负责平台的日常内容运营、活动策划及执行，提高用户活跃度；\n2. 监控核心运营数据，分析用户行为，持续优化运营策略；\n3. 管理用户社群，处理用户反馈，维护良好的用户关系；\n4. 配合市场推广，提升品牌知名度及用户转化率。"
    },
    {
        title: "UI设计师",
        jd: "1. 负责移动端及 Web 端产品的界面视觉设计与设计规范制定；\n2. 参与产品前期规划，配合产品及交互完成原型落地；\n3. 跟踪最新设计趋势，对产品进行视觉重构或体验升级；\n4. 负责设计稿的切图与标注，跟进研发还原度，保证产品质量。"
    },
    {
        title: "销售代表",
        jd: "1. 负责新客户的开拓与老客户的维护，建立良好的长期合作关系；\n2. 根据公司的销售目标，制定销售计划并达成业绩指标；\n3. 深入了解客户需求，提供专业的方案建议与产品介绍；\n4. 收集市场信息及竞品动态，及时向团队反馈并优化销售话术。"
    },
    {
        title: "会计",
        jd: "1. 负责公司的日常账务处理，包括收支核算、报销审核及记账；\n2. 编制财务报表，确保数据的真实性和准确性，按时完成税务申报；\n3. 协助进行成本核算与分析，参与公司的预算制定与执行监控；\n4. 负责财务档案的管理，确保公司财会工作的合规性。"
    },
    {
        title: "HR",
        jd: "1. 负责招聘全流程管理，包括职位发布、简历筛选、面试约见及入职跟进；\n2. 维护员工关系，办理入职、转正、调动、离职等相关手续；\n3. 参与企业文化建设、绩效管理及薪酬福利体系的优化工作；\n4. 协助进行组织架构设计及各项行政管理事务。"
    }
]

function ResumeEditPage() {
    const { resumeId } = Route.useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const originalRef = useRef<HTMLTextAreaElement>(null)
    const optimizedRef = useRef<HTMLTextAreaElement>(null)
    const isScrolling = useRef<"original" | "optimized" | null>(null)
    const scrollTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    // State
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("") // Original Content
    const [optimizedContent, setOptimizedContent] = useState("") // Optimized Content
    const [isDirty, setIsDirty] = useState(false)
    const [activeTab, setActiveTab] = useState("original") // original, optimized
    const [isSplitView, setIsSplitView] = useState(false)
    const [isOptimizing, setIsOptimizing] = useState(false)
    const [jd, setJd] = useState("") // Job Description
    const [targetPosition, setTargetPosition] = useState("") // Target Role Name
    const [originalViewMode, setOriginalViewMode] = useState<"edit" | "preview">("edit"); // default edit (Code)
    const [optimizedViewMode, setOptimizedViewMode] = useState<"edit" | "preview">("preview"); // default preview (Eye)

    // Data Load
    const { data: resume, isLoading } = useQuery({
        queryKey: ["resumes", resumeId],
        queryFn: () => ResumesService.readResume({ id: resumeId }),
    })

    useEffect(() => {
        if (resume) {
            setTitle(resume.title);
            setContent(resume.content || "");
            setOptimizedContent(resume.optimized_content || "");
            setTargetPosition(resume.target_role || "");
            setJd(resume.target_jd || "");
            // Do NOT force view mode here; keep current mode (edit/preview) after save
            setIsDirty(false);
        }
    }, [resume]);



    // Mutations
    const updateMutation = useMutation({
        mutationFn: async (data: { title?: string, content?: string, optimized_content?: string, target_role?: string, target_jd?: string }) => {
            return ResumesService.updateResume({
                id: resumeId,
                requestBody: {
                    title: data.title ?? title,
                    content: data.content ?? content,
                    optimized_content: data.optimized_content ?? optimizedContent,
                    target_role: data.target_role ?? targetPosition,
                    target_jd: data.target_jd ?? jd
                }
            })
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["resumes"] })
            queryClient.setQueryData(["resumes", resumeId], data)
            toast.success("Saved successfully")
            // 保存后保持原始面板为编辑模式（Code），与上传后保持一致
            setOriginalViewMode("edit")
            setIsDirty(false)
        },
        onError: () => toast.error("Failed to save")
    })

    const deleteMutation = useMutation({
        mutationFn: () => ResumesService.deleteResume({ id: resumeId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resumes"] })
            toast.success("Deleted successfully")
            navigate({ to: "/resumes" })
        }
    })

    const parseMutation = useMutation({
        mutationFn: async (file: File) => {
            return await ResumesService.parseResumeFile({ formData: { file } })
        },
        onSuccess: (data) => {
            // Parsing always updates Original Content
            setContent(data.message)
            // After import, show edit mode (Code)
            setOriginalViewMode("edit")
            setActiveTab("original")
            setIsDirty(true)
            toast.success("Resume parsed successfully")
        },
        onError: () => toast.error("Failed to parse file")
    })

    // Handlers
    const handleScroll = (source: "original" | "optimized") => {
        if (!isSplitView) return

        const sourceRef = source === "original" ? originalRef : optimizedRef
        const targetRef = source === "original" ? optimizedRef : originalRef

        if (isScrolling.current && isScrolling.current !== source) return

        isScrolling.current = source
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current)

        if (sourceRef.current && targetRef.current) {
            const src = sourceRef.current
            const tgt = targetRef.current

            // Calculate percentage
            // Avoiding division by zero
            const maxScrollSource = src.scrollHeight - src.clientHeight
            const maxScrollTarget = tgt.scrollHeight - tgt.clientHeight

            if (maxScrollSource > 0 && maxScrollTarget > 0) {
                const percentage = src.scrollTop / maxScrollSource
                tgt.scrollTop = percentage * maxScrollTarget
            }
        }

        scrollTimeout.current = setTimeout(() => {
            isScrolling.current = null
        }, 50)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) parseMutation.mutate(file)
    }

    const handleSave = () => updateMutation.mutate({ title, content, optimized_content: optimizedContent, target_role: targetPosition, target_jd: jd })

    const handleTitleBlur = () => {
        if (title !== resume?.title) {
            updateMutation.mutate({ title })
        }
    }

    const handleOptimize = async () => {
        if (!content) {
            toast.error("Please upload or paste a resume first")
            return
        }

        setIsOptimizing(true)
        setActiveTab("optimized")
        setOptimizedContent("") // Clear optimized content for streaming

        try {
            const token = localStorage.getItem("access_token")
            const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/v1/resumes/optimize`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: content, // Input is always "Original" content
                    jd: jd
                })
            })

            if (!response.ok) throw new Error("Optimization failed")
            if (!response.body) throw new Error("No response body")

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let accumulatedContent = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                accumulatedContent += chunk
                setOptimizedContent(prev => prev + chunk)
            }

            // Auto-save the optimized result
            updateMutation.mutate({
                title,
                content,
                optimized_content: accumulatedContent,
                target_jd: jd
            })
            // After optimization, show preview mode
            setOptimizedViewMode("preview");
            toast.success("Optimization complete")

        } catch (error) {
            console.error(error)
            toast.error("Failed to optimize resume")
        } finally {
            setIsOptimizing(false)
        }
    }

    if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>

    return (
        <div className="flex flex-col h-full bg-background/50">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-6">
                    {/* Title Rename */}
                    <div className="relative group flex items-center gap-2">
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-0.5">简历名称</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={title}
                                    onChange={(e) => { setTitle(e.target.value); setIsDirty(true) }}
                                    onBlur={handleTitleBlur}
                                    className="h-9 w-[240px] border-muted/20 bg-muted/5 hover:border-primary/30 focus:border-primary/50 focus:bg-background font-bold text-lg px-2 -ml-1 truncate transition-all shadow-none"
                                    placeholder="输入简历名称..."
                                />
                                <Pencil className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center bg-muted/50 p-1 rounded-lg">
                        {[
                            { id: "original", label: "原始简历", hasContent: !!content.trim() },
                            { id: "optimized", label: "优化后的简历", hasContent: !!optimizedContent.trim() }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 relative",
                                    activeTab === tab.id
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {tab.label}
                                <div
                                    className={cn(
                                        "h-1.5 w-1.5 rounded-full transition-all shrink-0",
                                        tab.hasContent
                                            ? (activeTab === tab.id ? "bg-primary-foreground ring-2 ring-primary-foreground/20" : "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]")
                                            : "bg-muted-foreground/30"
                                    )}
                                    title={tab.hasContent ? "已填充内容" : "内容为空"}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => { }}>
                        <Download className="mr-2 h-3.5 w-3.5" />
                        下载
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                删除
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>确定要删除这份简历吗？</AlertDialogTitle>
                                <AlertDialogDescription>
                                    此操作无法撤销。该简历的所有原始内容和 AI 优化版本都将被永久删除。
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => deleteMutation.mutate()}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    确定删除
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex min-h-0">

                {/* Left Panel: Inputs & Parse */}
                <div className="w-[30%] flex flex-col border-r bg-muted/10">

                    <div className="p-6 flex-1 flex flex-col min-h-0">
                        {/* Upload Area - Compact */}
                        <div
                            className="shrink-0 border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-background/80 hover:border-primary/50 transition-all cursor-pointer group mb-6 bg-background/40"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    {parseMutation.isPending ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <CloudUpload className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-medium text-foreground">上传简历文件</h3>
                                    <p className="text-xs text-muted-foreground">支持 PDF, Docx, Markdown</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.docx,.doc,.md,.txt,.markdown"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {/* Target Position Input */}
                        <div className="mb-4 shrink-0">
                            <label className="text-sm font-medium flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary" />
                                目标岗位名称
                            </label>
                            <Input
                                placeholder="例如：前端开发工程师"
                                value={targetPosition}
                                onChange={(e) => { setTargetPosition(e.target.value); setIsDirty(true) }}
                                onBlur={() => { if (targetPosition !== resume?.target_role) updateMutation.mutate({ target_role: targetPosition }) }}
                                className="bg-background/50 focus:bg-background transition-colors"
                            />
                        </div>

                        {/* Divider */}
                        <div className="relative mb-6 shrink-0">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-muted/10 px-2 text-muted-foreground">JD 内容</span></div>
                        </div>

                        {/* Target JD Input */}
                        <div className="flex-1 flex flex-col min-h-0 gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Wand2 className="h-4 w-4 text-primary" />
                                    JD 详细描述
                                </label>
                                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setJd("")}>
                                    清空
                                </Button>
                            </div>

                            <div className="relative flex-1">
                                <Textarea
                                    placeholder="请粘贴目标岗位的职位描述 (JD)，职观AI将根据JD为您优化简历..."
                                    className="absolute inset-0 w-full h-full resize-none p-4 shadow-sm bg-background/50 focus:bg-background transition-colors text-sm leading-relaxed"
                                    value={jd}
                                    onChange={(e) => { setJd(e.target.value); setIsDirty(true) }}
                                    onBlur={() => { if (jd !== resume?.target_jd) updateMutation.mutate({ target_jd: jd }) }}
                                />
                                <Button
                                    className="absolute bottom-4 right-4 shadow-lg"
                                    size="sm"
                                    onClick={handleOptimize}
                                    disabled={!jd.trim() || isOptimizing}
                                >
                                    {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                    AI 针对性优化
                                </Button>
                            </div>
                        </div>

                        {/* Chips - Footer of Left Panel */}
                        <div className="mt-4 shrink-0">
                            <p className="text-xs text-muted-foreground mb-2">热门岗位快速填充：</p>
                            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto content-start scrollbar-none">
                                {SUGGESTED_ROLES.map(item => (
                                    <Badge
                                        key={item.title}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors py-1 px-2.5 font-normal text-xs bg-background/50"
                                        onClick={() => {
                                            setTargetPosition(item.title)
                                            setJd(item.jd)
                                            setIsDirty(true)
                                            updateMutation.mutate({ target_role: item.title, target_jd: item.jd })
                                        }}
                                    >
                                        {item.title}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Editor */}
                <div className="w-[70%] flex flex-col bg-background">
                    {/* Editor Toolbar */}
                    <div className="flex items-center justify-between px-6 py-2 border-b shrink-0 h-10">
                        <div className="font-medium text-xs flex items-center text-muted-foreground uppercase tracking-wider">
                            Markdown Editor
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Toggle Split View */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7 mr-2", isSplitView && "bg-muted text-primary")}
                                onClick={() => setIsSplitView(!isSplitView)}
                                title={isSplitView ? "Single View" : "Split Comparison View"}
                            >
                                {isSplitView ? <Maximize className="h-3.5 w-3.5" /> : <Columns className="h-3.5 w-3.5" />}
                            </Button>

                            {isDirty && <span className="text-[10px] text-amber-500 mr-2 animate-pulse">Unsaved changes</span>}
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Undo className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Redo className="h-3.5 w-3.5" /></Button>
                            <Button onClick={handleSave} disabled={!isDirty || updateMutation.isPending} size="sm" className="ml-2 h-7 px-3 text-xs">
                                Save
                            </Button>
                        </div>
                    </div>

                    {/* Editor Area - Split View Aware */}
                    <div className="flex-1 relative flex">
                        {/* Original Content Panel */}
                        {(!isSplitView ? activeTab === "original" : true) && (
                            <div className={cn("relative flex-col h-full", isSplitView ? "w-1/2 border-r" : "w-full")}>
                                {isSplitView && <div className="absolute top-2 left-2 z-10 bg-muted/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-muted-foreground font-medium pointer-events-none">Original</div>}
                                {/* Header with toggle */}
                                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
                                    <span className="text-xs font-medium text-muted-foreground">Original</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setOriginalViewMode(prev => prev === "edit" ? "preview" : "edit")}
                                    >
                                        {originalViewMode === "edit" ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {originalViewMode === "edit" ? (
                                    <Textarea
                                        ref={originalRef}
                                        onScroll={() => handleScroll("original")}
                                        value={content}
                                        onChange={(e) => { setContent(e.target.value); setIsDirty(true) }}
                                        placeholder="# Original Resume Content..."
                                        className="w-full h-full resize-none border-0 p-8 font-mono text-sm leading-relaxed bg-transparent focus-visible:ring-0"
                                    />
                                ) : (
                                    <div className="p-4 overflow-auto h-full">
                                        <div className="prose prose-sm max-w-none p-4 overflow-auto h-full">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {content || "*暂无内容*"}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Optimized Content Panel */}
                        {(!isSplitView ? activeTab === "optimized" : true) && (
                            <div className={cn("relative flex-col h-full", isSplitView ? "w-1/2" : "w-full")}>
                                {isSplitView && <div className="absolute top-2 left-2 z-10 bg-primary/10 backdrop-blur px-2 py-0.5 rounded text-[10px] text-primary font-medium pointer-events-none">Optimized</div>}
                                {/* Header with toggle */}
                                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
                                    <span className="text-xs font-medium text-muted-foreground">Optimized</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setOptimizedViewMode(prev => prev === "edit" ? "preview" : "edit")}
                                    >
                                        {optimizedViewMode === "edit" ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {optimizedViewMode === "edit" ? (
                                    <Textarea
                                        ref={optimizedRef}
                                        onScroll={() => handleScroll("optimized")}
                                        value={optimizedContent}
                                        onChange={(e) => { setOptimizedContent(e.target.value); setIsDirty(true) }}
                                        placeholder="# AI Optimized Content will appear here..."
                                        className="w-full h-full resize-none border-0 p-8 font-mono text-sm leading-relaxed bg-transparent focus-visible:ring-0"
                                    />
                                ) : (
                                    <div className="p-4 overflow-auto h-full">
                                        <div className="prose prose-sm max-w-none p-4 overflow-auto h-full">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {optimizedContent || "*暂无内容*"}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
