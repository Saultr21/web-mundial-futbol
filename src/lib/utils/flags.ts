export const FLAG_CODES: Record<string, string> = {
  'Mexico': 'mx',
  'South Africa': 'za',
  'South Korea': 'kr',
  'Czechia': 'cz',
  'Canada': 'ca',
  'Bosnia-Herzegovina': 'ba',
  'United States': 'us',
  'Paraguay': 'py',
  'Qatar': 'qa',
  'Switzerland': 'ch',
  'Brazil': 'br',
  'Morocco': 'ma',
  'Haiti': 'ht',
  'Scotland': 'gb-sct',
  'Australia': 'au',
  'Turkey': 'tr',
  'Germany': 'de',
  'Curaçao': 'cw',
  'Netherlands': 'nl',
  'Japan': 'jp',
  'Ivory Coast': 'ci',
  'Ecuador': 'ec',
  'Sweden': 'se',
  'Tunisia': 'tn',
  'Spain': 'es',
  'Cape Verde Islands': 'cv',
  'Belgium': 'be',
  'Egypt': 'eg',
  'Saudi Arabia': 'sa',
  'Uruguay': 'uy',
  'Iran': 'ir',
  'New Zealand': 'nz',
  'France': 'fr',
  'Senegal': 'sn',
  'Iraq': 'iq',
  'Norway': 'no',
  'Argentina': 'ar',
  'Algeria': 'dz',
  'Austria': 'at',
  'Jordan': 'jo',
  'Portugal': 'pt',
  'Congo DR': 'cd',
  'England': 'gb-eng',
  'Croatia': 'hr',
  'Ghana': 'gh',
  'Panama': 'pa',
  'Uzbekistan': 'uz',
  'Colombia': 'co',
}

export function getFlagUrl(team: string): string {
  const code = FLAG_CODES[team]
  if (!code) return ''
  return `https://flagcdn.com/w40/${code}.png`
}

export function getTeamInitials(team: string): string {
  return team.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
}
