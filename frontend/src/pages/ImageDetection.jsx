import React, { useState } from 'react';
import { UploadCloud, Loader2, Download } from 'lucide-react';
import api from '../api';
import Card from '../components/ui/Card';
import { useGlobalState } from '../contexts/GlobalContext';
import { compressImage } from '../utils/imageCompressor';
import { useToast } from '../contexts/ToastContext';

export default function ImageDetection() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const { setGlobalCounts } = useGlobalState();
  const { addToast } = useToast();

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setResultUrl('');
    setGlobalCounts({});
    
    try {
      addToast('Compressing image payload...', 'info');
      // Compress to max 1280px at 85% quality to save bandwidth without reducing YOLO accuracy
      const compressedFile = await compressImage(file, 0.85, 1280); 
      
      const formData = new FormData();
      formData.append('file', compressedFile);
      
      const response = await api.post('/detect/image', formData);
      if (response.data.success) {
        setResultUrl(`${api.defaults.baseURL}${response.data.output_url}`);
        setGlobalCounts(response.data.counts || {});
        addToast('Image analyzed successfully!', 'success');
      } else {
        throw new Error(response.data.error || 'Server error tracking request');
      }
    } catch (err) {
      addToast(err.response?.data?.error || err.message || 'Detection extraction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `yolov8_image_export_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Download initiated!', 'success');
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto flex flex-col gap-6">
      <Card className="flex flex-col gap-6">
        
        <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all p-12 rounded-3xl text-center group">
          <div className="bg-slate-200 dark:bg-slate-700/50 group-hover:bg-blue-500/20 p-4 rounded-full mb-4 transition-colors">
            <UploadCloud className="h-10 w-10 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="text-slate-700 dark:text-slate-300 font-semibold text-lg mb-1">Select an Image</span>
          <span className="text-slate-500 dark:text-slate-500 text-sm">PNG, JPG, JPEG</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            setFile(e.target.files[0]);
            setResultUrl('');
          }} />
        </label>

        {file && <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mx-auto">Selected static payload: <span className="font-mono text-blue-500">{file.name}</span></div>}

        <button 
          onClick={handleProcess} 
          disabled={!file || loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none flex justify-center items-center gap-2"
        >
          {loading ? <><Loader2 className="animate-spin" size={24}/> Uploading & Processing...</> : 'Process with YOLOv8'}
        </button>

      </Card>

      {resultUrl && !loading && (
        <Card className="p-0 overflow-hidden shadow-2xl shadow-blue-900/10">
          <div className="bg-slate-100 dark:bg-[#111] text-slate-500 dark:text-slate-400 text-xs font-mono p-3 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
            <span>Result Output Buffer</span>
            <button onClick={handleDownload} className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-md transition-colors border border-slate-200 dark:border-slate-700">
              <Download size={14} /> Download Asset
            </button>
          </div>
          <img src={resultUrl} alt="Detection Result" className="w-full h-auto object-contain bg-slate-50 dark:bg-[#050505] max-h-[70vh] block" />
        </Card>
      )}

    </div>
  );
}
