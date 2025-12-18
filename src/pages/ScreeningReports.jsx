import { useState, useEffect } from 'react';
import api from '../utils/api';

const ScreeningReports = () => {
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScreening, setSelectedScreening] = useState(null);

  useEffect(() => {
    fetchScreenings();
  }, []);

  const fetchScreenings = async () => {
    try {
      const response = await api.get('/admin/screenings');
      setScreenings(response.data);
    } catch (error) {
      console.error('Error fetching screenings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLabel = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'Rendah';
      case 'medium':
        return 'Sedang';
      case 'high':
        return 'Tinggi';
      default:
        return riskLevel;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredScreenings = screenings.filter((screening) => {
    const matchesRisk = filterRisk === 'all' || screening.risk_level === filterRisk;
    const matchesSearch = 
      screening.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screening.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  const getQuestionText = (questionId) => {
    const questions = {
      1: 'Tekanan Darah',
      2: 'Irama Jantung',
      3: 'Kebiasaan Merokok',
      4: 'Kolesterol',
      5: 'Diabetes',
      6: 'Aktivitas Fisik',
      7: 'Berat Badan',
      8: 'Riwayat Stroke dalam Keluarga',
    };
    return questions[questionId] || `Pertanyaan ${questionId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Skrining Stroke</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Total: {screenings.length} skrining</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Pengguna
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nama atau email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Risiko
            </label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Semua Risiko</option>
              <option value="low">Risiko Rendah</option>
              <option value="medium">Risiko Sedang</option>
              <option value="high">Risiko Tinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Skrining</div>
          <div className="text-3xl font-bold text-gray-900">{screenings.length}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
          <div className="text-sm font-medium text-green-600 mb-2">Risiko Rendah</div>
          <div className="text-3xl font-bold text-green-700">
            {screenings.filter(s => s.risk_level === 'low').length}
          </div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200">
          <div className="text-sm font-medium text-yellow-600 mb-2">Risiko Sedang</div>
          <div className="text-3xl font-bold text-yellow-700">
            {screenings.filter(s => s.risk_level === 'medium').length}
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200">
          <div className="text-sm font-medium text-red-600 mb-2">Risiko Tinggi</div>
          <div className="text-3xl font-bold text-red-700">
            {screenings.filter(s => s.risk_level === 'high').length}
          </div>
        </div>
      </div>

      {/* Screenings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risiko
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScreenings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data skrining
                  </td>
                </tr>
              ) : (
                filteredScreenings.map((screening) => (
                  <tr key={screening.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {screening.user_name}
                        </div>
                        <div className="text-sm text-gray-500">{screening.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(screening.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-gray-900">{screening.score}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {screening.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskBadgeColor(
                          screening.risk_level
                        )}`}
                      >
                        {getRiskLabel(screening.risk_level)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedScreening(screening)}
                        className="text-primary-600 hover:text-primary-900 font-medium"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedScreening && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Detail Skrining Stroke</h2>
              <button
                onClick={() => setSelectedScreening(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Informasi Pengguna</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Nama:</span> {selectedScreening.user_name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {selectedScreening.user_email}
                  </p>
                  <p>
                    <span className="font-medium">Tanggal:</span>{' '}
                    {formatDate(selectedScreening.created_at)}
                  </p>
                </div>
              </div>

              {/* Screening Result */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  selectedScreening.risk_level === 'high'
                    ? 'bg-red-50 border-red-200'
                    : selectedScreening.risk_level === 'medium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-2">Hasil Skrining</h3>
                <div className="space-y-2">
                  <p className="text-lg">
                    <span className="font-medium">Skor Total:</span>{' '}
                    <span className="font-bold text-2xl">{selectedScreening.score}</span>
                  </p>
                  <p>
                    <span className="font-medium">Kategori:</span> {selectedScreening.category}
                  </p>
                  <p>
                    <span className="font-medium">Level Risiko:</span>{' '}
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskBadgeColor(
                        selectedScreening.risk_level
                      )}`}
                    >
                      {getRiskLabel(selectedScreening.risk_level)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Answers */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Jawaban Detail</h3>
                <div className="space-y-3">
                  {Object.entries(selectedScreening.answers).map(([questionId, answer]) => (
                    <div key={questionId} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {getQuestionText(parseInt(questionId))}
                      </p>
                      <p className="text-sm text-gray-900">
                        Jawaban: <span className="font-semibold">{answer}</span>
                        {answer === 'A' && ' (3 poin)'}
                        {answer === 'B' && ' (1 poin)'}
                        {answer === 'C' && ' (0 poin)'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreeningReports;








