export const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`Request failed: ${r.status}`)
    return r.json()
  })

export const swrOpts = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 24 * 60 * 60 * 1000,
  errorRetryCount: 3,
}
