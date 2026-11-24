import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import Breadcrumb from './Breadcrumb';
import Badge from '../common/Badge';

export function DashboardHeader({ onMenuClick, breadcrumbs = [], title }) {
  const { user } = useAuthStore();

  return (
    <header className="h-16 border-b border-slate-200/90 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} className="mb-0.5" />}
          {title && <h1 className="text-base font-bold text-slate-900 leading-tight">{title}</h1>}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Notification bell button */}
        <button
          type="button"
          aria-label="Thông báo"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white" />
        </button>

        {/* User Role Pill */}
        <div className="hidden sm:flex items-center pl-3 border-l border-slate-200">
          <Badge color="brand" size="sm" className="capitalize">
            {user?.role || 'Learner'}
          </Badge>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
