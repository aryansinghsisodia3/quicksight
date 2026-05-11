import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Skeleton from './components/ui/Skeleton';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { GlobalProvider } from './contexts/GlobalContext';

const Home = lazy(() => import('./pages/Home'));
const ImageDetection = lazy(() => import('./pages/ImageDetection'));
const VideoDetection = lazy(() => import('./pages/VideoDetection'));
const WebcamDetection = lazy(() => import('./pages/WebcamDetection'));
const Analytics = lazy(() => import('./pages/Analytics'));

function LoadingFallback() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      <Skeleton className="mb-6 h-12 w-1/3" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GlobalProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="image" element={<ImageDetection />} />
                  <Route path="video" element={<VideoDetection />} />
                  <Route path="webcam" element={<WebcamDetection />} />
                  <Route path="analytics" element={<Analytics />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </GlobalProvider>
    </ThemeProvider>
  );
}
