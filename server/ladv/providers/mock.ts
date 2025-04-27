/**
 * Mock-Provider für den LADV-Service
 */

import type { LadvCompetition } from '~/types/ladv.types'

/**
 * Mock-Daten für Wettkämpfe
 */
const mockCompetitions: LadvCompetition[] = [
  {
    id: 1,
    name: "25. Bönnigheimer Sportfest an Himmelfahrt",
    sportstaette: "Sportanlagen Bönnigheim",
    meldAdresse: "Rose Müller, Bei der Kelter 5, 74321 Bietigheim-Bissingen",
    meldEmail: "meldungen@lg-neckar-enz.de",
    veranstalter: "LG Neckar-Enz",
    ausrichter: "TSV Bönnigheim",
    beschreibung: "In den Laufdisziplinen bitte die Bestleistung 2023/2024 angeben. Weitere Hinweise finden Sie auf der Homepage des Sportfests unter www.sportfest-an-himmelfahrt.de",
    datum: new Date("2024-05-09").getTime(),
    datumText: "09.05.2024",
    meldDatum: new Date("2024-05-05").getTime(),
    meldDatumText: "05.05.2024",
    abgesagt: false,
    wrc: true,
    url: "https://ladv.de/ausschreibung/detail/1",
    tags: "jugend,stuttgart,schueler,ludwigsburg,aktive,rems-neckar",
    ort: {
      id: 55,
      name: "Bönnigheim",
      lv: "WÜ",
      land: "DEU",
      lng: 9.0942,
      lat: 49.0387
    },
    wettbewerbe: [
      { disziplin: "100", klasse: "M14" },
      { disziplin: "300", klasse: "M14" },
      { disziplin: "800", klasse: "M16" }
    ]
  },
  {
    id: 2,
    name: "Stuttgarter Stadtmeisterschaften",
    sportstaette: "Gottlieb-Daimler-Stadion",
    meldAdresse: "Stuttgarter Leichtathletik-Verband, Hauptstraße 1, 70173 Stuttgart",
    meldEmail: "meldungen@slv.de",
    veranstalter: "Stuttgarter Leichtathletik-Verband",
    ausrichter: "LG Stuttgart",
    beschreibung: "Die Stuttgarter Stadtmeisterschaften 2024. Alle Disziplinen der Leichtathletik werden angeboten.",
    datum: new Date("2024-06-15").getTime(),
    datumText: "15.06.2024",
    meldDatum: new Date("2024-06-10").getTime(),
    meldDatumText: "10.06.2024",
    abgesagt: false,
    wrc: true,
    url: "https://ladv.de/ausschreibung/detail/2",
    tags: "stadtmeisterschaft,stuttgart,aktive,jugend",
    ort: {
      id: 1,
      name: "Stuttgart",
      lv: "WÜ",
      land: "DEU",
      lng: 9.1815,
      lat: 48.7758
    },
    wettbewerbe: [
      { disziplin: "100", klasse: "M16" },
      { disziplin: "200", klasse: "M16" },
      { disziplin: "400", klasse: "M18" },
      { disziplin: "800", klasse: "M18" }
    ]
  },
  {
    id: 3,
    name: "Ludwigsburger Stadtlauf",
    sportstaette: "Stadion am Salier",
    meldAdresse: "Ludwigsburger Leichtathletik-Club, Sportplatzweg 1, 71636 Ludwigsburg",
    meldEmail: "meldungen@llc.de",
    veranstalter: "Ludwigsburger Leichtathletik-Club",
    ausrichter: "LLC Ludwigsburg",
    beschreibung: "Der traditionelle Ludwigsburger Stadtlauf mit verschiedenen Streckenlängen für alle Altersklassen.",
    datum: new Date("2024-07-20").getTime(),
    datumText: "20.07.2024",
    meldDatum: new Date("2024-07-15").getTime(),
    meldDatumText: "15.07.2024",
    abgesagt: false,
    wrc: false,
    url: "https://ladv.de/ausschreibung/detail/3",
    tags: "stadtlauf,ludwigsburg,strassenlauf",
    ort: {
      id: 2,
      name: "Ludwigsburg",
      lv: "WÜ",
      land: "DEU",
      lng: 9.1916,
      lat: 48.8973
    },
    wettbewerbe: [
      { disziplin: "5km", klasse: "M16" },
      { disziplin: "10km", klasse: "M18" },
      { disziplin: "Halbmarathon", klasse: "M20" }
    ]
  }
]

/**
 * Mock-Provider für den LADV-Service
 */
export class MockLadvProvider {
  /**
   * Simuliert eine Verzögerung der API-Antwort
   */
  private async simulateDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  /**
   * Holt Details zu einem Wettkampf
   */
  async getCompetitionDetails(id: number): Promise<LadvCompetition | null> {
    await this.simulateDelay()
    
    const competition = mockCompetitions.find(c => c.id === id)
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
    return mockCompetitions.filter(c => 
      c.name.toLowerCase().includes(searchTerm) ||
      c.ort.name.toLowerCase().includes(searchTerm) ||
      c.tags.toLowerCase().includes(searchTerm)
    )
  }
} 