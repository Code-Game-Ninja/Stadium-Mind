'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Panel, PanelHeader, Spinner, EmptyState, StatusChip } from '@/components/ui';
import { FileText, Plus, Inbox } from 'lucide-react';
import type { MatchProposal } from '@stadiummind/shared';
import { api } from '@/lib/api';

export function MatchProposalPanel() {
  const [proposals, setProposals] = useState<MatchProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [requiredVolunteers, setRequiredVolunteers] = useState('');

  useEffect(() => {
    fetchProposals();
  }, []);

  async function fetchProposals() {
    try {
      const data = await api.getProposals();
      setProposals(data.proposals || []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const proposal: MatchProposal = {
        id: `prop-${Date.now()}`,
        date: new Date(date).toISOString(),
        homeTeam,
        awayTeam,
        requiredVolunteers: parseInt(requiredVolunteers, 10),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await api.createProposal(proposal);

      toast.success('Proposal created successfully');
      setShowForm(false);

      // Reset form
      setDate('');
      setHomeTeam('');
      setAwayTeam('');
      setRequiredVolunteers('');

      fetchProposals();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Spinner label="Loading proposals..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-fast max-w-5xl">
      <Panel className="bg-white">
        <PanelHeader 
          title="Match Proposals" 
          icon={<FileText className="h-4 w-4 text-ink" />} 
          action={
            <button 
              onClick={() => setShowForm(!showForm)}
              className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5"
            >
              <Plus className="h-3 w-3" /> New Proposal
            </button>
          }
        />
        
        {showForm && (
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Create New Proposal</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                  <input 
                    type="date" 
                    required 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-lime focus:ring-1 focus:ring-lime"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Required Volunteers</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={requiredVolunteers}
                    onChange={e => setRequiredVolunteers(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-lime focus:ring-1 focus:ring-lime"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Home Team</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Real Madrid"
                    value={homeTeam}
                    onChange={e => setHomeTeam(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-lime focus:ring-1 focus:ring-lime"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Away Team</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Barcelona"
                    value={awayTeam}
                    onChange={e => setAwayTeam(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-lime focus:ring-1 focus:ring-lime"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary text-xs px-4 py-2">Submit Proposal</button>
              </div>
            </form>
          </div>
        )}

        <div className="p-4 bg-slate-50/15">
          {proposals.length === 0 ? (
            <EmptyState icon={<Inbox className="h-8 w-8 text-slate-300" />}>
              No match proposals found. Create one above.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {proposals.map(p => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusChip tone={p.status === 'pending' ? 'amber' : p.status === 'approved' ? 'green' : 'red'}>
                        {p.status.toUpperCase()}
                      </StatusChip>
                      <span className="text-xs font-bold text-slate-500">
                        {new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-800">
                      {p.homeTeam} vs {p.awayTeam}
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                      Required Volunteers: {p.requiredVolunteers}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusChip tone="slate">ID: {p.id.split('-')[1]}</StatusChip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
