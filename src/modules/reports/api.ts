import { http, unwrapData } from '@/api/http'
import type { ApiEnvelope } from '@/types/api'
import type { ReportPayload, ReportQuery } from './types'

export async function getReport(query: ReportQuery): Promise<ReportPayload> {
  const response = await http.get<ApiEnvelope<ReportPayload>>('/report', {
    params: query,
  })

  return unwrapData(response)
}
