'use client';

import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { PageHeader } from '@/components/shared/Tooltip';
import AircraftCard from '@/components/shared/AircraftCard';
import AircraftSlideOver from '@/components/shared/AircraftSlideOver';
import { SearchInput, FilterPills, Pagination } from '@/components/shared/TableKit';
import EmptyState from '@/components/shared/EmptyState';
import { useSensors } from '@/context/SensorContext';
import { useData } from '@/context/DataContext';
import { useMockLoading } from '@/utils/helpers';
import { SkeletonStat } from '@/components/shared/SkeletonLoader';
import type { Aircraft } from '@/data/types';
import { fleetAverageHealth } from '@/utils/healthCalculator';

type FilterKey = 'all' | 'operational' | 'warning' | 'critical' | 'maintenance' | 'grounded';

const PILLS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'operational', label: 'Operational' },
  { key: 'warning', label: 'Warning' },
  { key: 'critical', label: 'Critical' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'grounded', label: 'Grounded' },
];

/* ============================================================
   Commander — Aircraft Status Map (/commander/map)
   ============================================================ */

export default function AircraftStatusMap() {
  const { aircraft } = useSensors();
  const { predictions } = useData();
  const loading = useMockLoading();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Set<FilterKey>>(new Set(['all']));
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Aircraft | null>(null);
  const PAGE_SIZE = 12;

  const filtered = useMemo(() => {
    let rows = aircraft;
    const filters = [...active].filter((f): f is Exclude<FilterKey, 'all'> => f !== 'all');
    if (filters.length) rows = rows.filter((a) => filters.includes(a.status));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((a) => a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
    }
    return rows;
  }, [aircraft, active, query]);

  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const avg = fleetAverageHealth(aircraft);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aircraft Status Map"
        subtitle={`${aircraft.length} airframes · fleet health ${Math.round(avg)}% · click any card for the quick summary`}
        help="A live mosaic of the fleet. Card borders mirror status colour; the health bar reflects the weighted component score."
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between ag-fade">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0); }} placeholder="Search by ID, name or type…" />
        <FilterPills
          pills={PILLS}
          active={active}
          onToggle={(k) => {
            const next = new Set(active);
            if (k === 'all') {
              next.clear();
              next.add('all');
            } else {
              next.delete('all');
              if (next.has(k)) next.delete(k);
              else next.add(k);
              if (next.size === 0) next.add('all');
            }
            setActive(next);
            setPage(0);
          }}
          onClear={() => {
            setActive(new Set(['all']));
            setPage(0);
          }}
        />
      </div>

      {loading ? (
        <SkeletonStat count={4} />
      ) : pageRows.length === 0 ? (
        <div className="ag-card">
          <EmptyState icon={SearchX} title="No aircraft match your filters" message="Try clearing a filter or searching a different ID." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pageRows.map((a, i) => (
            <div key={a.id} className="ag-fade" style={{ animationDelay: `${i * 30}ms` }}>
              <AircraftCard aircraft={a} onClick={() => setSelected(a)} showHealthNumber />
            </div>
          ))}
        </div>
      )}

      <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />

      <AircraftSlideOver aircraft={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
