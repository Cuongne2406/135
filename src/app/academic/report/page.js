import ReportClient from './client'
import { user_data } from '@/data/actions/get'

export default async function AcademicReportPage() {
    let data = await user_data({ type: 'report' })
    return <ReportClient initialReports={data} />
}
