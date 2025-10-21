import React, { useEffect, useState } from 'react';
import { FileText, Download, Trash2, Eye, AlertCircle, Loader2, X } from 'lucide-react';

const PPTViewer = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/files`);
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      const res = await fetch(`${API_BASE}/files/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete file');
      
      // Close preview if deleted file is currently being viewed
      if (selectedFile?._id === id) {
        handleClosePreview();
      }
      
      fetchFiles();
    } catch (err) {
      alert('Failed to delete file: ' + err.message);
      console.error('Failed to delete:', err);
    }
  };

  const handleView = async (file) => {
    setViewLoading(true);
    setSelectedFile(file);
    
    try {
      const res = await fetch(`${API_BASE}/files/${file._id}`);
      if (!res.ok) throw new Error('Failed to fetch file');
      
      const blob = await res.blob();
      
      // Clean up previous blob URL
      if (previewBlob) {
        URL.revokeObjectURL(previewBlob);
      }
      
      const blobUrl = URL.createObjectURL(blob);
      setPreviewBlob(blobUrl);
    } catch (err) {
      alert('Failed to load preview: ' + err.message);
      console.error('Failed to view file:', err);
      setSelectedFile(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewBlob) {
      URL.revokeObjectURL(previewBlob);
    }
    setPreviewBlob(null);
    setSelectedFile(null);
  };

  const handleDownloadPreview = () => {
    if (!previewBlob || !selectedFile) return;
    
    const a = document.createElement('a');
    a.href = previewBlob;
    a.download = selectedFile.originalname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    fetchFiles();
    
    // Cleanup on unmount
    return () => {
      if (previewBlob) {
        URL.revokeObjectURL(previewBlob);
      }
    };
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* File List Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Uploaded Files</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading files...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">Error: {error}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No files uploaded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-indigo-50 border-b-2 border-indigo-200">
                    <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-gray-700">Filename</th>
                    <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-gray-700">Size</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-semibold text-gray-700">Uploaded</th>
                    <th className="px-4 md:px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <span className="truncate max-w-xs">{f.originalname}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-600">{formatFileSize(f.size)}</td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                        {new Date(f.uploadDate).toLocaleString()}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleView(f)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                            disabled={viewLoading}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          <a
                            href={`${API_BASE}/download/${f._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download</span>
                          </a>
                          <button
                            onClick={() => handleDelete(f._id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {selectedFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-800 truncate">{selectedFile.originalname}</h3>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  title="Close"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-hidden p-4 bg-gray-50">
                {viewLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <span className="ml-3 text-gray-600">Loading preview...</span>
                  </div>
                ) : previewBlob ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4">
                    <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                      <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                      <h4 className="text-xl font-bold text-gray-800 mb-2">Preview Ready</h4>
                      <p className="text-gray-600 mb-6">
                        PowerPoint files cannot be previewed directly in the browser.
                      </p>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={handleDownloadPreview}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                        >
                          <Download className="w-5 h-5" />
                          Download to View
                        </button>
                        <a
                          href={`${API_BASE}/download/${selectedFile._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                        >
                          <Download className="w-5 h-5" />
                          Open in New Tab
                        </a>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        Open with Microsoft PowerPoint or compatible software
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-gray-600">Failed to load preview</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <button
                  onClick={handleClosePreview}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PPTViewer;