
import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import { api } from '../services/api.js';

const reports = [
  {
    title: 'Complaint Summary',
    endpoint: '/api/reports/complaint-summary',
    description: 'Complaints grouped by status.',
  },
  {
    title: 'Equipment Status',
    endpoint: '/api/reports/equipment-status',
    description: 'Equipment grouped by current status.',
  },
  {
    title: 'Laboratory Report',
    endpoint: '/api/reports/lab-report',
    description: 'Equipment and faulty equipment in each laboratory.',
  },
  {
    title: 'Repair Cost',
    endpoint: '/api/reports/repair-cost',
    description: 'Repair records and costs by laboratory.',
  },
];

function displayValue(value) {
  if (value === null || value === undefined) return '—';

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function ReportCard({ report, result }) {
  const rows = result?.data || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <section className="report-card">
      <div className="report-card-heading">
        <div>
          <h2>{report.title}</h2>
          <p>{report.description}</p>
        </div>
        <span className="report-count">
          {result?.count ?? 0} records
        </span>
      </div>

      {result?.error ? (
        <p className="report-error">{result.error}</p>
      ) : rows.length === 0 ? (
        <p className="report-empty">No records available.</p>
      ) : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>
                    {column.replaceAll('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column}>
                      {displayValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function ReportsPage() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    setLoading(true);

    const responses = await Promise.all(
      reports.map(async (report) => {
        try {
          const response = await api.get(report.endpoint);
          return [report.endpoint, response.data];
        } catch (error) {
          return [
            report.endpoint,
            { error: error.response?.data?.error || error.message },
          ];
        }
      })
    );

    setResults(Object.fromEntries(responses));
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="reports-page">
      <PageHeading
        title="Reports & Analytics"
        description="View laboratory operations, equipment status, complaints and repair expenses."
      />

      <div className="reports-toolbar">
        <div>
          <BarChart3 size={18} />
          <span>Live reports from Supabase</span>
        </div>

        <button
          className="secondary-button"
          onClick={loadReports}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="report-empty">Loading reports...</p>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <ReportCard
              key={report.endpoint}
              report={report}
              result={results[report.endpoint]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
