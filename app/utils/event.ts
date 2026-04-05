type BadgeColor = 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'warning' | 'neutral'

export const eventTypeLabels: Record<string, string> = {
  ladv: 'LADV',
  competition: 'Wettkampf',
  training: 'Training',
  social: 'Social',
}

export const eventTypeColors: Record<string, BadgeColor> = {
  ladv: 'info',
  competition: 'primary',
  training: 'success',
  social: 'neutral',
}

export const eventRaceTypeLabels: Record<string, string> = {
  track: 'Bahn',
  road: 'Straße',
}

export const eventChampionshipLabels: Record<string, string> = {
  bbm: 'BBM',
  ndm: 'NDM',
  dm: 'DM',
}
