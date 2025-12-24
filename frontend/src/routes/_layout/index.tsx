import { createFileRoute } from "@tanstack/react-router"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Dashboard - 职观 AI",
      },
    ],
  }),
})

function Dashboard() {
  const { user: currentUser } = useAuth()

  return (
    <div className="space-y-10">
      {/* 欢迎区 */}
      <div className="rounded-xl border bg-gradient-to-br from-background to-muted/40 p-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Hi，{currentUser?.full_name || currentUser?.email} 👋
        </h1>

        <p className="mt-4 text-muted-foreground leading-relaxed max-w-3xl">
          <span className="font-medium text-foreground">
            职观 AI
          </span>{" "}
          致力于打破求职信息差。
          通过 <strong>AI 定制简历优化</strong>、<strong>岗位智能搜索</strong> 与
          <strong> 国央企信息整合</strong>，
          帮你判断：以你的专业和学历，能报哪些岗位，
          以及那些不常被提及的企业，是否值得去。
        </p>

        <p className="mt-3 text-sm text-muted-foreground">
          从左侧开始，先优化一份简历，或查一查你能报的岗位 →
        </p>
      </div>

      {/* 功能引导卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI 简历 */}
        <div className="rounded-xl border p-6 hover:shadow-md transition">
          <div className="text-xl mb-2">✨</div>
          <h3 className="font-semibold mb-1">AI 定制简历优化</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            根据目标岗位要求，智能优化简历内容，
            提升匹配度，减少无效投递。
          </p>
        </div>

        {/* 岗位搜索 */}
        <div className="rounded-xl border p-6 hover:shadow-md transition">
          <div className="text-xl mb-2">🔍</div>
          <h3 className="font-semibold mb-1">AI岗位智能搜索</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            基于你的专业和学历条件，
            快速筛选真正「你能报」的岗位。
          </p>
        </div>

        {/* 企业判断 */}
        <div className="rounded-xl border p-6 hover:shadow-md transition">
          <div className="text-xl mb-2">🏢</div>
          <h3 className="font-semibold mb-1">企业价值判断</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            看清冷门国央企与事业单位的背景与特征，
            判断是否值得投入时间与选择成本。
          </p>
        </div>
      </div>
    </div>
  )
}
