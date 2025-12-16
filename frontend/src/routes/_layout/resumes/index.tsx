import { createFileRoute } from "@tanstack/react-router"
import { FileText } from "lucide-react"

export const Route = createFileRoute("/_layout/resumes/")({
    component: ResumesIndex,
})

function ResumesIndex() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
            <div className="bg-muted/30 p-8 rounded-full mb-6">
                <FileText className="h-16 w-16 opacity-50" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground">Select a Resume</h2>
            <p className="max-w-md mx-auto">Click on a resume from the sidebar to view detailed optimization and editing options, or create a new one to get started.</p>
        </div>
    )
}
