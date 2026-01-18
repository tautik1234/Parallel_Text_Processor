import React, { useState, useEffect } from 'react';
import { historyAPI } from '../services/api';

interface HistoryRecord {
  id: string;
  filename: string;
  status: string;
  linesProcessed: number;
  sentimentScore: number;
  processedAt: string;
  fileSize?: string;
  snippet?: string;
}

// --- HELPER: Highlight Match ---
const HighlightMatch: React.FC<{ text: string; match: string }> = ({ text, match }) => {
  if (!match || !text) return <>{text}</>;
  
  const safeMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safeMatch})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === match.toLowerCase() ? (
          <span key={i} className="text-indigo-600 dark:text-green-400 font-bold underline decoration-2 decoration-indigo-500 dark:decoration-green-500 bg-indigo-50 dark:bg-green-900/30 px-1 rounded">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // --- 1. Load Data ---
  useEffect(() => {
    loadData(currentPage);
  }, [currentPage]);

  const loadData = async (page: number) => {
    setLoading(true);
    try {
      let response;
      if (searchQuery.trim()) {
        // Calls the updated API. If this line fails TS build, verify api.ts
        response = await historyAPI.searchHistory(searchQuery, page);
      } else {
        response = await historyAPI.getHistory(page);
      }

      const data = response.data as any;
      if (data.success) {
        const records = data.data.history || data.data.results || [];
        setHistory(records);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Handle Search Action ---
  const executeSearch = () => {
    // Reset to page 1. This triggers useEffect to fetch data.
    if (currentPage === 1) {
      loadData(1); 
    } else {
      setCurrentPage(1); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  // --- Actions ---
  const handleDownload = async (id: string, filename: string) => {
    try {
      await historyAPI.downloadReport(id, filename);
    } catch (err) {
      alert("Failed to download file");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      const response = await historyAPI.deleteRecord(id);
      if ((response.data as any).success) {
        setHistory(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div>
             <h1 className="text-2xl font-bold font-mono text-gray-900 dark:text-white uppercase tracking-tight">
               SYSTEM_LOGS
             </h1>
             <p className="text-sm font-mono text-gray-500 dark:text-slate-400 mt-1">
               // Tracking all processing activities
             </p>
           </div>
           
           {/* Search Bar (NO FORM TAG) */}
           <div className="flex w-full md:w-auto gap-2">
             <input 
               type="text" 
               placeholder="SEARCH_LOGS..." 
               className="flex-1 md:w-64 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded p-2 text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-green-500 outline-none transition-all placeholder-gray-400 dark:placeholder-slate-600" 
               value={searchQuery} 
               onChange={e => setSearchQuery(e.target.value)} 
               onKeyDown={handleKeyDown} 
             />
             <button 
               type="button" // Explicitly prevent form submission behavior
               onClick={executeSearch} 
               className="bg-indigo-600 dark:bg-green-600 hover:bg-indigo-700 dark:hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-mono font-bold uppercase tracking-wider transition-colors"
             >
               Search
             </button>
           </div>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm dark:shadow-[0_0_15px_rgba(74,222,128,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  {['File_Name', 'Status', 'Metrics', 'Actions'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-mono font-bold text-gray-500 dark:text-green-500/80 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                {loading ? (
                   <tr>
                     <td colSpan={4} className="px-6 py-8 text-center">
                       <div className="flex justify-center items-center gap-2 text-gray-500 dark:text-slate-400 font-mono">
                         <div className="w-2 h-2 bg-indigo-600 dark:bg-green-500 rounded-full animate-bounce"></div>
                         LOADING_DATA...
                       </div>
                     </td>
                   </tr>
                ) : history.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-slate-500 font-mono">
                            NO_LOGS_FOUND :: TRY_NEW_SEARCH
                        </td>
                    </tr>
                ) : (
                  history.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-green-400 transition-colors truncate max-w-xs">
                          {record.filename}
                        </div>
                        {record.snippet && searchQuery && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/80 p-3 rounded border-l-4 border-indigo-500 dark:border-green-500 font-sans italic leading-relaxed max-w-md">
                            "<HighlightMatch text={record.snippet} match={searchQuery} />"
                          </div>
                        )}
                        <div className="text-xs font-mono text-gray-400 dark:text-slate-600 mt-1">ID: {record.id.slice(-6)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${record.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-900/50' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/50'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs font-mono text-gray-500 dark:text-slate-400">
                          <span>LNs: <span className="text-gray-900 dark:text-white">{record.linesProcessed}</span></span>
                          <span>SCR: <span className={`${record.sentimentScore > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{record.sentimentScore?.toFixed(2)}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4 space-x-4 text-sm font-mono">
                          <button onClick={() => handleDownload(record.id, record.filename)} className="text-indigo-600 dark:text-green-500 hover:text-indigo-900 dark:hover:text-green-300 hover:underline transition-colors">DOWNLOAD</button>
                          <button onClick={() => handleDelete(record.id)} className="text-red-600 dark:text-red-500 hover:text-red-900 dark:hover:text-red-400 hover:underline transition-colors">DELETE</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded text-sm font-mono text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                &lt; PREV
              </button>
              <span className="text-xs font-mono text-gray-500 dark:text-slate-500">
                PAGE {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded text-sm font-mono text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                NEXT &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;