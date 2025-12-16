
import { useState } from 'react';
import {
  Mail, RefreshCw, CheckCircle, XCircle, Users, List,
  ExternalLink, AlertTriangle, Clock, Copy, Check
} from 'lucide-react';
import { useSendFoxStatus } from '@/hooks/useSendFoxStatus';
import { SegmentSelector } from '@/components/newsletters/SegmentSelector';
import { formatDistanceToNow } from 'date-fns';

interface SendFoxStatusPanelProps {
  compact?: boolean;
  showLists?: boolean;
  onPrepareNewsletter?: (editionId: string) => void;
}

export function SendFoxStatusPanel({
  compact = false,
  showLists = true,
}: SendFoxStatusPanelProps) {
  const {
    isConnected,
    isLoading,
    error,
    lists,
    totalSubscribers,
    lastChecked,
    refresh,
  } = useSendFoxStatus();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        isLoading ? 'bg-gray-100 text-gray-600' :
        isConnected ? 'bg-green-50 text-green-700' :
        'bg-red-50 text-red-700'
      }`}>
        <Mail size={16} />
        <span className="font-medium">SendFox</span>
        {isLoading ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : isConnected ? (
          <>
            <CheckCircle size={14} />
            <span>{totalSubscribers.toLocaleString()} subscribers</span>
          </>
        ) : (
          <>
            <XCircle size={14} />
            <span>Disconnected</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isConnected ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Mail size={20} className={isConnected ? 'text-green-600' : 'text-red-600'} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">SendFox Integration</h3>
            <p className="text-sm text-gray-500">Email marketing & newsletter delivery</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh connection"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-blkout-600' : 'text-gray-500'} />
        </button>
      </div>

      {/* Status */}
      <div className={`p-4 rounded-xl mb-4 ${
        isLoading ? 'bg-gray-50 border border-gray-200' :
        isConnected ? 'bg-green-50 border border-green-200' :
        'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <>
              <RefreshCw size={20} className="animate-spin text-gray-500" />
              <span className="text-gray-600">Checking connection...</span>
            </>
          ) : isConnected ? (
            <>
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <span className="font-medium text-green-800">Connected</span>
                <span className="text-green-600 text-sm ml-2">
                  {totalSubscribers.toLocaleString()} total subscribers
                </span>
              </div>
            </>
          ) : (
            <>
              <XCircle size={20} className="text-red-600" />
              <div>
                <span className="font-medium text-red-800">Connection Failed</span>
                {error && <p className="text-red-600 text-sm">{error}</p>}
              </div>
            </>
          )}
        </div>
        {lastChecked && (
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Clock size={12} />
            Last checked {formatDistanceToNow(lastChecked, { addSuffix: true })}
          </p>
        )}
      </div>

      {/* Error Help */}
      {!isConnected && !isLoading && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Configuration Required</p>
              <p className="text-amber-700 mt-1">
                The <code className="bg-amber-100 px-1 rounded">SENDFOX_API_KEY</code> environment
                variable needs to be set in Vercel to enable email integration.
              </p>
              <a
                href="https://sendfox.com/account/api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 mt-2 font-medium"
              >
                Get API Key from SendFox
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Lists */}
      {showLists && isConnected && lists.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <List size={16} />
            Mailing Lists ({lists.length})
          </h4>
          <div className="space-y-2">
            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blkout-100 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-blkout-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{list.name}</p>
                    <p className="text-xs text-gray-500">ID: {list.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{list.subscribers.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">subscribers</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {isConnected && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href="https://sendfox.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blkout-600 hover:text-blkout-700 font-medium"
          >
            Open SendFox Dashboard
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
}

// Smaller inline status badge for headers
export function SendFoxStatusBadge() {
  const { isConnected, isLoading, totalSubscribers } = useSendFoxStatus();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isLoading ? 'bg-gray-100 text-gray-600' :
      isConnected ? 'bg-green-100 text-green-700' :
      'bg-red-100 text-red-700'
    }`}>
      <Mail size={12} />
      {isLoading ? (
        'Checking...'
      ) : isConnected ? (
        `${totalSubscribers.toLocaleString()} subs`
      ) : (
        'Disconnected'
      )}
    </div>
  );
}

// Newsletter send helper component
export function SendFoxSendHelper({
  editionId,
  editionType,
  onClose,
}: {
  editionId: string;
  editionType?: 'weekly' | 'monthly';
  onClose: () => void;
}) {
  const { prepareNewsletter, lists } = useSendFoxStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    campaignUrl?: string;
    instructions?: string[];
    subjectLine?: string;
    error?: string;
  } | null>(null);
  const [selectedListIds, setSelectedListIds] = useState<number[]>(() => {
    // Default based on edition type
    if (editionType === 'weekly') return [538297]; // BLKOUT Hub
    if (editionType === 'monthly') return [538162]; // Community Circle
    return [];
  });
  const [copied, setCopied] = useState(false);

  const handlePrepare = async () => {
    setIsLoading(true);
    // Use first selected list for now (API supports single list)
    const primaryList = selectedListIds[0];
    const res = await prepareNewsletter(editionId, primaryList);
    setResult(res);
    setIsLoading(false);
  };

  const handleCopySubject = async () => {
    if (result?.subjectLine) {
      await navigator.clipboard.writeText(result.subjectLine);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Prepare for SendFox
      </h3>

      {!result ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Select your target audience and prepare the newsletter for sending via SendFox.
          </p>

          <div className="mb-6">
            <SegmentSelector
              lists={lists}
              selectedListIds={selectedListIds}
              onSelectionChange={setSelectedListIds}
              editionType={editionType}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePrepare}
              disabled={isLoading || selectedListIds.length === 0}
              className="flex-1 px-4 py-2 bg-blkout-600 text-white rounded-lg hover:bg-blkout-700 disabled:opacity-50"
            >
              {isLoading ? 'Preparing...' : 'Prepare Newsletter'}
            </button>
          </div>
        </>
      ) : result.success ? (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
              <CheckCircle size={18} />
              Newsletter Ready!
            </div>
            <p className="text-sm text-green-700">
              The HTML has been prepared. Follow these steps to send via SendFox:
            </p>
          </div>

          {result.subjectLine && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Line
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                  {result.subjectLine}
                </code>
                <button
                  onClick={handleCopySubject}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}

          {result.instructions && (
            <ol className="text-sm text-gray-700 space-y-2 mb-4">
              {result.instructions.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-medium text-blkout-600">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Done
            </button>
            {result.campaignUrl && (
              <a
                href={result.campaignUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blkout-600 text-white rounded-lg hover:bg-blkout-700 text-center flex items-center justify-center gap-2"
              >
                Open SendFox
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
              <XCircle size={18} />
              Preparation Failed
            </div>
            <p className="text-sm text-red-700">{result.error}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </>
      )}
    </div>
  );
}
