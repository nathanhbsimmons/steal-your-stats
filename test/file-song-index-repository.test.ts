import { describe, it, expect, beforeEach } from 'vitest'
import { FileSongIndexRepository } from '../lib/repositories/file-song-index-repository'

describe('FileSongIndexRepository', () => {
  let repository: FileSongIndexRepository

  beforeEach(() => {
    repository = new FileSongIndexRepository()
  })

  describe('searchSongs', () => {
    it('should return empty array for empty query', async () => {
      const results = await repository.searchSongs('')
      expect(results).toEqual([])
    })

    it('should return empty array for whitespace query', async () => {
      const results = await repository.searchSongs('   ')
      expect(results).toEqual([])
    })

    it('should return empty array when no songs match', async () => {
      const results = await repository.searchSongs('nonexistent song')
      expect(results).toEqual([])
    })
  })

  describe('getSongByTitle', () => {
    it('should return null for unknown song', async () => {
      const result = await repository.getSongByTitle('Unknown Song')
      expect(result).toBeNull()
    })
  })

  describe('getPositions', () => {
    it('should return null for unknown song', async () => {
      const result = await repository.getPositions('unknown-song')
      expect(result).toBeNull()
    })

    it('should return position facts for known song', async () => {
      const setlist = {
        id: 'test-setlist',
        eventDate: '1972-08-27',
        venue: {
          name: 'Venue Name',
          city: { name: 'City Name', country: { name: 'Country Name' } }
        },
        sets: {
          set: [{
            song: [
              { name: 'Dark Star' },
              { name: 'Sugar Magnolia' }
            ]
          }]
        }
      }

      await repository.upsertFromSetlist('test-setlist', setlist)
      const darkStar = await repository.getSongByTitle('Dark Star')
      expect(darkStar).not.toBeNull()

      const positions = await repository.getPositions(darkStar!.id)
      expect(positions).not.toBeNull()
      expect(positions?.opener.count).toBe(1)
      expect(positions?.opener.shows).toHaveLength(1)
      expect(positions?.closer.count).toBe(0)
      expect(positions?.closer.shows).toHaveLength(0)
      expect(positions?.encore.count).toBe(0)
      expect(positions?.encore.shows).toHaveLength(0)
    })
  })

  describe('getPositionPage', () => {
    it('should return empty result for unknown song', async () => {
      const result = await repository.getPositionPage({
        songId: 'unknown-song',
        positionType: 'opener',
        pageSize: 10
      })
      expect(result.items).toEqual([])
      expect(result.hasMore).toBe(false)
      expect(result.totalCount).toBe(0)
    })

    it('should return paginated opener shows', async () => {
      // Create multiple setlists with Dark Star as opener
      const setlists = [
        {
          id: 'test-1',
          eventDate: '1972-08-27',
          venue: { name: 'Venue 1', city: { name: 'City 1', country: { name: 'Country 1' } } },
          sets: { set: [{ song: [{ name: 'Dark Star' }] }] }
        },
        {
          id: 'test-2',
          eventDate: '1972-08-28',
          venue: { name: 'Venue 2', city: { name: 'City 2', country: { name: 'Country 2' } } },
          sets: { set: [{ song: [{ name: 'Dark Star' }] }] }
        },
        {
          id: 'test-3',
          eventDate: '1972-08-29',
          venue: { name: 'Venue 3', city: { name: 'City 3', country: { name: 'Country 3' } } },
          sets: { set: [{ song: [{ name: 'Dark Star' }] }] }
        }
      ]

      for (const setlist of setlists) {
        await repository.upsertFromSetlist(setlist.id, setlist)
      }

      const darkStar = await repository.getSongByTitle('Dark Star')
      expect(darkStar).not.toBeNull()

      // Test first page
      const page1 = await repository.getPositionPage({
        songId: darkStar!.id,
        positionType: 'opener',
        pageSize: 2
      })
      expect(page1.items).toHaveLength(2)
      expect(page1.hasMore).toBe(true)
      expect(page1.totalCount).toBe(3)

      // Test second page
      const page2 = await repository.getPositionPage({
        songId: darkStar!.id,
        positionType: 'opener',
        cursor: '1',
        pageSize: 2
      })
      expect(page2.items).toHaveLength(1)
      expect(page2.hasMore).toBe(false)
      expect(page2.totalCount).toBe(3)
    })

    it('should handle different position types', async () => {
      const setlist = {
        id: 'test-setlist',
        eventDate: '1972-08-27',
        venue: { name: 'Venue Name', city: { name: 'City Name', country: { name: 'Country Name' } } },
        sets: {
          set: [
            { song: [{ name: 'Dark Star' }, { name: 'Sugar Magnolia' }] },
            { encore: 1, song: [{ name: 'Not Fade Away' }] }
          ]
        }
      }

      await repository.upsertFromSetlist('test-setlist', setlist)
      const darkStar = await repository.getSongByTitle('Dark Star')
      expect(darkStar).not.toBeNull()

      // Test opener
      const openerPage = await repository.getPositionPage({
        songId: darkStar!.id,
        positionType: 'opener'
      })
      expect(openerPage.items).toHaveLength(1)
      expect(openerPage.totalCount).toBe(1)

      // Test closer
      const closerPage = await repository.getPositionPage({
        songId: darkStar!.id,
        positionType: 'closer'
      })
      expect(closerPage.items).toHaveLength(0)
      expect(closerPage.totalCount).toBe(0)

      // Test encore
      const encorePage = await repository.getPositionPage({
        songId: darkStar!.id,
        positionType: 'encore'
      })
      expect(encorePage.items).toHaveLength(0)
      expect(encorePage.totalCount).toBe(0)
    })
  })

  describe('upsertFromSetlist', () => {
    it('should handle empty setlist', async () => {
      await repository.upsertFromSetlist('test-id', {})
      // Should not throw
    })

    it('should handle setlist with no sets', async () => {
      await repository.upsertFromSetlist('test-id', { sets: {} })
      // Should not throw
    })

    it('should handle setlist with empty sets', async () => {
      await repository.upsertFromSetlist('test-id', { sets: { set: [] } })
      // Should not throw
    })

    it('should process a simple setlist', async () => {
      const setlist = {
        id: 'test-setlist',
        eventDate: '1972-08-27',
        venue: {
          name: 'Venue Name',
          city: { name: 'City Name', country: { name: 'Country Name' } }
        },
        sets: {
          set: [{
            song: [
              { name: 'Dark Star' },
              { name: 'Sugar Magnolia' }
            ]
          }]
        }
      }

      await repository.upsertFromSetlist('test-setlist', setlist)

      const darkStar = await repository.getSongByTitle('Dark Star')
      expect(darkStar).not.toBeNull()
      expect(darkStar?.title).toBe('Dark Star')
      expect(darkStar?.totalPerformances).toBe(1)
      expect(darkStar?.openerCount).toBe(1) // First song in first set
      expect(darkStar?.closerCount).toBe(0) // Not last song
      expect(darkStar?.encoreCount).toBe(0) // Not in encore

      const sugarMagnolia = await repository.getSongByTitle('Sugar Magnolia')
      expect(sugarMagnolia).not.toBeNull()
      expect(sugarMagnolia?.title).toBe('Sugar Magnolia')
      expect(sugarMagnolia?.totalPerformances).toBe(1)
      expect(sugarMagnolia?.openerCount).toBe(0) // Not first song
      expect(sugarMagnolia?.closerCount).toBe(1) // Last song in set
      expect(sugarMagnolia?.encoreCount).toBe(0) // Not in encore
    })

    it('should handle encore sets', async () => {
      const setlist = {
        id: 'test-setlist-encore',
        eventDate: '1972-08-27',
        venue: {
          name: 'Venue Name',
          city: { name: 'City Name', country: { name: 'Country Name' } }
        },
        sets: {
          set: [
            {
              song: [
                { name: 'Dark Star' }
              ]
            },
            {
              encore: 1,
              song: [
                { name: 'Not Fade Away' }
              ]
            }
          ]
        }
      }

      await repository.upsertFromSetlist('test-setlist-encore', setlist)

      const notFadeAway = await repository.getSongByTitle('Not Fade Away')
      expect(notFadeAway).not.toBeNull()
      expect(notFadeAway?.encoreCount).toBe(1)
    })

    it('should handle multiple performances of same song', async () => {
      const setlist1 = {
        id: 'test-setlist-1',
        eventDate: '1972-08-27',
        venue: {
          name: 'Venue 1',
          city: { name: 'City 1', country: { name: 'Country 1' } }
        },
        sets: {
          set: [{
            song: [{ name: 'Dark Star' }]
          }]
        }
      }

      const setlist2 = {
        id: 'test-setlist-2',
        eventDate: '1972-08-28',
        venue: {
          name: 'Venue 2',
          city: { name: 'City 2', country: { name: 'Country 2' } }
        },
        sets: {
          set: [{
            song: [{ name: 'Dark Star' }]
          }]
        }
      }

      await repository.upsertFromSetlist('test-setlist-1', setlist1)
      await repository.upsertFromSetlist('test-setlist-2', setlist2)

      const darkStar = await repository.getSongByTitle('Dark Star')
      expect(darkStar).not.toBeNull()
      expect(darkStar?.totalPerformances).toBe(2)
      expect(darkStar?.openerCount).toBe(2) // First song in both sets
    })
  })
})
