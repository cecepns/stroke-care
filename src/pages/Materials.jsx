import { useState, useEffect } from 'react';
import MaterialEditor from '../components/Materials/MaterialEditor';
import api from '../utils/api';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialType, setMaterialType] = useState('article');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = (type) => {
    setMaterialType(type);
    setEditingMaterial(null);
    setShowEditor(true);
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setMaterialType(material.type);
    setShowEditor(true);
  };

  const handleSaveMaterial = () => {
    setShowEditor(false);
    setEditingMaterial(null);
    fetchMaterials();
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus materi ini?')) {
      try {
        await api.delete(`/materials/${id}`);
        fetchMaterials();
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('Gagal menghapus materi');
      }
    }
  };

  const filteredMaterials = materials.filter(material => {
    if (activeTab === 'all') return true;
    return material.type === activeTab;
  });

  const getTypeLabel = (type) => {
    switch (type) {
      case 'article': return 'PerPoint';
      case 'poster': return 'Poster';
      case 'full': return 'Video Full';
      case 'part': return 'Video Part';
      default: return type;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'article':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'poster':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'full':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'part':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (showEditor) {
    return (
      <MaterialEditor
        material={editingMaterial}
        type={materialType}
        onSave={handleSaveMaterial}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Materi</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleCreateMaterial('article')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            + PerPoint
          </button>
          <button
            onClick={() => handleCreateMaterial('poster')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            + Poster
          </button>
          <button
            onClick={() => handleCreateMaterial('full')}
            className="bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700 transition-colors text-sm"
          >
            + Video Full
          </button>
          <button
            onClick={() => handleCreateMaterial('part')}
            className="bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors text-sm"
          >
            + Video Part
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'article', 'poster', 'full', 'part'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'all' ? 'Semua' : getTypeLabel(tab)}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-500">
                    {getTypeIcon(material.type)}
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {getTypeLabel(material.type)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditMaterial(material)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {material.title}
              </h3>
              
              {material.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {material.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  material.status === 'published' 
                    ? 'bg-secondary-100 text-secondary-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {material.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <span>
                  {new Date(material.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredMaterials.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada materi</h3>
          <p className="text-gray-500 mb-6">Mulai dengan membuat artikel atau video pembelajaran pertama Anda.</p>
        </div>
      )}
    </div>
  );
};

export default Materials;