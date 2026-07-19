'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, SIMULATION_SCENARIOS, type Incident, type Recommendation, type MerchandiseItem } from '@stadiummind/shared';
import { X, ShieldAlert, CloudRain, Users, TrainFront, HeartPulse, PlugZap, Baby, AlertTriangle, ArrowRight, ClipboardCheck } from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

interface BroadcastAlert {
  id: string;
  type: 'scenario' | 'incident';
  title: string;
  message: string;
  precautions: string[];
  severity: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
}

export function AlertBroadcast() {
  const pathname = usePathname();
  const [activeAlerts, setActiveAlerts] = useState<BroadcastAlert[]>([]);
  const [matchId, setMatchId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Helper to extract matchId from URL path (e.g. /match/123/explore)
  const getMatchIdFromPath = (path: string) => {
    const parts = path.split('/');
    const matchIdx = parts.indexOf('match');
    if (matchIdx !== -1 && parts[matchIdx + 1]) {
      return parts[matchIdx + 1];
    }
    return null;
  };

  // Sync active matchId from URL or localStorage
  const syncMatchId = () => {
    const fromPath = getMatchIdFromPath(pathname);
    if (fromPath) {
      setMatchId(fromPath);
      return;
    }
    if (typeof window !== 'undefined') {
      const fromStorage = window.localStorage.getItem('stadiummind:active_match_id');
      if (fromStorage) {
        setMatchId(fromStorage);
      }
    }
  };

  useEffect(() => {
    syncMatchId();

    // Listen to custom match change events from dropdowns
    if (typeof window !== 'undefined') {
      const handler = () => syncMatchId();
      window.addEventListener('stadiummind:match_changed', handler);
      return () => window.removeEventListener('stadiummind:match_changed', handler);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!matchId) return;

    // Connect socket
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit(SOCKET_EVENTS.joinMatch, matchId);
    });

    // Listen to simulationScenarioApplied
    socket.on(SOCKET_EVENTS.simulationApplied, (data: { scenario: string; incident?: Incident; recommendation?: Recommendation }) => {
      const alert = mapScenarioToAlert(data.scenario, data.incident, data.recommendation);
      if (alert) {
        setActiveAlerts((prev) => [alert, ...prev].slice(0, 3)); // Keep last 3 alerts
        setTimeout(() => {
          setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
        }, 10000);
      }
    });

    // Listen to new incidents (e.g. reported by volunteer)
    socket.on(SOCKET_EVENTS.incidentNew, (data: { incident: Incident }) => {
      const alert = mapIncidentToAlert(data.incident);
      if (alert) {
        setActiveAlerts((prev) => [alert, ...prev].slice(0, 3));
        setTimeout(() => {
          setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
        }, 10000);
      }
    });

    // Listen to merchandise restock
    socket.on(SOCKET_EVENTS.merchandiseRestock, (data: { item: MerchandiseItem }) => {
      const alert: BroadcastAlert = {
        id: `merch-${data.item.id}-${Date.now()}`,
        type: 'scenario',
        title: 'Back in Stock!',
        message: `${data.item.name} is now back in stock!`,
        severity: 'success',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        precautions: data.item.isExclusive && data.item.exclusiveShops 
          ? [`Only available at: ${data.item.exclusiveShops.join(', ')}`]
          : ['Available at all merchandise stores.'],
      };
      
      setActiveAlerts((prev) => [alert, ...prev].slice(0, 3));
      setTimeout(() => {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }, 10000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  const mapScenarioToAlert = (scenario: string, incident?: Incident, rec?: Recommendation): BroadcastAlert | null => {
    const id = `${scenario}-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    switch (scenario) {
      case 'rain_starts':
        return {
          id,
          type: 'scenario',
          title: 'Weather Alert: Rain is appearing!',
          message: 'Rain has started. Entry zones are experiencing slippery steps and slower scanning.',
          severity: 'warning',
          timestamp,
          precautions: [
            'Open all covered queue lanes at Gate 4 and Gate 5.',
            'Place wet-floor caution signage at escalators and entryways.',
            'Advise fans to take covered alternate routes. GATE-5 has covered paths.',
          ],
        };
      case 'increase_crowd':
        return {
          id,
          type: 'scenario',
          title: 'Crowd Surge Alert: Gate 4 Congestion!',
          message: 'Arriving crowd surge has pushed Gate 4 occupancy to critical level.',
          severity: 'critical',
          timestamp,
          precautions: [
            'Divert new arrivals to Gate 5 (current wait: under 2 minutes).',
            'Update digital direction boards to display alternate entry routes.',
            'Dispatch 3 additional staff members to Gate 4 to manage lines.',
          ],
        };
      case 'metro_delay':
        return {
          id,
          type: 'scenario',
          title: 'Transit Alert: Metro Line Delay!',
          message: 'Transit delays at Metro Exit 2. Sudden arrival spike expected in 15 minutes.',
          severity: 'warning',
          timestamp,
          precautions: [
            'Keep overflow parking open and active.',
            'Station transport volunteers at Metro Exit 2 to guide fans to shuttle buses.',
            'Pre-stage gate scanning staff to receive the sudden arrival rush.',
          ],
        };
      case 'medical_emergency':
        return {
          id,
          type: 'scenario',
          title: 'Medical Alert: Incident in Section B!',
          message: 'Medical issue reported. Nearest medical team dispatched.',
          severity: 'critical',
          timestamp,
          precautions: [
            'Clear the access corridor between Section B and Medical Point 1.',
            'Place nearby volunteers on standby to assist with crowd management.',
            'Direct emergency vehicles to South Gate Entrance.',
          ],
        };
      case 'power_issue':
        return {
          id,
          type: 'scenario',
          title: 'System Alert: Power Issue!',
          message: 'Local power outage detected. Backup generators activated.',
          severity: 'critical',
          timestamp,
          precautions: [
            'Switch Gate 4 ticket turnstiles to auxiliary battery power.',
            'Station volunteers with flashlights at dark corridor exits.',
            'Acknowledge electrical team work order.',
          ],
        };
      case 'lost_child':
        return {
          id,
          type: 'scenario',
          title: 'Security Alert: Lost Child!',
          message: 'Unaccompanied minor reported near Gate 4. Parent at help point.',
          severity: 'critical',
          timestamp,
          precautions: [
            'Deploy security personnel to verify child description at all perimeter gates.',
            'Check live CCTV feeds for Gate 4 and surrounding corridors.',
            'Keep parent accompanied at Central Help Point.',
          ],
        };
      default:
        // Generic fallback for simulation
        const label = SIMULATION_SCENARIOS.find(s => s.key === scenario)?.label || scenario;
        return {
          id,
          type: 'scenario',
          title: `Simulation: ${label} Activated`,
          message: incident?.description || rec?.action || 'State updated.',
          severity: 'warning',
          timestamp,
          precautions: rec ? [rec.action, rec.expectedOutcome] : ['Follow standard operating procedures.'],
        };
    }
  };

  const mapIncidentToAlert = (incident: Incident): BroadcastAlert | null => {
    const id = `incident-${incident.id}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Ignore resolved incidents
    if (incident.status === 'resolved') return null;

    let title = 'Incident Reported!';
    let precautions: string[] = ['Notify supervisor if situation escalates.', 'Update incident log once resolved.'];

    if (incident.type === 'lost_child') {
      title = '🚨 Lost Child Alert!';
      precautions = [
        'Deploy security staff to match description at all gates.',
        'Check CCTV coverage around the reporting location.',
        'Escalate immediately if not located in 15 minutes.',
      ];
    } else if (incident.type === 'medical') {
      title = '🚑 Medical Incident!';
      precautions = [
        'Keep access corridors clear for responders.',
        'Comfort the patient and bystanders; avoid crowded build-up.',
      ];
    } else if (incident.type === 'lost_item') {
      title = '🎒 Lost Item Logged';
      precautions = [
        'Verify if description matches items in storage.',
        'Log item receipt at the central lost-and-found locker.',
      ];
    }

    return {
      id,
      type: 'incident',
      title,
      message: `${incident.description} at ${incident.locationCode} (P${incident.priority})`,
      severity: incident.priority >= 4 ? 'critical' : 'warning',
      timestamp,
      precautions,
    };
  };

  const removeAlert = (id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] w-full max-w-md max-h-[85vh] overflow-y-auto no-scrollbar space-y-3 pointer-events-none p-2">
      {activeAlerts.slice(0, 5).map((alert) => {
        const isCritical = alert.severity === 'critical';
        const isWarning = alert.severity === 'warning';

        return (
          <div
            key={alert.id}
            className={`pointer-events-auto animate-slide-in flex flex-col rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
              isCritical
                ? 'border-red-200 bg-red-50/95 text-red-900 shadow-red-100'
                : alert.severity === 'success'
                ? 'border-green-200 bg-green-50/95 text-green-900 shadow-green-100'
                : isWarning
                ? 'border-amber-200 bg-amber-50/95 text-amber-900 shadow-amber-100'
                : 'border-slate-200 bg-white/95 text-slate-800 shadow-slate-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {isCritical ? (
                  <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse animate-duration-1000" />
                ) : alert.severity === 'success' ? (
                  <ClipboardCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 animate-pulse animate-duration-1500" />
                )}
                <span className="text-sm font-extrabold uppercase tracking-wide">
                  {alert.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold opacity-60">{alert.timestamp}</span>
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="rounded-full p-1 hover:bg-black/5 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p className="mt-1 text-xs font-semibold leading-relaxed opacity-90">
              {alert.message}
            </p>

            <div className="mt-3 border-t border-black/10 pt-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                <ClipboardCheck className="h-3.5 w-3.5 text-slate-500" /> Required Precautions &amp; Actions
              </div>
              <ul className="mt-1.5 space-y-1">
                {alert.precautions.map((prec, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs font-semibold leading-relaxed">
                    <ArrowRight className="mt-1 h-3 w-3 shrink-0 opacity-60 text-slate-500" />
                    <span>{prec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
