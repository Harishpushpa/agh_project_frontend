import React, { useState } from 'react';
import axios from 'axios';

const UploadPPT = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!file) return alert('Please select a file first!');
    const formData = new FormData();
    formData.append('pptFile', file);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`✅ ${res.data.message}`);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Upload failed'}`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload PowerPoint File</h2>
      <input
        type="file"
        accept=".ppt,.pptx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadPPT;
