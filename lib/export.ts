import ExcelJS from 'exceljs'
import { Lead, FormTemplate } from './schemas'

const parseDate = (val: any): Date | null => {
  if (!val) return null
  if (typeof val.toDate === 'function') {
    return val.toDate()
  }
  if (val instanceof Date) {
    return val
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

const formatDate = (date: Date | null): string => {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const MM = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`
}

const getValueCaseInsensitive = (data: Record<string, any> | undefined, targetKeys: string[]): string => {
  if (!data) return ''
  for (const k of Object.keys(data)) {
    if (targetKeys.includes(k.toLowerCase())) {
      return String(data[k] || '')
    }
  }
  return ''
}

export async function exportLeadsToExcel(
  leads: (Lead & { id: string })[],
  forms: (FormTemplate & { id: string })[],
  organizationId: string
) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Leads')

  // Configure Columns
  const columnsDef = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Phone', key: 'phone', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'Loan Amount', key: 'loan_amount', width: 20 },
    { header: 'Date', key: 'date', width: 22 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Form Name', key: 'form_name', width: 25 },
  ]

  worksheet.columns = columnsDef

  // Add data rows
  leads.forEach((lead) => {
    const rowData = {
      name: getValueCaseInsensitive(lead.data, ['name', 'displayname', 'fullname', 'full name']),
      phone: getValueCaseInsensitive(lead.data, ['phone', 'mobile', 'contact', 'phone number', 'phonenumber']),
      email: getValueCaseInsensitive(lead.data, ['email', 'email address', 'emailaddress']),
      city: getValueCaseInsensitive(lead.data, ['city', 'location', 'address']),
      loan_amount: getValueCaseInsensitive(lead.data, ['loanamount', 'loan_amount', 'amount', 'loan']),
      date: formatDate(parseDate(lead.createdAt)),
      status: lead.status ? lead.status.toUpperCase() : 'NEW',
      form_name: forms.find((f) => f.id === lead.formId)?.name || 'Unknown',
    }

    worksheet.addRow(rowData)
  })

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
