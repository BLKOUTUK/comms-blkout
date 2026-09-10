import { Building2, AlertTriangle } from 'lucide-react';
import { ORG_IDENTITY, IdentityFact } from '@/lib/orgIdentity';

// Who the society actually is, on the page you open first. Every fact here is already on
// the public FCA Mutuals Register or is a date the board has set — see src/lib/orgIdentity.ts
// for what may and may not go in it.

function FactList({ facts }: { facts: IdentityFact[] }) {
  return (
    <dl className="space-y-2">
      {facts.map((fact) => (
        <div key={fact.label} className="sm:flex sm:gap-3">
          <dt className="text-sm font-medium text-gray-500 sm:w-48 sm:shrink-0">{fact.label}</dt>
          <dd
            className={
              fact.flag
                ? 'text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-start gap-2'
                : 'text-sm text-gray-900'
            }
          >
            {fact.flag && <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />}
            <span>{fact.value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function OrgIdentityCard() {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{ORG_IDENTITY.legalName}</h2>
          <p className="text-sm text-gray-600 mt-1">trading as {ORG_IDENTITY.tradingName}</p>
        </div>
        <div className="w-12 h-12 bg-blkout-100 rounded-lg flex items-center justify-center shrink-0">
          <Building2 size={24} className="text-blkout-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <FactList facts={ORG_IDENTITY.registration} />
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Officers</h3>
            <FactList facts={ORG_IDENTITY.officers} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Key dates</h3>
            <FactList facts={ORG_IDENTITY.keyDates} />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-100">
        Contact {ORG_IDENTITY.contact} · Governing documents: {ORG_IDENTITY.governingDocuments}
      </p>
    </div>
  );
}
