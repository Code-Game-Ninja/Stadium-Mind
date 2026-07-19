import React, { useState } from 'react';
import { UserCircle2, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useMatchSnapshot } from '@/lib/useSocket';
import type { Volunteer } from '@stadiummind/shared';

export function VolunteerManager({ matchId }: { matchId: string }) {
  const { snapshot } = useMatchSnapshot(matchId);
  
  // Optimistic UI state for capacity
  const [localCapacity, setLocalCapacity] = useState<number | null>(null);

  if (!snapshot) {
    return <div className="p-8 text-center text-slate-500">Loading volunteers...</div>;
  }

  const volunteers = snapshot.volunteers || [];
  const capacity = localCapacity !== null ? localCapacity : (snapshot.volunteerCapacity ?? 100);

  const handleUpdateCapacity = async (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setLocalCapacity(num);
      try {
        await api.setVolunteerCapacity(matchId, num);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUpdateStatus = async (id: string, applicationStatus: 'approved' | 'rejected') => {
    try {
      await api.updateVolunteer(id, { matchId, applicationStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateZone = async (id: string, assignedZoneCode: string) => {
    try {
      await api.updateVolunteer(id, { matchId, assignedZoneCode });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-signal-blue/10 to-signal-blue/5 text-signal-blue border border-signal-blue/20 shadow-sm flex items-center justify-center">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">Volunteer Management</h2>
            <p className="text-sm font-medium text-slate-500">Approve applications and assign volunteers to stadium zones.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm shrink-0">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Max Capacity</label>
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
            <button 
              onClick={() => handleUpdateCapacity((capacity - 1).toString())}
              className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors font-mono font-bold"
            >-</button>
            <input 
              type="number"
              value={capacity}
              onChange={(e) => handleUpdateCapacity(e.target.value)}
              className="w-12 h-7 text-center text-sm font-bold bg-transparent border-none p-0 focus:ring-0 text-slate-800"
            />
            <button 
              onClick={() => handleUpdateCapacity((capacity + 1).toString())}
              className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors font-mono font-bold"
            >+</button>
          </div>
        </div>
      </div>
      
      {volunteers.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-slate-500 font-medium">No volunteers or applications yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {volunteers.map((v: Volunteer) => (
            <div 
              key={v.id} 
              className={`group p-5 border rounded-2xl flex flex-col gap-4 transition-all hover:shadow-md ${
                v.applicationStatus === 'pending' ? 'bg-amber-50/50 border-amber-200/60' : 
                v.applicationStatus === 'approved' ? 'bg-white border-slate-200' : 
                'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-slate-800 text-base">{v.displayName}</div>
                  <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full ${
                    v.applicationStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 
                    v.applicationStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {v.applicationStatus}
                  </span>
                </div>
                {v.email && (
                  <div className="text-xs text-slate-500 font-mono bg-slate-100/50 rounded py-1 px-2 inline-block border border-slate-200/50">{v.email}</div>
                )}
                
                {v.applicationStatus === 'approved' && (
                  <div className="mt-4 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned Zone</label>
                    </div>
                    <select 
                      value={v.assignedZoneCode || ''}
                      onChange={(e) => handleUpdateZone(v.id, e.target.value)}
                      className="input py-1.5 px-3 text-sm font-semibold w-full bg-white shadow-sm"
                    >
                      <option value="" disabled>Select zone...</option>
                      {snapshot.zones.map(z => (
                        <option key={z.code} value={z.code}>
                          {z.name} ({z.occupancy}% full)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-auto pt-2">
                {v.applicationStatus !== 'approved' && (
                  <button 
                    onClick={() => handleUpdateStatus(v.id, 'approved')}
                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 text-xs font-bold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Approve
                  </button>
                )}
                {v.applicationStatus !== 'rejected' && (
                  <button 
                    onClick={() => handleUpdateStatus(v.id, 'rejected')}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 text-xs font-bold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
