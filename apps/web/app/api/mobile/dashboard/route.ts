import { getDashboardStats, getRecentActivity } from "@/lib/queries/dashboard"
import {
  requireMobileUser,
  toMobileActivity,
} from "@/app/api/mobile/_utils"

export async function GET(request: Request) {
  const user = await requireMobileUser(request)
  if (user instanceof Response) return user

  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(user.id),
    getRecentActivity(user.id),
  ])

  return Response.json({
    stats,
    recentActivity: recentActivity.map(toMobileActivity),
  })
}
