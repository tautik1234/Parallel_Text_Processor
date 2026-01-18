import React, { useState, useEffect, useRef } from 'react';
import { dashboardAPI, textAPI, historyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext'; // RESTORED IMPORT
import type { JobResultData } from '../services/api';

const Dashboard: React.FC = () => {
  // RESTORED USER HOOK
  const { user } = useAuth();

  // Data State
  const [stats, setStats] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  
  // Job State
  const [jobStatus, setJobStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [jobResult, setJobResult] = useState<JobResultData | null>(null);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'polling' | 'completed'>('idle');
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0, failed: 0 });
  const [batchResults, setBatchResults] = useState<any[]>([]);
  
  // REMOVED: Unused 'batchInfo' state
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'upload'>('overview');

  const pollInterval = useRef<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
    return () => stopPolling();
  }, []);

  // --- POLLING LOGIC ---
  const startPolling = (id: string) => {
    setJobStatus('pending');
    pollInterval.current = window.setInterval(async () => {
      try {
        const response = await textAPI.getJobResults(id);
        const data = response.data;
        if (data.success && data.data) {
          if (data.data.status === 'completed') {
            stopPolling();
            setJobStatus('completed');
            setJobResult(data.data);
            fetchDashboardData();
          } else if (data.data.status === 'failed') {
            stopPolling();
            setJobStatus('failed');
            setUploadError('Processing failed.');
          }
        }
      } catch (error) { console.error(error); }
    }, 2000);
  };

  const startBatchPolling = (batchId: string) => {
    setBatchStatus('polling');
    pollInterval.current = window.setInterval(async () => {
      try {
        const statusRes = await textAPI.getBatchStatus(batchId);
        const { totalJobs, completed, failed, processing, pending } = statusRes.data.data;
        setBatchProgress({ completed, total: totalJobs, failed });

        if (processing === 0 && pending === 0) {
          stopPolling();
          const resultsRes = await textAPI.getBatchResults(batchId);
          if (resultsRes.data.success) {
            setBatchResults(resultsRes.data.data.files);
            setBatchStatus('completed');
            fetchDashboardData();
          }
        }
      } catch (error) { console.error(error); }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentJobs(5)
      ]);
      if ((statsRes.data as any)?.data) setStats((statsRes.data as any).data);
      if ((recentRes.data as any)?.data?.jobs) setRecentJobs((recentRes.data as any).data.jobs);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // --- HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
      setUploadError('');
      setJobResult(null);
      setBatchResults([]);
      setBatchStatus('idle');
      setJobStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploading(true);
    setUploadError('');
    try {
      if (selectedFiles.length > 1) {
        const response = await textAPI.processBatch(selectedFiles);
        if (response.data.success) {
          startBatchPolling(response.data.data.batchId);
        }
      } else {
        const response = await textAPI.uploadFile(selectedFiles[0]);
        if (response.data.success) {
          startPolling(response.data.data.jobId);
        }
      }
    } catch (error: any) {
      setUploadError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (jobResult) {
      try {
        await historyAPI.downloadReport(jobResult.jobId, jobResult.filename);
      } catch (e) { alert("Download failed."); }
    }
  };

  // --- HELPERS FOR UI ---
  const getProgressPercentage = () => {
    if (batchProgress.total === 0) return 0;
    return Math.round(((batchProgress.completed + batchProgress.failed) / batchProgress.total) * 100);
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600 dark:text-green-400';
    if (score < -0.3) return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  // --- RENDER ---
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-950 font-mono text-gray-600 dark:text-green-500">
      <div className="animate-pulse">INITIALIZING_SYSTEM...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-200 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
           <h1 className="text-3xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
             SYSTEM_DASHBOARD
           </h1>
           <p className="text-gray-500 dark:text-gray-400 font-mono text-sm mt-2">
             {/* Uses the user variable correctly now */}
             User: {user?.name || 'ADMIN'} | Status: ONLINE
           </p>
        </div>

        {/* The Card Container */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-[0_0_20px_rgba(74,222,128,0.05)] border border-gray-200 dark:border-slate-800 overflow-hidden min-h-[600px] transition-all">
          
          {/* Tabs - Terminal Style */}
          <div className="flex border-b border-gray-200 dark:border-slate-800">
             <button 
               onClick={() => setActiveTab('overview')} 
               className={`flex-1 py-4 font-mono text-sm font-bold tracking-wider uppercase transition-colors
                 ${activeTab === 'overview' 
                   ? 'bg-gray-50 dark:bg-slate-800/50 text-indigo-600 dark:text-green-400 border-b-2 border-indigo-600 dark:border-green-400' 
                   : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
             >
               ./Overview
             </button>
             <button 
               onClick={() => setActiveTab('upload')} 
               className={`flex-1 py-4 font-mono text-sm font-bold tracking-wider uppercase transition-colors
                 ${activeTab === 'upload' 
                   ? 'bg-gray-50 dark:bg-slate-800/50 text-indigo-600 dark:text-green-400 border-b-2 border-indigo-600 dark:border-green-400' 
                   : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
             >
               ./Process_Input
             </button>
          </div>

          <div className="p-6 md:p-8">
            {/* --- VIEW: OVERVIEW --- */}
            {activeTab === 'overview' && stats && (
              <div className="animate-fade-in space-y-8">
                 {/* Stats Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Files_Processed', value: stats.totalFilesProcessed },
                      { label: 'Lines_Analyzed', value: stats.totalLinesAnalyzed },
                      { label: 'Success_Rate', value: `${stats.successRate}%` },
                      { label: 'Avg_Sentiment', value: stats.averageSentiment?.toFixed(2), color: getSentimentColor(stats.averageSentiment) }
                    ].map((stat, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                        <div className="text-xs font-mono text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className={`text-2xl font-bold font-mono ${stat.color || 'text-gray-900 dark:text-white'}`}>{stat.value}</div>
                      </div>
                    ))}
                 </div>
                 
                 {/* Recent Activity Table */}
                 <div>
                    <h3 className="text-sm font-mono font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-4">Recent_Activity_Log</h3>
                    <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-mono font-medium text-gray-500 dark:text-slate-400 uppercase">File_Name</th>
                            <th className="px-6 py-3 text-left text-xs font-mono font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                           {recentJobs.map(job => (
                              <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                 <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-gray-300">{job.filename}</td>
                                 <td className="px-6 py-4">
                                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium
                                     ${job.status === 'completed' 
                                       ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                       : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'}`}>
                                     {job.status}
                                   </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {/* --- VIEW: UPLOAD --- */}
            {activeTab === 'upload' && (
              <div className="max-w-3xl mx-auto mt-4">
                 
                 {/* 1. IDLE STATE: Upload Box */}
                 {jobStatus === 'idle' && batchStatus === 'idle' && (
                   <div className="group border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-12 text-center hover:border-indigo-500 dark:hover:border-green-500 transition-colors cursor-pointer bg-gray-50 dark:bg-slate-800/30">
                      
                      <div className="mb-4 text-gray-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-green-500 transition-colors">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>

                      <h2 className="text-xl font-mono font-bold text-gray-700 dark:text-gray-200 mb-2">INITIATE_UPLOAD</h2>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 font-mono">Drag files or click to browse</p>

                      <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
                      <label htmlFor="file-upload" className="inline-block cursor-pointer bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-mono py-2 px-6 rounded hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                        Select Files
                      </label>
                      
                      {selectedFiles && selectedFiles.length > 0 && (
                        <div className="mt-8 text-left bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-4 rounded shadow-sm">
                          <p className="font-mono font-bold text-indigo-600 dark:text-green-400 text-xs uppercase mb-2">
                            Ready_To_Process ({selectedFiles.length})
                          </p>
                          <ul className="text-sm font-mono text-gray-600 dark:text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                            {Array.from(selectedFiles).slice(0, 5).map((f, i) => (
                              <li key={i} className="flex justify-between">
                                <span>{f.name}</span>
                                <span className="opacity-50">{(f.size / 1024).toFixed(1)} KB</span>
                              </li>
                            ))}
                            {selectedFiles.length > 5 && <li className="text-xs opacity-50">...and {selectedFiles.length - 5} more</li>}
                          </ul>
                        </div>
                      )}

                      {uploadError && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-mono border border-red-100 dark:border-red-900/50 rounded">
                          ERROR: {uploadError}
                        </div>
                      )}

                      {selectedFiles && (
                        <button 
                          onClick={handleUpload} 
                          disabled={uploading} 
                          className="mt-6 w-full bg-indigo-600 dark:bg-green-600 text-white font-mono font-bold py-3 px-4 rounded hover:bg-indigo-700 dark:hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider shadow-lg dark:shadow-green-900/50"
                        >
                          {uploading ? 'UPLOADING...' : 'EXECUTE_PROCESSING'}
                        </button>
                      )}
                   </div>
                 )}

                 {/* 2. POLLING STATE (Single or Batch) */}
                 {(jobStatus === 'pending' || batchStatus === 'polling') && (
                   <div className="text-center py-16">
                      <div className="relative inline-block w-20 h-20 mb-8">
                        <div className="absolute inset-0 border-4 border-gray-200 dark:border-slate-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-indigo-600 dark:border-green-500 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <h2 className="text-2xl font-mono font-bold text-gray-900 dark:text-white mb-2 animate-pulse">PROCESSING_DATA...</h2>
                      
                      {batchStatus === 'polling' && (
                        <div className="max-w-md mx-auto mt-4">
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                            <div 
                              className="bg-indigo-600 dark:bg-green-500 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${getProgressPercentage()}%` }}
                            ></div>
                          </div>
                          <p className="text-sm font-mono text-gray-500 dark:text-slate-400">
                            Completed: {batchProgress.completed}/{batchProgress.total} 
                            {batchProgress.failed > 0 && <span className="text-red-500 ml-2">({batchProgress.failed} ERR)</span>}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-gray-500 dark:text-gray-500 mt-4 font-mono text-xs">AI Models Active | Do not close window</p>
                   </div>
                 )}

                 {/* 3. RESULTS STATE (Batch) */}
                 {batchStatus === 'completed' && (
                   <div className="bg-white dark:bg-slate-900 border-l-4 border-green-500 rounded shadow p-6">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-xl font-bold font-mono text-gray-900 dark:text-white">BATCH_COMPLETE</h2>
                          <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded mt-1 inline-block">
                             EMAIL_DISPATCHED
                          </span>
                        </div>
                        <button onClick={() => { setBatchStatus('idle'); setSelectedFiles(null); }} className="text-sm font-mono text-gray-500 hover:text-indigo-600 dark:hover:text-green-400 underline">
                          NEW_JOB
                        </button>
                     </div>
                     <div className="overflow-x-auto">
                       <table className="min-w-full text-left text-sm font-mono">
                          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                            <tr>
                              <th className="px-4 py-2">FILE</th>
                              <th className="px-4 py-2">LINES</th>
                              <th className="px-4 py-2">SCORE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-gray-300">
                            {batchResults.map((res: any, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-3 truncate max-w-[200px]">{res.filename || res.sourceFile}</td>
                                <td className="px-4 py-3">{res.totalLines}</td>
                                <td className={`px-4 py-3 font-bold ${getSentimentColor(res.averageSentiment)}`}>
                                  {res.averageSentiment?.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                       </table>
                     </div>
                   </div>
                 )}

                 {/* 4. RESULTS STATE (Single) */}
                 {jobStatus === 'completed' && jobResult && (
                   <div className="bg-white dark:bg-slate-900 border border-green-500/20 rounded-lg shadow-lg overflow-hidden">
                      <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-100 dark:border-green-900/30 flex justify-between items-center">
                         <div>
                           <h2 className="text-lg font-bold font-mono text-green-800 dark:text-green-400">ANALYSIS_SUCCESS</h2>
                           <span className="text-[10px] font-mono uppercase text-green-600 dark:text-green-500 tracking-wider">Report sent to email</span>
                         </div>
                         <button onClick={() => { setJobStatus('idle'); setSelectedFiles(null); }} className="text-xs font-mono text-gray-500 hover:text-gray-900 dark:hover:text-white underline">
                           RESET
                         </button>
                      </div>
                      
                      <div className="p-6 grid grid-cols-3 gap-4">
                         {[
                           { label: 'SENTIMENT', val: jobResult.statistics.averageSentiment.toFixed(2), color: getSentimentColor(jobResult.statistics.averageSentiment) },
                           { label: 'LINES', val: jobResult.statistics.totalLines, color: 'text-gray-900 dark:text-white' },
                           { label: 'TIME (s)', val: (jobResult.statistics.processingTimeMs / 1000).toFixed(2), color: 'text-gray-900 dark:text-white' },
                         ].map((item, i) => (
                           <div key={i} className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded">
                              <div className="text-[10px] font-mono text-gray-400 dark:text-slate-500 uppercase mb-1">{item.label}</div>
                              <div className={`text-2xl font-mono font-bold ${item.color}`}>{item.val}</div>
                           </div>
                         ))}
                      </div>

                      <div className="px-6 pb-6">
                         <button 
                           onClick={handleDownload} 
                           className="w-full bg-indigo-600 dark:bg-green-600 hover:bg-indigo-700 dark:hover:bg-green-500 text-white font-mono font-bold py-3 rounded transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           DOWNLOAD_CSV_REPORT
                         </button>
                      </div>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;