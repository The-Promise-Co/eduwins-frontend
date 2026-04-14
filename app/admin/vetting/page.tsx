'use client';

import { useState, useEffect, ReactElement } from 'react';
import api from '../../../services/api';
import NavBar from '../../../components/NavBar';
import { TeacherProfile } from '@/types';

interface AdminStats {
  totalTeachers: number;
  totalParents: number;
  totalEarnings: number;
  welfarePooled: number;
}

interface AdminBooking {
  id: string;
  parentName: string;
  teacherName: string;
  totalCost: number;
  totalSessions: number;
  status: string;
}

export default function AdminVettingDashboard(): ReactElement {
  const [activeTab, setActiveTab] = useState<string>('vetting');
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalTeachers: 0,
    totalParents: 0,
    totalEarnings: 0,
    welfarePooled: 0
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'vetting') {
        const response = await api.get('/admin/teachers-pending');
        setTeachers(response.data || []);
      } else if (activeTab === 'escrow') {
        const response = await api.get('/admin/bookings-pending');
        setBookings(response.data || []);
      } else if (activeTab === 'stats') {
        const response = await api.get('/admin/stats');
        setStats(response.data || { totalTeachers: 0, totalParents: 0, totalEarnings: 0, welfarePooled: 0 });
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTeacher = async (teacherId: string) => {
    try {
      await api.put(`/admin/teachers/${teacherId}/approve`);
      fetchData();
    } catch (err: any) {
      alert('Failed to approve teacher');
    }
  };

  const handleRejectTeacher = async (teacherId: string) => {
    try {
      await api.put(`/admin/teachers/${teacherId}/reject`);
      fetchData();
    } catch (err: any) {
      alert('Failed to reject teacher');
    }
  };

  const handleReleaseFunds = async (bookingId: string) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/release-funds`);
      alert('Funds released successfully!');
      fetchData();
    } catch (err: any) {
      alert('Failed to release funds');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black text-[#001A72] mb-2 flex items-center gap-4">
            <span>🛡️</span> Administrative Command
          </h1>
          <p className="text-gray-500 font-medium text-xl">Operational oversight, security, and financial management.</p>
        </div>

        {/* Console Navigation */}
        <div className="bg-white p-2 rounded-[2rem] shadow-xl border border-gray-100 flex gap-2 mb-12">
          <NavTab active={activeTab === 'vetting'} onClick={() => setActiveTab('vetting')} label="Teacher Vetting" icon="🧑‍🏫" count={teachers.length} />
          <NavTab active={activeTab === 'escrow'} onClick={() => setActiveTab('escrow')} label="Escrow Vault" icon="💳" count={bookings.length} />
          <NavTab active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="Global Analytics" icon="📊" />
        </div>

        {/* Dashboard Area */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#001A72]"></div>
              <p className="font-black text-[#001A72] uppercase tracking-widest text-xs">Accessing Encrypted Server...</p>
            </div>
          ) : (
            <>
              {activeTab === 'vetting' && (
                <div className="grid gap-8">
                  {teachers.length === 0 ? (
                    <EmptyState label="Teachers" />
                  ) : (
                    teachers.map(teacher => (
                      <div key={teacher.id} className="bg-white rounded-[3rem] shadow-2xl p-10 border border-gray-50 hover:border-[#FFB81C] transition duration-500 overflow-hidden relative group">
                        <div className="relative z-10 flex flex-col lg:flex-row gap-12">
                          {/* Teacher Bio */}
                          <div className="lg:w-1/3 text-center lg:text-left">
                            <div className="w-32 h-32 bg-gradient-to-br from-[#001A72] to-[#FFB81C] rounded-[2rem] mx-auto lg:mx-0 mb-6 flex items-center justify-center text-white text-5xl font-black shadow-xl">
                              {teacher.fullName?.charAt(0) || '?'}
                            </div>
                            <h3 className="text-3xl font-black text-[#001A72] mb-1">{teacher.fullName}</h3>
                            <p className="text-gray-400 font-bold text-sm mb-6">{teacher.email}</p>
                            <div className="flex flex-col gap-3">
                              <MetaInfo label="Location" value={teacher.location || ''} />
                              <MetaInfo label="Experience" value={`${teacher.yearsExperience} Years`} />
                            </div>
                          </div>

                          {/* Professional Record */}
                          <div className="lg:w-1/3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Credential Dossier</h4>
                            <div className="space-y-4">
                              <RecordItem label="Academic Status" value={teacher.qualification || ''} />
                              <RecordItem label="Base Hourly Rate" value={`₦${teacher.baseHourlyRate?.toLocaleString()}`} />
                              <RecordItem label="Expertise Subjects" value={(teacher.subjects || []).join(', ')} />
                            </div>
                            {teacher.credentials && (
                              <a
                                href={teacher.credentials}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-8 inline-flex items-center gap-2 bg-[#001A72]/5 text-[#001A72] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#001A72]/10 transition"
                              >
                                📄 Open Verified Document
                              </a>
                            )}
                          </div>

                          {/* Command Actions */}
                          <div className="lg:w-1/3 flex flex-col justify-center gap-4 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-12 pt-8 lg:pt-0">
                            <button
                              onClick={() => handleApproveTeacher(teacher.id)}
                              className="w-full bg-green-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition shadow-lg shadow-green-100"
                            >
                              ✓ Finalize Approval
                            </button>
                            <button
                              onClick={() => handleRejectTeacher(teacher.id)}
                              className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition"
                            >
                              ✗ Formal Rejection
                            </button>
                            <p className="text-[10px] text-gray-400 font-black uppercase text-center tracking-widest mt-2 underline decoration-[#FFB81C] decoration-2 underline-offset-4">
                              Status: Operational Review
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#001A72]/5 rounded-bl-[10rem] group-hover:bg-[#FFB81C]/5 transition duration-500"></div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'escrow' && (
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
                  {bookings.length === 0 ? (
                    <EmptyState label="Escrow Transactions" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#001A72] text-white">
                          <tr>
                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Client (Parent)</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Specialist (Teacher)</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Transaction Value</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Session Count</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Security Status</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest">Operations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {bookings.map(booking => (
                            <tr key={booking.id} className="hover:bg-gray-50/50 transition duration-300">
                              <td className="px-8 py-6 font-bold text-[#001A72]">{booking.parentName}</td>
                              <td className="px-8 py-6 font-medium text-gray-500">{booking.teacherName}</td>
                              <td className="px-8 py-6 font-black text-[#FFB81C]">₦{booking.totalCost?.toLocaleString()}</td>
                              <td className="px-8 py-6 text-sm text-gray-400 font-bold">{booking.totalSessions} Sessions</td>
                              <td className="px-8 py-6">
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${booking.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-orange-100 text-orange-700'
                                  }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-8 py-6">
                                {booking.status === 'completed' ? (
                                  <button
                                    onClick={() => handleReleaseFunds(booking.id)}
                                    className="bg-[#001A72]/5 text-[#001A72] px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#001A72] hover:text-white transition shadow-sm"
                                  >
                                    Release Funds
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-black text-gray-300 uppercase italic">Locked</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <AnalyticsCard label="Active Specialists" value={stats.totalTeachers.toString()} color="text-[#001A72]" icon="🧑‍🏫" />
                  <AnalyticsCard label="Verified Clients" value={stats.totalParents.toString()} color="text-[#001A72]" icon="🏡" />
                  <AnalyticsCard label="Gross Volume" value={`₦${stats.totalEarnings?.toLocaleString()}`} color="text-[#FFB81C]" icon="📈" />
                  <AnalyticsCard label="Welfare Reserves" value={`₦${stats.welfarePooled?.toLocaleString()}`} color="text-green-600" icon="🏥" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface NavTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
  count?: number;
}

function NavTab({ active, onClick, label, icon, count }: NavTabProps): ReactElement {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-6 rounded-2xl transition duration-500 relative ${active ? 'bg-[#001A72] text-white shadow-2xl scale-[1.02] z-10' : 'text-[#001A72]/40 hover:bg-gray-50'
        }`}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      {count !== undefined && (
        <span className={`absolute top-4 right-4 text-[10px] font-black px-2 py-0.5 rounded-lg ${active ? 'bg-[#FFB81C] text-[#001A72]' : 'bg-gray-100 text-gray-400'
          }`}>
          {count}
        </span>
      )}
    </button>
  );
}

interface MetaInfoProps {
  label: string;
  value: string;
}

function MetaInfo({ label, value }: MetaInfoProps): ReactElement {
  return (
    <div className="flex gap-2 text-sm">
      <span className="font-black text-gray-300 uppercase tracking-tighter text-[9px] w-20 pt-1">{label}</span>
      <span className="font-bold text-[#001A72]">{value}</span>
    </div>
  );
}

interface RecordItemProps {
  label: string;
  value: string;
}

function RecordItem({ label, value }: RecordItemProps): ReactElement {
  return (
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-gray-700">{value}</p>
    </div>
  );
}

interface AnalyticsCardProps {
  label: string;
  value: string;
  color: string;
  icon: string;
}

function AnalyticsCard({ label, value, color, icon }: AnalyticsCardProps): ReactElement {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-gray-50 flex flex-col items-center text-center group hover:-translate-y-2 transition duration-500">
      <div className="text-5xl mb-6 opacity-80 group-hover:scale-110 transition duration-500">{icon}</div>
      <div className={`text-4xl font-black mb-1 ${color}`}>{value}</div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

interface EmptyStateProps {
  label: string;
}

function EmptyState({ label }: EmptyStateProps): ReactElement {
  return (
    <div className="bg-white rounded-[3rem] p-32 text-center border-2 border-dashed border-gray-100 italic">
      <div className="text-7xl mb-6 opacity-10 font-serif">EduWins</div>
      <p className="text-gray-400 font-black text-xl uppercase tracking-widest">No Pending {label}</p>
      <p className="text-gray-300 text-xs mt-2 font-medium">System is currently caught up with all operational items.</p>
    </div>
  );
}
