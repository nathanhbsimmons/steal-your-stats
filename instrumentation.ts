export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startShowOfTheDayWarmer } = await import('./lib/services/show-of-the-day')
    startShowOfTheDayWarmer()
  }
}
