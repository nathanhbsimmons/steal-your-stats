import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { showOfTheDayService } from '@/lib/services/show-of-the-day'
import { HomeClient } from '@/components/home/home-client'

export const revalidate = 300

export default async function HomePage() {
  const [kpi, statsData, dayPayload] = await Promise.all([
    realtimeSongFactsService.getSummaryStats().catch(() => null),
    realtimeSongFactsService.getGlobalStats().catch(() => null),
    showOfTheDayService.get().catch(() => null),
  ])

  return <HomeClient initialKpi={kpi} initialStats={statsData} initialDayPayload={dayPayload} />
}
