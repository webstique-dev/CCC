import React from 'react';
import { FileText, Clock, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { SkeletonStatCard } from './ui/skeleton';

export function MetricsBar({
  invoices = [],
  activeStatus = 'All',
  onSelectStatus,
  loading = false,
}) {
  if (loading && invoices.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <div className="col-span-2 sm:col-span-1 md:col-span-1">
          <SkeletonStatCard />
        </div>
      </div>
    );
  }

  const counts = invoices.reduce(
    (acc, inv) => {
      acc.total += 1;
      const status = inv.status || 'Draft';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { total: 0, Draft: 0, Processing: 0, Completed: 0, Failed: 0 }
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
      <StatCard
        title="All Invoices"
        value={counts.total}
        subtitle="Total recorded"
        icon={Layers}
        color="brand"
        active={activeStatus === 'All'}
        onClick={() => onSelectStatus('All')}
      />

      <StatCard
        title="Draft"
        value={counts.Draft}
        subtitle="Pending review"
        icon={Clock}
        color="slate"
        active={activeStatus === 'Draft'}
        onClick={() => onSelectStatus('Draft')}
      />

      <StatCard
        title="Processing"
        value={counts.Processing}
        subtitle="In extraction"
        icon={FileText}
        color="amber"
        active={activeStatus === 'Processing'}
        onClick={() => onSelectStatus('Processing')}
      />

      <StatCard
        title="Completed"
        value={counts.Completed}
        subtitle="PDF generated"
        icon={CheckCircle2}
        color="emerald"
        active={activeStatus === 'Completed'}
        onClick={() => onSelectStatus('Completed')}
      />

      <div className="col-span-2 sm:col-span-1 md:col-span-1">
        <StatCard
          title="Failed"
          value={counts.Failed}
          subtitle="Requires retry"
          icon={AlertTriangle}
          color="rose"
          active={activeStatus === 'Failed'}
          onClick={() => onSelectStatus('Failed')}
        />
      </div>
    </div>
  );
}
