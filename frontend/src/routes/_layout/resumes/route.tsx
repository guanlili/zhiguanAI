import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ResumesService } from "@/client"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, FileText, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

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
            navigate({ to: `/resumes/${data.id}` })
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
                                        to={`/resumes/${resume.id}`}
                                        className={cn(
                                            "block px-3 py-2.5 rounded-md text-sm transition-colors relative group",
                                            isActive
                                                ? "bg-accent text-accent-foreground font-medium"
                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                            <span className="truncate flex-1">{resume.title || "Untitled"}</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground/60 pl-6 mt-0.5 truncate">
                                            {formatDistanceToNow(new Date(resume.updated_at), { addSuffix: true })}
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
