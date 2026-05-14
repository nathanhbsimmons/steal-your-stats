import { SearchResult } from "@/components/ui/search-results"

export const sampleSearchResults: SearchResult[] = [
  {
    id: "1",
    title: "Morning Light",
    subtitle: "Track • 4:32",
    description: "A gentle acoustic piece with warm harmonies"
  },
  {
    id: "2", 
    title: "Electric Dreams",
    subtitle: "Track • 6:18",
    description: "Upbeat electronic composition with driving rhythm"
  },
  {
    id: "3",
    title: "City Streets",
    subtitle: "Track • 3:45",
    description: "Urban-inspired melody with jazz influences"
  },
  {
    id: "4",
    title: "Ocean Waves",
    subtitle: "Track • 5:12",
    description: "Ambient soundscape with natural field recordings"
  },
  {
    id: "5",
    title: "Mountain Peak",
    subtitle: "Track • 7:23",
    description: "Epic instrumental journey with orchestral elements"
  },
  {
    id: "6",
    title: "Desert Wind",
    subtitle: "Track • 4:56",
    description: "Atmospheric piece with traditional instruments"
  },
  {
    id: "7",
    title: "Forest Path",
    subtitle: "Track • 3:28",
    description: "Peaceful acoustic guitar with nature sounds"
  },
  {
    id: "8",
    title: "Night Sky",
    subtitle: "Track • 8:45",
    description: "Extended ambient exploration with synthesizers"
  },
  {
    id: "9",
    title: "River Flow",
    subtitle: "Track • 4:01",
    description: "Flowing melody with water-inspired rhythms"
  },
  {
    id: "10",
    title: "Sunset View",
    subtitle: "Track • 5:34",
    description: "Melancholic piece with string arrangements"
  }
]

// Mock search function that simulates API delay
export async function mockSearch(query: string): Promise<SearchResult[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  if (!query.trim()) {
    return []
  }
  
  const normalizedQuery = query.toLowerCase().trim()
  
  return sampleSearchResults.filter(result => 
    result.title.toLowerCase().includes(normalizedQuery) ||
    (result.description && result.description.toLowerCase().includes(normalizedQuery)) ||
    result.subtitle?.toLowerCase().includes(normalizedQuery)
  )
}
