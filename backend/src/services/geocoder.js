const BC_GEOCODER_URL = 'https://geocoder.api.gov.bc.ca/addresses.geojson'

export async function geocodeAddress(address, city, province) {
  if (!address) return null

  const parts = [address, city, province].filter(Boolean)
  const addressString = parts.join(', ')

  try {
    const url = new URL(BC_GEOCODER_URL)
    url.searchParams.set('addressString', addressString)
    url.searchParams.set('maxResults', '1')
    url.searchParams.set('outputSRS', '4326')

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return null

    const data = await res.json()
    const feature = data?.features?.[0]
    if (!feature?.geometry?.coordinates) return null

    const [longitude, latitude] = feature.geometry.coordinates
    return { latitude, longitude }
  } catch {
    return null
  }
}
