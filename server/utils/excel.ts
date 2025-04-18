import ExcelJS from 'exceljs'

const REQUIRED_COLUMNS = [
  'Vorname',
  'Nachname',
  'Mitgliedsnummer',
  'E-Mail',
  'DLV Startpass',
] as const

export async function readExcelFile(filePath: string) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)

  const worksheet = workbook.getWorksheet(1) // Erste Tabelle
  if (!worksheet) {
    throw new Error('Keine Tabelle in der Excel-Datei gefunden')
  }

  const data: Record<string, any>[] = []
  const headers: string[] = []

  // Header-Zeile lesen
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cell.value?.toString() || ''
  })

  // Prüfen, ob alle benötigten Spalten vorhanden sind
  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !headers.includes(col)
  )
  if (missingColumns.length > 0) {
    throw new Error(
      `Fehlende Spalten in der Excel-Datei: ${missingColumns.join(', ')}`
    )
  }

  // Daten lesen
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Header überspringen

    const rowData: Record<string, any> = {}
    let hasData = false

    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1]
      if (REQUIRED_COLUMNS.includes(header as any)) {
        rowData[header] = cell.value
        hasData = true
      }
    })

    if (hasData) {
      data.push(rowData)
    }
  })

  return data
}
