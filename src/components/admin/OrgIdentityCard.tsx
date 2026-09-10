import type { ReactNode } from 'react';
import { Building2, AlertTriangle } from 'lucide-react';
import { ORG_IDENTITY, IdentityFact } from '@/lib/orgIdentity';
import type { OrgIdentifiers } from '@/hooks/useAdminDashboard';

// Who the society actually is, on the page you open first. Every fact here is already on
// the public FCA Mutuals Register or is a date the board has set — see src/lib/orgIdentity.ts
// for what may and may not go in it.
//
// The regulatory identifiers below are the exception, and they are NOT in this file or any
// other client source: they arrive as props from GET /api/admin/dashboard, which reads them
// from Coolify runtime vars after the session guard. Never paste a UTR or a policy number
// into this component — the bundle it compiles into is served to anonymous visitors.

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

export type IdentifiersState = 'loading' | 'failed' | 'ready';

/** An identifier the server did not have. Never blank, never a dash — a dash could read as
 *  a value someone recorded. */
function NotRecorded() {
  return <span className="text-gray-400 italic">not recorded</span>;
}

/** One identifier row. The three states are visibly distinct: "…" while the guarded route is
 *  in flight, "unavailable" in the amber treatment if it failed, the value once it lands. */
function IdentifierRow({
  label,
  state,
  value,
}: {
  label: string;
  state: IdentifiersState;
  value: ReactNode;
}) {
  return (
    <div className="sm:flex sm:gap-3">
      <dt className="text-sm font-medium text-gray-500 sm:w-48 sm:shrink-0">{label}</dt>
      {state === 'failed' ? (
        <dd className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <span>unavailable</span>
        </dd>
      ) : (
        <dd className="text-sm text-gray-900">{state === 'loading' ? '…' : value}</dd>
      )}
    </div>
  );
}

export interface OrgIdentityCardProps {
  /** From the guarded dashboard route. Undefined until it answers. */
  identifiers?: OrgIdentifiers | null;
  identifiersState: IdentifiersState;
}

export function OrgIdentityCard({ identifiers, identifiersState }: OrgIdentityCardProps) {
  const ids = identifiers ?? null;

  const utrValue: ReactNode = ids?.utr ? (
    ids.tax_office ? `${ids.utr} · Tax Office ${ids.tax_office}` : ids.utr
  ) : (
    <NotRecorded />
  );

  const insuranceValue: ReactNode =
    !ids?.insurer && !ids?.insurance_policy_number ? (
      <NotRecorded />
    ) : (
      <>
        {ids?.insurer ?? <NotRecorded />}
        {' · policy '}
        {ids?.insurance_policy_number ?? <NotRecorded />}
      </>
    );

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
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Regulatory identifiers</h3>
            <p className="text-xs text-gray-500 mb-2">
              Served after sign-in; not in the public bundle.
            </p>
            <dl className="space-y-2">
              <IdentifierRow label="HMRC UTR" state={identifiersState} value={utrValue} />
              <IdentifierRow label="Insurance" state={identifiersState} value={insuranceValue} />
              <IdentifierRow
                label="Period"
                state={identifiersState}
                value={ids?.insurance_period ?? <NotRecorded />}
              />
              <IdentifierRow
                label="Cover"
                state={identifiersState}
                value={ids?.insurance_cover ?? <NotRecorded />}
              />
            </dl>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-100">
        Contact {ORG_IDENTITY.contact} · Governing documents: {ORG_IDENTITY.governingDocuments}
      </p>
    </div>
  );
}
