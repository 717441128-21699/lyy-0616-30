import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, Tag } from 'lucide-react';
import type { Activity } from '@shared/types';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_STATUS_LABELS } from '@shared/types';
import { cn } from '../lib/utils';

interface ActivityCardProps {
  activity: Activity;
}

const typeColors: Record<string, string> = {
  environment: 'bg-green-100 text-green-700',
  education: 'bg-blue-100 text-blue-700',
  elderly: 'bg-orange-100 text-orange-700',
  community: 'bg-purple-100 text-purple-700',
  animal: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-emerald-100 text-emerald-700',
  ongoing: 'bg-blue-100 text-blue-700',
  completed: 'bg-slate-100 text-slate-600',
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const progress = (activity.currentParticipants / activity.maxParticipants) * 100;
  const isFull = activity.currentParticipants >= activity.maxParticipants;
  const remaining = activity.maxParticipants - activity.currentParticipants;

  return (
    <Link
      to={`/activity/${activity.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-40 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              typeColors[activity.type] || typeColors.other
            )}
          >
            <Tag className="w-3 h-3 inline mr-1" />
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium w-fit',
              statusColors[activity.status]
            )}
          >
            {ACTIVITY_STATUS_LABELS[activity.status]}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        <h3 className="absolute bottom-3 left-4 right-4 text-white font-semibold text-lg line-clamp-2 group-hover:text-emerald-100 transition-colors">
          {activity.title}
        </h3>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{activity.city} · {activity.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{activity.startDate}</span>
            {activity.startDate !== activity.endDate && (
              <span className="text-gray-400"> 至 {activity.endDate}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{activity.startTime} - {activity.endTime}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{activity.currentParticipants}/{activity.maxParticipants} 人</span>
            </div>
            <span className={cn(
              'text-xs font-medium',
              isFull ? 'text-orange-500' : 'text-emerald-600'
            )}>
              {isFull ? '已满员' : `剩余 ${remaining} 个名额`}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isFull ? 'bg-orange-400' : 'bg-gradient-to-r from-emerald-400 to-teal-400'
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
