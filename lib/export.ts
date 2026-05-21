import ExcelJS from 'exceljs'
import { Lead, FormTemplate } from './schemas'

export async function exportLeadsToExcel(
  leads: (Lead & { id: string })[],
  forms: (FormTemplate & { id: string })[],
  organizationId: string
) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Leads')

  // Get all unique field names from all leads
  const allFieldNames = new Set<string>()
  leads.forEach((lead) => {
    Object.keys(lead.data || {}).forEach((key) => allFieldNames.add(key))
  })

  // Create headers
  const headers = ['ID', 'Form', 'Status', 'Created Date', 'Updated Date', ...Array.from(allFieldNames)]
  worksheet.columns = headers.map((header) => ({
    header,
    key: header.toLowerCase().replace(/\s+/g, '_'),
    width: 15,
  }))

  // Style header row
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' },
  }
  headerRow.alignment = { horizontal: 'center', vertical: 'center' }

  // Add data rows
  leads.forEach((lead, index) => {
    const row = {
      id: lead.id,
      form: forms.find((f) => f.id === lead.formId)?.name || 'Unknown',
      status: lead.status,
      created_date: new Date(lead.createdAt).toLocaleString(),
      updated_date: new Date(lead.updatedAt).toLocaleString(),
    }

    // Add field data
    allFieldNames.forEach((fieldName) => {
      const key = fieldName.toLowerCase().replace(/\s+/g, '_')
      ;(row as any)[key] = lead.data?.[fieldName] || ''
    })

    worksheet.addRow(row)
  })

  // Format data cells
  for (let i = 2; i <= leads.length + 1; i++) {
    const row = worksheet.getRow(i)
    row.alignment = { horizontal: 'left', vertical: 'center', wrapText: true }
    row.font = { color: { argb: 'FF000000' } }

    // Alternate row colors
    if (i % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      }
    }
  }

  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer()

  // Create download link
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `leads-export-${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
  window.URL.revokeObjectURL(url)
}
