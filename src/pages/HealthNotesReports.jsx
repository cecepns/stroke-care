import { useState, useEffect } from 'react';
import api from '../utils/api';

const HealthNotesReports = () => {
  const [healthNotes, setHealthNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    fetchHealthNotes();
  }, []);

  const fetchHealthNotes = async () => {
    try {
      const response = await api.get('/admin/health-notes');
      setHealthNotes(response.data);
    } catch (error) {
      console.error('Error fetching health notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      case 'normal':
        return 'text-green-600 bg-green-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'low':
        return 'Rendah';
      case 'normal':
        return 'Normal';
      case 'high':
        return 'Tinggi';
      default:
        return '-';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const hasAbnormalValues = (note) => {
    return (
      note.blood_sugar_status === 'high' ||
      note.cholesterol_status === 'high' ||
      note.blood_pressure_status === 'high'
    );
  };

  const filteredNotes = healthNotes.filter((note) => {
    const matchesSearch =
      note.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.user_email.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'abnormal') return matchesSearch && hasAbnormalValues(note);
    if (filterStatus === 'normal') return matchesSearch && !hasAbnormalValues(note);

    return matchesSearch;
  });

  const abnormalCount = healthNotes.filter(hasAbnormalValues).length;

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
        <h1 className="text-2xl font-bold text-gray-900">Catatan Kesehatan Pengguna</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Total: {healthNotes.length} catatan</span>
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
              Filter Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Semua Catatan</option>
              <option value="abnormal">Perlu Perhatian (Ada Nilai Tinggi)</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Catatan</div>
          <div className="text-3xl font-bold text-gray-900">{healthNotes.length}</div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200">
          <div className="text-sm font-medium text-red-600 mb-2">Perlu Perhatian</div>
          <div className="text-3xl font-bold text-red-700">{abnormalCount}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
          <div className="text-sm font-medium text-green-600 mb-2">Normal</div>
          <div className="text-3xl font-bold text-green-700">
            {healthNotes.length - abnormalCount}
          </div>
        </div>
      </div>

      {/* Health Notes Table */}
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
                  Gula Darah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kolesterol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tekanan Darah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data catatan kesehatan
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => (
                  <tr key={note.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {note.user_name}
                        </div>
                        <div className="text-sm text-gray-500">{note.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(note.note_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {note.blood_sugar ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {note.blood_sugar} mg/dL
                          </div>
                          <div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                                note.blood_sugar_status
                              )}`}
                            >
                              {getStatusText(note.blood_sugar_status)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {note.cholesterol ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {note.cholesterol} mg/dL
                          </div>
                          <div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                                note.cholesterol_status
                              )}`}
                            >
                              {getStatusText(note.cholesterol_status)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {note.blood_pressure_systolic && note.blood_pressure_diastolic ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {note.blood_pressure_systolic}/{note.blood_pressure_diastolic} mmHg
                          </div>
                          <div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                                note.blood_pressure_status
                              )}`}
                            >
                              {getStatusText(note.blood_pressure_status)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasAbnormalValues(note) ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Perlu Perhatian
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedNote(note)}
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
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Detail Catatan Kesehatan</h2>
              <button
                onClick={() => setSelectedNote(null)}
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
                    <span className="font-medium">Nama:</span> {selectedNote.user_name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {selectedNote.user_email}
                  </p>
                  <p>
                    <span className="font-medium">Tanggal Catatan:</span>{' '}
                    {formatDate(selectedNote.note_date)}
                  </p>
                </div>
              </div>

              {/* Health Metrics */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Data Kesehatan</h3>

                {/* Blood Sugar */}
                {selectedNote.blood_sugar && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Gula Darah Sewaktu</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedNote.blood_sugar} <span className="text-base">mg/dL</span>
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 text-sm font-semibold rounded-lg ${getStatusColor(
                          selectedNote.blood_sugar_status
                        )}`}
                      >
                        {getStatusText(selectedNote.blood_sugar_status)}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      <p>🟡 Rendah: {'<'} 140 mg/dL</p>
                      <p>🟢 Normal: 140 – 199 mg/dL</p>
                      <p>🔴 Tinggi: {'>'} 200 mg/dL</p>
                    </div>
                  </div>
                )}

                {/* Cholesterol */}
                {selectedNote.cholesterol && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Kolesterol Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedNote.cholesterol} <span className="text-base">mg/dL</span>
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 text-sm font-semibold rounded-lg ${getStatusColor(
                          selectedNote.cholesterol_status
                        )}`}
                      >
                        {getStatusText(selectedNote.cholesterol_status)}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      <p>🟡 Rendah / Baik: {'<'} 200 mg/dL</p>
                      <p>🟢 Normal / Batas Atas: 200 – 239 mg/dL</p>
                      <p>🔴 Tinggi: {'>'} 240 mg/dL</p>
                    </div>
                  </div>
                )}

                {/* Blood Pressure */}
                {selectedNote.blood_pressure_systolic && selectedNote.blood_pressure_diastolic && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tekanan Darah</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedNote.blood_pressure_systolic}/
                          {selectedNote.blood_pressure_diastolic}{' '}
                          <span className="text-base">mmHg</span>
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 text-sm font-semibold rounded-lg ${getStatusColor(
                          selectedNote.blood_pressure_status
                        )}`}
                      >
                        {getStatusText(selectedNote.blood_pressure_status)}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      <p>🟡 Rendah: {'<'} 120/80 mmHg</p>
                      <p>🟢 Normal / Pra-hipertensi: 120–139 / 80–89 mmHg</p>
                      <p>🔴 Tinggi: {'>'} 140/90 mmHg (hipertensi)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              {selectedNote.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Catatan Tambahan</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.notes}</p>
                </div>
              )}

              {/* Warning if abnormal */}
              {hasAbnormalValues(selectedNote) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-600 mt-0.5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-1">
                        Perhatian Diperlukan
                      </h4>
                      <p className="text-sm text-red-700">
                        Pengguna ini memiliki nilai kesehatan yang tinggi. Disarankan untuk
                        melakukan pemeriksaan lebih lanjut atau konsultasi dengan tenaga medis.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthNotesReports;








