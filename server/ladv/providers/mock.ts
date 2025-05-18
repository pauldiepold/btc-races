/**
 * Mock-Provider für den LADV-Service
 */

import type { LadvCompetition } from '~/types/ladv.types'

/**
 * Mock-Daten für Wettkämpfe
 */
const mockCompetitions: LadvCompetition[] = [
  {
    id: 42008,
    name: 'Abendsportfest',
    sportstaette: 'Ernst-Reuter-Sportfeld',
    meldAdresse: 'Detlef Weller, Beerenstr. 11, 14163 Berlin,',
    meldEmail: 'weller-detlef@web.de',
    veranstalter: 'Zehlendorfer TSV v. 1888',
    ausrichter: 'Zehlendorfer TSV v. 1888',
    beschreibung: '',
    datum: 1747778400000,
    datumText: '21.05.2025',
    meldDatum: 1747432800000,
    meldDatumText: '17.05.2025',
    abgesagt: false,
    url: 'https://ladv.de/ausschreibung/detail/42008/Abendsportfest-Berlin-Zehlendorf.htm',
    tags: 'jugend,aktive',
    kategorien: ['jugend', 'aktive'],
    ort: {
      id: 1497,
      name: 'Berlin-Zehlendorf',
      lv: 'BE',
      land: 'DEU',
      lng: 13.259,
      lat: 52.434,
    },
    veranstaltungen: [],
    lvs: 'BE',
    landesverband: ['BE'],
    links: [],
    attachements: [
      {
        name: 'Ausschreibung',
        extension: '.docx',
        url: 'https://ladv.de/ausschreibung/datei/380909',
      },
    ],
    wettbewerbe: [
      {
        disziplin: 'WEI',
        klasse: 'WJB',
        disziplinNew: 'TWEI',
        klasseNew: 'WJU18',
      },
      {
        disziplin: '800',
        klasse: 'WJB',
        disziplinNew: 'L800',
        klasseNew: 'WJU18',
      },
      {
        disziplin: '200',
        klasse: 'WJB',
        disziplinNew: 'L200',
        klasseNew: 'WJU18',
      },
      {
        disziplin: '100',
        klasse: 'WJB',
        disziplinNew: 'L100',
        klasseNew: 'WJU18',
      },
      {
        disziplin: '400',
        klasse: 'WJB',
        disziplinNew: 'L400',
        klasseNew: 'WJU18',
      },
      {
        disziplin: 'STA',
        klasse: 'WJB',
        disziplinNew: 'TSTA',
        klasseNew: 'WJU18',
      },
      {
        disziplin: 'HOC',
        klasse: 'WJB',
        disziplinNew: 'THOC',
        klasseNew: 'WJU18',
      },
      {
        disziplin: 'WEI',
        klasse: 'M14',
        disziplinNew: 'TWEI',
        klasseNew: 'M14',
      },
      {
        disziplin: '800',
        klasse: 'M14',
        disziplinNew: 'L800',
        klasseNew: 'M14',
      },
      {
        disziplin: '300',
        klasse: 'M14',
        disziplinNew: 'L300',
        klasseNew: 'M14',
      },
      {
        disziplin: '100',
        klasse: 'M14',
        disziplinNew: 'L100',
        klasseNew: 'M14',
      },
      {
        disziplin: 'STA',
        klasse: 'M14',
        disziplinNew: 'TSTA',
        klasseNew: 'M14',
      },
      {
        disziplin: 'HOC',
        klasse: 'M14',
        disziplinNew: 'THOC',
        klasseNew: 'M14',
      },
      {
        disziplin: 'WEI',
        klasse: 'W14',
        disziplinNew: 'TWEI',
        klasseNew: 'W14',
      },
      {
        disziplin: '800',
        klasse: 'W14',
        disziplinNew: 'L800',
        klasseNew: 'W14',
      },
      {
        disziplin: '300',
        klasse: 'W14',
        disziplinNew: 'L300',
        klasseNew: 'W14',
      },
      {
        disziplin: '100',
        klasse: 'W14',
        disziplinNew: 'L100',
        klasseNew: 'W14',
      },
      {
        disziplin: 'STA',
        klasse: 'W14',
        disziplinNew: 'TSTA',
        klasseNew: 'W14',
      },
      {
        disziplin: 'HOC',
        klasse: 'W14',
        disziplinNew: 'THOC',
        klasseNew: 'W14',
      },
      {
        disziplin: 'WEI',
        klasse: 'MJA',
        disziplinNew: 'TWEI',
        klasseNew: 'MJU20',
      },
      {
        disziplin: '800',
        klasse: 'MJA',
        disziplinNew: 'L800',
        klasseNew: 'MJU20',
      },
      {
        disziplin: '200',
        klasse: 'MJA',
        disziplinNew: 'L200',
        klasseNew: 'MJU20',
      },
      {
        disziplin: '100',
        klasse: 'MJA',
        disziplinNew: 'L100',
        klasseNew: 'MJU20',
      },
      {
        disziplin: '400',
        klasse: 'MJA',
        disziplinNew: 'L400',
        klasseNew: 'MJU20',
      },
      {
        disziplin: 'STA',
        klasse: 'MJA',
        disziplinNew: 'TSTA',
        klasseNew: 'MJU20',
      },
      {
        disziplin: 'HOC',
        klasse: 'MJA',
        disziplinNew: 'THOC',
        klasseNew: 'MJU20',
      },
      {
        disziplin: 'WEI',
        klasse: 'MJB',
        disziplinNew: 'TWEI',
        klasseNew: 'MJU18',
      },
      {
        disziplin: '800',
        klasse: 'MJB',
        disziplinNew: 'L800',
        klasseNew: 'MJU18',
      },
      {
        disziplin: '200',
        klasse: 'MJB',
        disziplinNew: 'L200',
        klasseNew: 'MJU18',
      },
      {
        disziplin: '400',
        klasse: 'MJB',
        disziplinNew: 'L400',
        klasseNew: 'MJU18',
      },
      {
        disziplin: 'STA',
        klasse: 'MJB',
        disziplinNew: 'TSTA',
        klasseNew: 'MJU18',
      },
      {
        disziplin: 'HOC',
        klasse: 'MJB',
        disziplinNew: 'THOC',
        klasseNew: 'MJU18',
      },
      {
        disziplin: 'WEI',
        klasse: 'W15',
        disziplinNew: 'TWEI',
        klasseNew: 'W15',
      },
      {
        disziplin: '800',
        klasse: 'W15',
        disziplinNew: 'L800',
        klasseNew: 'W15',
      },
      {
        disziplin: '300',
        klasse: 'W15',
        disziplinNew: 'L300',
        klasseNew: 'W15',
      },
      {
        disziplin: '100',
        klasse: 'W15',
        disziplinNew: 'L100',
        klasseNew: 'W15',
      },
      {
        disziplin: 'STA',
        klasse: 'W15',
        disziplinNew: 'TSTA',
        klasseNew: 'W15',
      },
      {
        disziplin: 'HOC',
        klasse: 'W15',
        disziplinNew: 'THOC',
        klasseNew: 'W15',
      },
      {
        disziplin: 'WEI',
        klasse: 'WJA',
        disziplinNew: 'TWEI',
        klasseNew: 'WJU20',
      },
      {
        disziplin: '800',
        klasse: 'WJA',
        disziplinNew: 'L800',
        klasseNew: 'WJU20',
      },
      {
        disziplin: '200',
        klasse: 'WJA',
        disziplinNew: 'L200',
        klasseNew: 'WJU20',
      },
      {
        disziplin: '100',
        klasse: 'WJA',
        disziplinNew: 'L100',
        klasseNew: 'WJU20',
      },
      {
        disziplin: '400',
        klasse: 'WJA',
        disziplinNew: 'L400',
        klasseNew: 'WJU20',
      },
      {
        disziplin: 'STA',
        klasse: 'WJA',
        disziplinNew: 'TSTA',
        klasseNew: 'WJU20',
      },
      {
        disziplin: 'HOC',
        klasse: 'WJA',
        disziplinNew: 'THOC',
        klasseNew: 'WJU20',
      },
      {
        disziplin: 'WEI',
        klasse: 'M15',
        disziplinNew: 'TWEI',
        klasseNew: 'M15',
      },
      {
        disziplin: '800',
        klasse: 'M15',
        disziplinNew: 'L800',
        klasseNew: 'M15',
      },
      {
        disziplin: '300',
        klasse: 'M15',
        disziplinNew: 'L300',
        klasseNew: 'M15',
      },
      {
        disziplin: '100',
        klasse: 'M15',
        disziplinNew: 'L100',
        klasseNew: 'M15',
      },
      {
        disziplin: 'STA',
        klasse: 'M15',
        disziplinNew: 'TSTA',
        klasseNew: 'M15',
      },
      {
        disziplin: 'HOC',
        klasse: 'M15',
        disziplinNew: 'THOC',
        klasseNew: 'M15',
      },
      { disziplin: 'STA', klasse: 'M', disziplinNew: 'TSTA', klasseNew: 'M' },
      { disziplin: 'STA', klasse: 'W', disziplinNew: 'TSTA', klasseNew: 'W' },
    ],
  },
]

/**
 * Mock-Provider für den LADV-Service
 */
export class MockLadvProvider {
  /**
   * Simuliert eine Verzögerung der API-Antwort
   */
  private async simulateDelay(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  /**
   * Holt Details zu einem Wettkampf
   */
  async getCompetitionDetails(id: number): Promise<LadvCompetition | null> {
    await this.simulateDelay()

    const competition = mockCompetitions.find((c) => c.id === id)
    if (!competition) {
      return null
    }

    // Simuliere zufällige Fehler (10% Wahrscheinlichkeit)
    if (Math.random() < 0.1) {
      throw new Error('Simulierter API-Fehler')
    }

    return competition
  }

  /**
   * Sucht nach Wettkämpfen
   */
  async searchCompetitions(query: string): Promise<LadvCompetition[]> {
    await this.simulateDelay()

    if (!query) {
      return mockCompetitions
    }

    const searchTerm = query.toLowerCase()
    return mockCompetitions.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm) ||
        c.ort.name.toLowerCase().includes(searchTerm) ||
        c.tags.toLowerCase().includes(searchTerm)
    )
  }
}
