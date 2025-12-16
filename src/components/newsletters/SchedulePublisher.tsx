
import { useState } from 'react';
import {
  Calendar, Clock, X, AlertTriangle, CheckCircle,
  RefreshCw, Zap
} from 'lucide-react';
import { format, addDays, setHours, setMinutes, isBefore, startOfDay } from 'date-fns';

interface SchedulePublisherProps {
  editionType: 'weekly' | 'monthly';
  subject: string;
  currentSchedule?: Date | null;
  onSchedule: (date: Date | null) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

// Suggested times based on email marketing best practices
const SUGGESTED_TIMES = [
  { label: 'Morning (9:00 AM)', hour: 9, minute: 0, description: 'Good for professional audiences' },
  { label: 'Midday (12:00 PM)', hour: 12, minute: 0, description: 'Lunch break engagement' },
  { label: 'Afternoon (3:00 PM)', hour: 15, minute: 0, description: 'Post-lunch focus time' },
  { label: 'Evening (6:00 PM)', hour: 18, minute: 0, description: 'After work reading' },
];

// Quick schedule options
const QUICK_SCHEDULES = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 2 days', days: 2 },
  { label: 'Next week', days: 7 },
];

export function SchedulePublisher({
  editionType,
  subject,
  currentSchedule,
  onSchedule,
  onClose,
}: SchedulePublisherProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    currentSchedule
      ? format(currentSchedule, 'yyyy-MM-dd')
      : format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    currentSchedule
      ? format(currentSchedule, 'HH:mm')
      : '09:00'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getScheduledDateTime = (): Date => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    let date = new Date(selectedDate);
    date = setHours(date, hours);
    date = setMinutes(date, minutes);
    return date;
  };

  const isValidSchedule = (): boolean => {
    const scheduledDate = getScheduledDateTime();
    return !isBefore(scheduledDate, new Date());
  };

  const handleQuickSchedule = (days: number) => {
    const date = addDays(startOfDay(new Date()), days);
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  const handleSuggestedTime = (hour: number, minute: number) => {
    setSelectedTime(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  };

  const handleSubmit = async () => {
    if (!isValidSchedule()) {
      setError('Please select a future date and time');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await onSchedule(getScheduledDateTime());

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to schedule newsletter');
    }
  };

  const handleSendNow = async () => {
    setIsSubmitting(true);
    setError(null);

    // Send now by setting schedule to null (immediate)
    const result = await onSchedule(null);

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send newsletter');
    }
  };

  const handleClearSchedule = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await onSchedule(null);

    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to clear schedule');
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Newsletter Scheduled!
            </h3>
            <p className="text-gray-600 mb-4">
              Your {editionType} newsletter has been scheduled for{' '}
              <span className="font-medium">
                {format(getScheduledDateTime(), 'EEEE, MMMM d, yyyy')}
              </span>{' '}
              at{' '}
              <span className="font-medium">
                {format(getScheduledDateTime(), 'h:mm a')}
              </span>
            </p>
            <button
              onClick={onClose}
              className="btn btn-primary"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Schedule Newsletter</h2>
              <p className="text-sm text-gray-500 capitalize">{editionType} Edition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Subject Preview */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <p className="text-xs text-gray-500 mb-1">Subject</p>
          <p className="text-sm font-medium text-gray-900">{subject}</p>
        </div>

        {/* Current Schedule */}
        {currentSchedule && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Currently Scheduled</p>
                <p className="text-blue-600">
                  {format(currentSchedule, 'EEEE, MMMM d, yyyy')} at {format(currentSchedule, 'h:mm a')}
                </p>
              </div>
              <button
                onClick={handleClearSchedule}
                disabled={isSubmitting}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Quick Schedule Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Schedule
          </label>
          <div className="flex gap-2">
            {QUICK_SCHEDULES.map((option) => (
              <button
                key={option.days}
                onClick={() => handleQuickSchedule(option.days)}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Time Picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Time
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Suggested Times */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Suggested Times
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_TIMES.map((time) => (
              <button
                key={time.label}
                onClick={() => handleSuggestedTime(time.hour, time.minute)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedTime === `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{time.label}</p>
                <p className="text-xs text-gray-500">{time.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Will be sent on</p>
              <p className="font-semibold text-gray-900">
                {format(getScheduledDateTime(), 'EEEE, MMMM d, yyyy')} at {format(getScheduledDateTime(), 'h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValidSchedule()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Calendar size={16} />
            )}
            Schedule
          </button>
        </div>

        {/* Send Now Option */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleSendNow}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
          >
            <Zap size={16} />
            Send Immediately
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            This will mark the newsletter as ready to send now
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact schedule badge for newsletter cards
export function ScheduleBadge({ scheduledFor }: { scheduledFor: Date | null }) {
  if (!scheduledFor) return null;

  const isPast = isBefore(scheduledFor, new Date());

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
      isPast
        ? 'bg-amber-100 text-amber-700'
        : 'bg-blue-100 text-blue-700'
    }`}>
      <Calendar size={12} />
      {isPast ? 'Overdue: ' : ''}{format(scheduledFor, 'MMM d, h:mm a')}
    </div>
  );
}
