import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import ToastProvider from '../components/feedback/ToastProvider';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-brand-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <ToastProvider />
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <GraduationCap className="w-7 h-7" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
            Tutor<span className="text-brand-600">Connect</span>
          </span>
        </Link>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
