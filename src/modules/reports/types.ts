export type ReportPage = 'product' | 'user'

export interface ReportColumn {
  title: string
  key: string
}

export interface ReportRow {
  [key: string]: string | number | null
}

export interface ReportTable {
  type: 'table'
  title: string
  data: ReportRow[]
  columns: ReportColumn[]
  size: {
    cols: string
    md: string
    lg: string
  }
}

export interface ReportCardItem {
  key: string
  label: string
  value: string | number
  size: {
    cols: string
    md: string
    lg: string
  }
}

export interface ReportCards {
  type: 'card'
  title: string
  data: ReportCardItem[]
}

export interface ReportPayload {
  report: {
    title: string
    page: ReportPage
    cards: ReportCards
    tables: ReportTable[]
  }
  filter: {
    page: ReportPage
    start?: string
    end?: string
    apply_date: boolean
    prefer_chart: string
  }
}

export interface ReportQuery {
  page: ReportPage
  start?: string
  end?: string
}
