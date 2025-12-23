import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ResumesService } from "@/client"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, FileText, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export const Route = createFileRoute("/_layout/resumes")({
    component: ResumesLayout,
})

function ResumesLayout() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const location = useLocation()

    const { data: resumes, isLoading } = useQuery({
        queryKey: ["resumes"],
        queryFn: () => ResumesService.readResumes({}),
    })

    const createMutation = useMutation({
        mutationFn: async () => {
            // Create a default resume
            return await ResumesService.createResume({
                requestBody: {
                    title: "New Resume",
                    content: ""
                }
            })
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["resumes"] })
            toast.success("Resume created")
            navigate({ to: "/resumes/$resumeId", params: { resumeId: data.id } })
        },
        onError: () => {
            toast.error("Failed to create resume")
        }
    })

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background w-full">
            {/* Left Sidebar - Resume List */}
            <div className="w-[250px] border-r bg-background flex flex-col shrink-0">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b shrink-0 h-[57px]">
                    <h3 className="font-semibold text-sm">Resumes</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => createMutation.mutate()}
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
                    {isLoading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5 text-muted-foreground" /></div>
                    ) : (
                        <div className="space-y-1">
                            {resumes?.data.map((resume) => {
                                const isActive = location.pathname.includes(resume.id)
                                return (
                                    <Link
                                        key={resume.id}
                                        to="/resumes/$resumeId"
                                        params={{ resumeId: resume.id }}
                                        className={cn(
                                            "block px-3 py-2.5 rounded-md text-sm transition-colors relative group",
                                            isActive
                                                ? "bg-accent text-accent-foreground font-medium"
                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                            <span className="truncate flex-1 font-medium">{resume.title || "Untitled"}</span>
                                        </div>

                                        {resume.target_role && (
                                            <div className="flex items-center gap-1.5 pl-6 mt-1 text-[11px] text-primary/80 font-medium">
                                                <Briefcase className="h-3 w-3" />
                                                <span className="truncate">{resume.target_role}</span>
                                            </div>
                                        )}

                                        <div className="text-[10px] text-muted-foreground/60 pl-6 mt-1 truncate">
                                            {new Intl.DateTimeFormat("zh-CN", {
                                                timeZone: "Asia/Shanghai",
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: false
                                            }).format(new Date(resume.updated_at.endsWith("Z") ? resume.updated_at : `${resume.updated_at}Z`)).replace(/\//g, "-")}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>


            {/* Main Content Area */}
            <div className="flex-1 min-w-0 bg-background flex flex-col">
                <Outlet />
            </div>
        </div>
    )
}
