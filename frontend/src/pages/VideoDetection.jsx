import React, { useState } from 'react';
import { UploadCloud, Loader2, Download } from 'lucide-react';
import api from '../api';
import Card from '../components/ui/Card';
import { useGlobalState } from '../contexts/GlobalContext';
import { useToast } from '../contexts/ToastContext';

export default function VideoDetection() {
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
      addToast('Uploading video stream...', 'info');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/detect/video', formData);
      if (response.data.success) {
        const out = response.data.output_url || '';
        setResultUrl(
          out.startsWith('http://') || out.startsWith('https://')
            ? out
            : `${api.defaults.baseURL}${out}`
        );
        setGlobalCounts(response.data.counts || {});
        addToast('Video analyzed across all frames!', 'success');
      } else {
        throw new Error(response.data.error || 'Server processing error');
      }
    } catch (err) {
      addToast(err.response?.data?.error || err.message || 'Detection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `yolov8_video_export_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Download initiated!', 'success');
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto flex flex-col gap-6">
      <Card className="flex flex-col gap-6">
        
        <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all p-12 rounded-3xl text-center group">
          <div className="bg-slate-200 dark:bg-slate-700/50 group-hover:bg-emerald-500/20 p-4 rounded-full mb-4 transition-colors">
            <UploadCloud className="h-10 w-10 text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </div>
          <span className="text-slate-700 dark:text-slate-300 font-semibold text-lg mb-1">Select a Video</span>
          <span className="text-sm text-slate-500 dark:text-slate-500">MP4, AVI, MOV</span>
          <input type="file" accept="video/*" className="hidden" onChange={(e) => {
            setFile(e.target.files[0]);
            setResultUrl('');
          }} />
        </label>

        {file && <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mx-auto">Selected payload: <span className="font-mono text-emerald-500">{file.name}</span></div>}

        <button 
          onClick={handleProcess} 
          disabled={!file || loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none flex justify-center items-center gap-2"
        >
          {loading ? <><Loader2 className="animate-spin" size={24}/> Processing Inference Stack (takes a minute)...</> : 'Process Video Array'}
        </button>

      </Card>

      {resultUrl && !loading && (
        <Card className="p-0 overflow-hidden shadow-2xl shadow-emerald-900/10">
          <div className="bg-slate-100 dark:bg-[#111] text-slate-500 dark:text-slate-400 text-xs font-mono p-3 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
            <span>Aggregated Video Output</span>
            <button onClick={handleDownload} className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-md transition-colors border border-slate-200 dark:border-slate-700">
              <Download size={14} /> Extract Video
            </button>
          </div>
          <video src={resultUrl} controls autoPlay loop className="w-full h-auto max-h-[70vh] bg-slate-50 dark:bg-[#050505] block" />
        </Card>
      )}

    </div>
  );
}
