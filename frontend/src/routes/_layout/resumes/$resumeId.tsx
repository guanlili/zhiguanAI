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

export const Route = createFileRoute("/_layout/resumes/$resumeId")({
    component: ResumeEditPage,
})

const SUGGESTED_ROLES = [
    "软件开发", "产品经理", "数据分析师", "运营专员", "UI设计师", "销售代表", "会计", "HR"
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
                    <div className="relative group">
                        <Input
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); setIsDirty(true) }}
                            onBlur={handleTitleBlur}
                            className="h-8 w-[200px] border-transparent bg-transparent hover:border-input focus:border-input focus:bg-background font-semibold text-lg px-2 -ml-2 truncate transition-all"
                        />
                        <Pencil className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none" />
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
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate()}
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        删除
                    </Button>
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
                                {SUGGESTED_ROLES.map(role => (
                                    <Badge
                                        key={role}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors py-1 px-2.5 font-normal text-xs bg-background/50"
                                        onClick={() => {
                                            setTargetPosition(role)
                                            setIsDirty(true)
                                            // Optional: update JD with some template if needed, but here we just set position
                                        }}
                                    >
                                        {role}
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
