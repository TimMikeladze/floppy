export interface Release {
  id: string
  title: string
  series: string
  issueNumber: string
  releaseDate: Date
  coverUrl: string
  publisher: string
  writer: string[]
  artist: string[]
  description: string
  price: string
  format: 'single-issue' | 'trade-paperback' | 'hardcover'
  genre: string[]
}

export const mockReleases: Release[] = []

export function getNewReleases(): Release[] {
  const today = new Date()
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
  return mockReleases
    .filter(release => release.releaseDate <= today && release.releaseDate >= twoWeeksAgo)
    .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime())
}

export function getUpcomingReleases(): Release[] {
  const today = new Date()
  const fourWeeksFromNow = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000)
  return mockReleases
    .filter(release => release.releaseDate > today && release.releaseDate <= fourWeeksFromNow)
    .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime())
}

export function getReleasesByDate(date: Date): Release[] {
  return mockReleases.filter(release => {
    const releaseDate = new Date(release.releaseDate)
    return releaseDate.toDateString() === date.toDateString()
  })
}

export function getAllReleasesForMonth(year: number, month: number): Release[] {
  return mockReleases.filter(release => {
    const releaseDate = new Date(release.releaseDate)
    return releaseDate.getFullYear() === year && releaseDate.getMonth() === month
  })
}
