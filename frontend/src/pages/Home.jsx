import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageIcon, Video, Camera, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const options = [
    {
      path: '/image',
      title: 'Image Detection',
      desc: 'Upload images and run YOLOv8 inference with instant bounding boxes and class labels.',
      icon: ImageIcon,
      accent: 'from-blue-500 to-blue-600',
      ring: 'hover:ring-2 hover:ring-blue-500/40',
    },
    {
      path: '/video',
      title: 'Video Detection',
      desc: 'Process full videos frame-by-frame with aggregate counts and exported results.',
      icon: Video,
      accent: 'from-emerald-500 to-emerald-600',
      ring: 'hover:ring-2 hover:ring-emerald-500/40',
    },
    {
      path: '/webcam',
      title: 'Webcam',
      desc: 'Use your browser camera (with permission); frames are sent to the API for live overlays.',
      icon: Camera,
      accent: 'from-sky-500 to-blue-600',
      ring: 'hover:ring-2 hover:ring-sky-500/40',
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center space-y-10 py-4">
      <div className="max-w-2xl space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
          AI Object Detection
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Choose a module to analyze images, video files, or your live camera with a single click.
        </p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.path}
              type="button"
              onClick={() => navigate(opt.path)}
              className={`group relative flex flex-col rounded-2xl bg-gray-900 p-6 text-left shadow-lg ring-1 ring-white/5 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-900 ${opt.ring}`}
            >
              <div
                className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${opt.accent} text-white shadow-lg transition-transform duration-300 group-hover:scale-105`}
              >
                <Icon size={28} strokeWidth={2} />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-white">{opt.title}</h2>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-400">{opt.desc}</p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition-colors group-hover:text-blue-300">
                Open
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
