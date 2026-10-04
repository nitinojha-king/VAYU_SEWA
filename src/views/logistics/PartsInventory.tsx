'use client';

import { useMemo, useState, Fragment } from 'react';
import { Package, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/Tooltip';
import { StockBadge } from '@/components/shared/Badge';
import { SearchInput, FilterPills, SortableTh, Pagination, paginate } from '@/components/shared/TableKit';
import Modal from '@/components/shared/Modal';
import EmptyState from '@/components/shared/EmptyState';
import { useData } from '@/context/DataContext';
import { useMockLoading, fmtDate, inr } from '@/utils/helpers';
import { SkeletonTable } from '@/components/shared/SkeletonLoader';
import { partStockStatus } from '@/views/logistics/InventoryOverview';
import type { SparePart } from '@/data/types';

type FilterKey = 'all' | 'Hydraulic' | 'Engine' | 'Avionics' | 'Structural';
type SortKey = 'partId' | 'quantity' | 'unitCost' | 'category';

const PILLS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Hydraulic', label: 'Hydraulic' },
  { key: 'Engine', label: 'Engine' },
  { key: 'Avionics', label: 'Avionics' },
  { key: 'Structural', label: 'Structural' },
];

/* ============================================================
   Logistics — Parts Inventory (/logistics/parts)
   ============================================================ */

export default function PartsInventory() {
  const { parts, updatePartQuantity } = useData();
  const loading = useMockLoading();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Set<FilterKey>>(new Set(['all']));
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>({ key: 'partId', dir: 'asc' });
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addPart, setAddPart] = useState<SparePart | null>(null);
  const [addQty, setAddQty] = useState(0);
  const PAGE_SIZE = 10;

  const rows = useMemo(() => {
    let list = parts.slice();
    const filters = [...active].filter((f): f is Exclude<FilterKey, 'all'> => f !== 'all');
    if (filters.length) list = list.filter((p) => filters.includes(p.category));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => p.partId.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
      );
    }
    if (sort) {
      list.sort((a, b) => {
        let d = 0;
        if (sort.key === 'quantity') d = a.quantity - b.quantity;
        else if (sort.key === 'unitCost') d = a.unitCost - b.unitCost;
        else d = String(a[sort.key]).localeCompare(String(b[sort.key]));
        return sort.dir === 'asc' ? d : -d;
      });
    }
    return list;
  }, [parts, active, query, sort]);

  const onSort = (key: SortKey) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const submitAdd = () => {
    if (addPart && addQty > 0) updatePartQuantity(addPart.partId, addPart.quantity + addQty);
    setAddPart(null);
    setAddQty(0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spare Parts Inventory"
        subtitle={`${parts.length} line items across 4 bays — click a row for usage detail, or restock inline`}
        help="Green dot = above minimum, yellow = at/near minimum, red = at zero. Restocking updates the last-restocked date."
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between ag-fade">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(0); }} placeholder="Search part ID, name or location…" />
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
          onClear={() => setActive(new Set(['all']))}
        />
      </div>

      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : rows.length === 0 ? (
        <div className="ag-card">
          <EmptyState icon={Package} title="No parts match your search" message="Try a different part number or clear filters." />
        </div>
      ) : (
        <div className="ag-card overflow-x-auto ag-fade ag-fade-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-cloud/50">
                <SortableTh label="Part ID" colKey="partId" sort={sort} onSort={onSort} />
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Name</th>
                <SortableTh label="Category" colKey="category" sort={sort} onSort={onSort} />
                <SortableTh label="Stock" colKey="quantity" sort={sort} onSort={onSort} />
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Min</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Location</th>
                <SortableTh label="Unit Cost" colKey="unitCost" sort={sort} onSort={onSort} />
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">Restock</th>
              </tr>
            </thead>
            <tbody>
              {paginate(rows, page, PAGE_SIZE).map((p) => {
                const st = partStockStatus(p);
                const isOpen = expanded === p.partId;
                return (
                  <Fragment key={p.partId}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : p.partId)}
                      className={`border-b border-slate-50 cursor-pointer transition-colors ${
                        st === 'out-of-stock' ? 'bg-bad/5' : st === 'low-stock' ? 'bg-warn/5' : 'hover:bg-cloud/60'
                      }`}
                    >
                      <td className="px-3 py-3 text-xs font-bold text-slate-800 font-mono">
                        <span className="inline-flex items-center gap-2">
                          {isOpen ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-300" />}
                          {p.partId}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-700 font-medium">{p.name}</td>
                      <td className="px-3 py-3">
                        <span className="text-[10px] font-semibold bg-cloud text-slate-500 rounded px-1.5 py-0.5">{p.category}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold tabular-nums text-slate-700">
                          <span className={`w-1.5 h-1.5 rounded-full ${st === 'in-stock' ? 'bg-ok' : st === 'low-stock' ? 'bg-warn' : 'bg-bad'}`} />
                          {p.quantity}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs tabular-nums text-slate-500">{p.minimumRequired}</td>
                      <td className="px-3 py-3">
                        <StockBadge status={st} />
                      </td>
                      <td className="px-3 py-3 text-[11px] text-slate-500 whitespace-nowrap">{p.location}</td>
                      <td className="px-3 py-3 text-xs tabular-nums text-slate-600">{inr(p.unitCost)}</td>
                      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setAddPart(p);
                            setAddQty(0);
                          }}
                          className="h-7 px-2.5 rounded-md border border-slate-200 text-[10px] font-bold text-navy hover:border-navy/50 hover:bg-navy-soft transition-colors inline-flex items-center gap-1"
                        >
                          <Plus size={11} /> Add Stock
                        </button>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr key={p.partId + '-exp'} className="bg-cloud/60">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ag-fade-in">
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase">Last Restocked</p>
                              <p className="text-xs font-medium text-slate-700 mt-1">{fmtDate(p.lastRestocked)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase">Stock Value</p>
                              <p className="text-xs font-medium text-slate-700 mt-1">{inr(p.quantity * p.unitCost)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase">Consumption (6 mo)</p>
                              <p className="text-xs font-medium text-slate-700 mt-1">
                                {Math.max(2, Math.round(p.minimumRequired * 4.2 + (p.partId.length % 5)))} units est.
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase">Reorder Point</p>
                              <p className="text-xs font-medium text-slate-700 mt-1">
                                {p.minimumRequired} units — {p.quantity <= p.minimumRequired ? 'REACHED, raise procurement' : 'not reached'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination total={rows.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />

      <Modal
        open={!!addPart}
        onClose={() => setAddPart(null)}
        title={`Add Stock — ${addPart?.partId ?? ''}`}
        subtitle={addPart?.name}
        footer={
          <div className="flex gap-2">
            <button onClick={() => setAddPart(null)} className="flex-1 h-9 rounded-md border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-cloud">
              Cancel
            </button>
            <button onClick={submitAdd} className="flex-1 h-9 rounded-md bg-navy text-white text-xs font-semibold hover:bg-navy-hover">
              Confirm Restock
            </button>
          </div>
        }
      >
        {addPart ? (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">
              Current quantity: <span className="font-bold text-slate-700">{addPart.quantity}</span> · minimum required{' '}
              <span className="font-bold text-slate-700">{addPart.minimumRequired}</span>
            </p>
            <input
              type="number"
              min={1}
              value={addQty || ''}
              onChange={(e) => setAddQty(Number(e.target.value))}
              placeholder="Quantity received"
              className="w-full h-10 rounded border border-slate-200 px-3 text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
            />
            {addQty > 0 ? (
              <p className="text-[11px] text-ok font-medium mt-2">
                New quantity: {addPart.quantity + addQty} units
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
