'use client';

import { useState, useEffect, ReactElement } from 'react';
import api from '../../src/services/api';
import NavBar from '../../components/NavBar';
import { ProgressReport } from '@/src/types';

export default function ProgressReportsPage(): ReactElement {
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/progress-reports/my');
        setReports(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Unable to load progress reports');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Fetching reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-black text-[#001A72] mb-2 flex items-center gap-3">
              <span>📊</span> Student Performance Reports
            </h1>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              Track weekly educational growth and attendance updates.
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-700 font-bold flex items-center gap-3">
               <span>⚠️</span> {error}
            </div>
          )}

          {reports.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-xl">
               <div className="text-6xl mb-6 opacity-20">📁</div>
               <p className="text-gray-400 font-black text-xl">No reports available yet.</p>
               <p className="text-gray-400 text-sm mt-2">Reports are generated weekly by your assigned teachers.</p>
            </div>
          ) : (
            <div className="grid gap-8">
              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-gray-100 hover:border-[#FFB81C] transition duration-300 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                      <div>
                        <p className="text-[10px] font-black text-[#FFB81C] uppercase tracking-[0.2em] mb-1">Learning Period</p>
                        <h3 className="text-2xl font-black text-[#001A72]">
                          Week of {new Date(report.week_start).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </h3>
                        <p className="text-gray-400 font-bold text-sm mt-1 flex items-center gap-2">
                           <span>👨‍🏫</span> Specialist: {report.teacher_name}
                        </p>
                      </div>
                      <div className="bg-[#001A72] text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                        {report.attendance_score}% Attendance
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                       <MetricBox label="Skill Improvement" value={`${report.skill_improvement_score}/100`} sub="Knowledge Growth" />
                       <MetricBox label="Homework Mastery" value={`${report.homework_completion}%`} sub="Task Completion" />
                       <MetricBox label="Participation" value="92/100" sub="Class Engagement" />
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Teacher's Summary</p>
                       <p className="text-gray-700 font-medium leading-relaxed italic">
                         "{report.performance_summary || 'No summary provided for this week.'}"
                       </p>
                    </div>

                    {report.notes && (
                      <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-50">
                         <span className="text-xl">💡</span>
                         <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Growth Recommendation</p>
                            <p className="text-sm font-bold text-blue-800 mt-0.5">{report.notes}</p>
                         </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#001A72]/5 rounded-bl-[4rem] -translate-x-8 -translate-y-8 group-hover:bg-[#FFB81C]/5 transition duration-500"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricBoxProps {
  label: string;
  value: string;
  sub: string;
}

function MetricBox({ label, value, sub }: MetricBoxProps): ReactElement {
  return (
    <div className="p-5 bg-white rounded-2xl border-2 border-gray-50 shadow-sm">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-[#001A72] leading-none mb-1">{value}</p>
      <p className="text-[10px] font-bold text-green-500">{sub}</p>
    </div>
  );
}
