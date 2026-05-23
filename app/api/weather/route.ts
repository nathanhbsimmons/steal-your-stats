import { NextResponse } from 'next/server'

const OPEN_METEO_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=29.30&longitude=-94.79&current=temperature_2m,weather_code&temperature_unit=fahrenheit'

const weatherDescriptions: Record<number, { label: string }> = {
  0:  { label: "Clear sky and a sunshine daydream" },
  1:  { label: "Mainly clear and here comes the sunshine" },
  2:  { label: "Partly cloudy brings a golden road to wisdom" },
  3:  { label: "Overcast, the dark star crashes" },
  45: { label: "Foggy as the mountains of the moon" },
  48: { label: "Icy fog and the wheel keeps turning" },
  51: { label: "Little boxes of rain" },
  53: { label: "Looks like rain" },
  55: { label: "Dense drizzle and trouble ahead" },
  61: { label: "Little boxes of rain" },
  63: { label: "Cold rain falling down" },
  65: { label: "Cold heavy rain falling down" },
  71: { label: "Slight snow to roll away the dew" },
  73: { label: "Moderate snow and the snow ain't melting" },
  75: { label: "Buried alive in the blues and heavy snow" },
  77: { label: "Snow flurries ripple in still water" },
  80: { label: "Slight showers bring laughin' and cryin'" },
  81: { label: "Moderate showers drivin' that train" },
  82: { label: "Trouble ahead, trouble behind with violent showers" },
  85: { label: "Touch of grey snow showers" },
  86: { label: "The storm that's a-comin' with heavy snow showers" },
  95: { label: "Thunderstorm won't get you the lightning will" },
  96: { label: "Thunderstorm w/ hail and the sky is falling in" },
  99: { label: "Thunderstorm w/ hail and the sky is falling in" },
}

export async function GET() {
  try {
    const res = await fetch(OPEN_METEO_URL, {
      next: { revalidate: 600 },
    })
    if (!res.ok) throw new Error(`open-meteo ${res.status}`)

    const data = await res.json()
    const temp = Math.round(data.current.temperature_2m)
    const code = data.current.weather_code as number
    const description = weatherDescriptions[code] ?? weatherDescriptions[0]

    return NextResponse.json({ temp, code, label: description.label })
  } catch {
    return NextResponse.json(
      { temp: null, code: null, label: null },
      { status: 503 }
    )
  }
}
