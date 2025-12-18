import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import 'react-quill/dist/quill.snow.css';
import PropTypes from 'prop-types';
import QuillEditor from './QuillEditor';
import api from '../../utils/api';

const MaterialEditor = ({ material = null, onSave, onCancel, type }) => {
  const quillRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    videoUrl: '',
    description: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (material) {
      setFormData({
        title: material.title || '',
        content: material.content || '',
        videoUrl: material.video_url || '',
        description: material.description || '',
        status: material.status || 'draft'
      });
    }
  }, [material]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        type,
        video_url: formData.videoUrl
      };

      if (material) {
        await api.put(`/materials/${material.id}`, payload);
      } else {
        await api.post('/materials', payload);
      }

      onSave();
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Gagal menyimpan materi');
    } finally {
      setLoading(false);
    }
  };

  const imageHandler = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    
    const url = prompt("Masukkan URL gambar:");
    
    if (url && url.trim()) {
      const range = quill.getSelection(true);
      if (range) {
        // Insert image
        quill.insertEmbed(range.index, "image", url, "user");
        
        // Add some space after image and position cursor
        quill.insertText(range.index + 1, "\n", "user");
        quill.setSelection(range.index + 2);
        
        // Force focus back to editor
        setTimeout(() => {
          quill.focus();
        }, 100);
      }
    }
  }, []);

  const linkHandler = useCallback((value) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    
    if (value) {
      const href = prompt('Masukkan URL link:');
      if (href && href.trim()) {
        quill.format('link', href);
      }
    } else {
      quill.format('link', false);
    }
  }, []);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
        link: linkHandler
      }
    },
  }), [imageHandler, linkHandler]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {material ? 'Edit' : 'Tambah'} {
            type === 'article' ? 'PerPoint' : 
            type === 'poster' ? 'Poster' :
            type === 'full' ? 'Video Full' : 
            type === 'part' ? 'Video Part' : 'Materi'
          }
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Judul
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Masukkan judul"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Masukkan deskripsi singkat"
          />
        </div>

        {type === 'article' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konten
              <span className="text-sm text-gray-500 ml-2">
                (Klik ikon gambar 🖼️ di toolbar untuk menambahkan gambar dari URL)
              </span>
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <QuillEditor
                ref={quillRef}
                theme="snow"
                value={formData.content}
                onChange={(value) => handleChange('content', value)}
                modules={quillModules}
                className="h-64"
                style={{ 
                  background: 'white',
                  minHeight: '256px'
                }}
                placeholder="Mulai menulis konten artikel Anda di sini..."
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              💡 Tips: Masukkan URL gambar dari domain terpercaya seperti Unsplash, Imgur, Cloudinary, atau URL dengan ekstensi gambar (.jpg, .png, .gif, dll.)
            </div>
          </div>
        ) : type === 'poster' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Poster (Gambar)
            </label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => handleChange('videoUrl', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/poster.jpg"
              required
            />
            {formData.videoUrl && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Poster
                </label>
                <div className="bg-gray-100 rounded-lg overflow-hidden p-4">
                  <img
                    src={formData.videoUrl}
                    alt="Poster preview"
                    className="w-full h-auto max-h-96 object-contain mx-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              💡 Tips: Masukkan URL gambar poster dari domain terpercaya seperti Unsplash, Imgur, Cloudinary, atau URL dengan ekstensi gambar (.jpg, .png, .gif, dll.)
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Video (YouTube/Embed)
            </label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => handleChange('videoUrl', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://www.youtube.com/embed/..."
              required
            />
            {formData.videoUrl && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Video
                </label>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={formData.videoUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title="Video preview"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

MaterialEditor.propTypes = {
  material: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    content: PropTypes.string,
    video_url: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['article', 'poster', 'full', 'part']).isRequired
};

export default MaterialEditor;
