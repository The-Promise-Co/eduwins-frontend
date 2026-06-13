'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAdminOverview, useAdminRentApplications, useAdminAmbassadors,
  useAdminVetting, useAdminDisputes, useAdminWelfareAnalytics,
  useUpdateRentApplication, useUpdateVetting, useUpdateDispute
} from '@/misc/hooks/api/admin';
import { TeacherProfile } from '@/misc/types';

export default function AdminDashboard() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const overviewQuery = useAdminOverview();
  const applicationsQuery = useAdminRentApplications();
  const ambassadorsQuery = useAdminAmbassadors();
  const vettingQuery = useAdminVetting();
  const disputesQuery = useAdminDisputes();
  const welfareQuery = useAdminWelfareAnalytics();
  const applicationStatusMutation = useUpdateRentApplication();
  const vettingMutation = useUpdateVetting();
  const disputeMutation = useUpdateDispute();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  const queryError = overviewQuery.error || applicationsQuery.error || ambassadorsQuery.error || vettingQuery.error || disputesQuery.error || welfareQuery.error;

  useEffect(() => {
    if (queryError) {
      setError((queryError as any)?.response?.data?.error || 'Could not load admin dashboard');
    }
  }, [queryError]);

  const updateApplicationStatus = async (id: string | number, status: string) => {
    try {
      await applicationStatusMutation.mutateAsync({ id, status });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Could not update status');
    }
  };

  const processVettingAction = async (teacherId: string | number, action: string) => {
    try {
      const response = await vettingMutation.mutateAsync({ teacherId, action });
      alert(response.message);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Could not process vetting action');
    }
  };

  const resolveDispute = async (disputeId: string | number, status: string) => {
    try {
      await disputeMutation.mutateAsync({ disputeId, status });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Could not update dispute');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72]"></div>
      </div>
    );
  }

  const loading = overviewQuery.isLoading || applicationsQuery.isLoading || ambassadorsQuery.isLoading || vettingQuery.isLoading || disputesQuery.isLoading || welfareQuery.isLoading;
  const stats = overviewQuery.data;
  const applications = applicationsQuery.data || [];
  const ambassadors = ambassadorsQuery.data || [];
  const vettingQueue = vettingQuery.data || [];
  const disputes = disputesQuery.data || [];
  const welfareAnalytics = welfareQuery.data;
  if (loading || !stats) return <p className="text-center py-8 text-[#001A72] font-bold animate-pulse">Loading admin data...</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[#001A72] mb-4">Admin Dashboard</h1>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 border border-red-200">{error}</div>}

          <div className="grid md:grid-cols-5 gap-4">
            <StatBox label="Users" value={stats.totalUsers} />
            <StatBox label="Teachers" value={stats.totalTeachers} />
            <StatBox label="Parents" value={stats.totalParents} />
            <StatBox label="Pending Apps" value={stats.pendingRentApplications} />
            <StatBox label="Vault Items" value={stats.totalVaultItems} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#001A72] mb-4">Vetting Queue</h2>
          {vettingQueue.length === 0 ? (
            <p className="text-gray-500 italic">No pending teacher vetting profiles.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[#001A72]">
                    <th className="px-3 py-3 font-bold uppercase text-xs tracking-wider">Teacher</th>
                    <th className="px-3 py-3 font-bold uppercase text-xs tracking-wider">Email</th>
                    <th className="px-3 py-3 font-bold uppercase text-xs tracking-wider">Rate</th>
                    <th className="px-3 py-3 font-bold uppercase text-xs tracking-wider">Credentials</th>
                    <th className="px-3 py-3 font-bold uppercase text-xs tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vettingQueue.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">{teacher.full_name}</td>
                      <td className="px-3 py-4 text-sm text-gray-600">{teacher.email}</td>
                      <td className="px-3 py-4 text-sm font-bold text-[#001A72]">₦{teacher.base_hourly_rate}</td>
                      <td className="px-3 py-4 text-sm">
                        {teacher.documents && teacher.documents.length > 0 ? (
                          <span className="text-blue-600 font-bold">
                            {teacher.documents.length} document{teacher.documents.length > 1 ? 's' : ''}
                          </span>
                        ) : <span className="text-gray-400 italic">None</span>}
                      </td>
                      <td className="px-3 py-4 text-sm space-x-3">
                        <button className="text-green-700 font-bold hover:text-green-900" onClick={() => processVettingAction(teacher.id, 'approve')}>Approve</button>
                        <button className="text-red-700 font-bold hover:text-red-900" onClick={() => processVettingAction(teacher.id, 'reject')}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#001A72] mb-4">Welfare Fund Analytics</h2>
          {welfareAnalytics ? (
            <div className="grid md:grid-cols-3 gap-6">
              <AnalyticsBox label="Total Welfare Pool" value={welfareAnalytics.totalAccumulated} color="text-blue-600" />
              <AnalyticsBox label="Available Funds" value={welfareAnalytics.totalAvailable} color="text-green-600" />
              <AnalyticsBox label="Locked Funds" value={welfareAnalytics.totalLocked} color="text-pink-600" />
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic">Welfare analytics data unavailable.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#001A72] mb-4">Conflict Resolution - Disputes</h2>
          {disputes.length === 0 ? (
            <p className="text-gray-500 italic">No open disputes.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="border-2 border-gray-100 rounded-xl p-6 hover:border-[#FFB81C] transition">
                  <div className="flex justify-between items-start mb-4">
                    <p className="font-black text-[#001A72] text-lg">Booking ID: #{dispute.booking_id.slice(-6)}</p>
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">{dispute.status.toUpperCase()}</span>
                  </div>
                  <p className="text-gray-700 mb-2 italic">"{dispute.issue}"</p>
                  <div className="text-xs text-gray-500 mb-4">
                    <p>Created by: {dispute.created_by}</p>
                  </div>
                  <div className="flex gap-3 mt-auto">
                    <button className="flex-1 bg-green-700 text-white py-2 rounded-lg font-bold hover:bg-green-800 transition" onClick={() => resolveDispute(dispute.id, 'resolved')}>Resolve</button>
                    <button className="flex-1 bg-red-700 text-white py-2 rounded-lg font-bold hover:bg-red-800 transition" onClick={() => resolveDispute(dispute.id, 'rejected')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: any) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-black text-[#001A72]">{value}</p>
    </div>
  );
}

function AnalyticsBox({ label, value, color }: any) {
  return (
    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{label}</p>
      <p className={`text-3xl font-black ${color}`}>₦{value.toLocaleString()}</p>
    </div>
  );
}
