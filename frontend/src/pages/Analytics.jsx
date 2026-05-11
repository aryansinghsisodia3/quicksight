import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from '../components/ui/Card';
import { useGlobalState } from '../contexts/GlobalContext';

export default function Analytics() {
  const { globalCounts } = useGlobalState();

  const data = useMemo(() => {
    // Transform struct and sort strictly highest first
    const entries = Object.entries(globalCounts || {}).map(([name, count]) => ({ name, count }));
    return entries.sort((a, b) => b.count - a.count);
  }, [globalCounts]);

  const totalObjects = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);

  const topClass = data.length > 0 ? data[0] : null;

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-500 max-w-7xl mx-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-center bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <span className="text-slate-500 dark:text-slate-400 font-bold mb-2 uppercase tracking-wider text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Total Detected Objects
          </span>
          <span className="text-6xl font-black text-blue-600 dark:text-blue-400">{totalObjects}</span>
        </Card>
        
        <Card className="flex flex-col justify-center bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <span className="text-slate-500 dark:text-slate-400 font-bold mb-2 uppercase tracking-wider text-sm flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Predominant Class Aggregate
          </span>
          <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 capitalize">
            {topClass ? `${topClass.name} (${topClass.count})` : 'Awaiting Metrics'}
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <Card className="lg:col-span-2 shadow-lg">
          <h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Inference Class Distribution</h3>
          {data.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">No payload structures processed recently. Run a detection first to map data limits.</div>
          ) : (
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data.map((entry, index) => (
                      // Apply intense coloration natively to max element mapping
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#475569'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
           <h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Distribution Counts</h3>
           {data.length === 0 ? (
             <p className="text-slate-500 dark:text-slate-400 text-sm">Upload media to visually populate this hierarchy metrics board.</p>
           ) : (
             <div className="flex flex-col gap-3 pr-2 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
               {data.map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                   <span className="capitalize font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                   <span className={`px-2 py-1 rounded text-xs font-bold ${i === 0 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                     {item.count} items
                   </span>
                 </div>
               ))}
             </div>
           )}
        </Card>

      </div>

    </div>
  );
}
