'use client';

import { useState, useEffect, ReactElement, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavigation from '../../components/DashboardNavigation';
import { User } from '@/types';

interface Report {
  id: number;
  studentName: string;
  subject: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | string;
  date: string;
  comments: string;
}

interface ReportFormData {
  studentName: string;
  subject: string;
  grade: string;
  comments: string;
}

export default function ReportPage(): ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<ReportFormData>({
    studentName: '',
    subject: '',
    grade: '',
    comments: '',
  });

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');

        if (!token || !userJson) {
          router.push('/login');
          return;
        }

        try {
          const userData = JSON.parse(userJson);
          setUser(userData);
        } catch (err) {
          console.error('Error parsing user data:', err);
          router.push('/login');
        } finally {
          setLoading(false);
        }
      }
    };

    init();
  }, [router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitReport = (e: FormEvent) => {
    e.preventDefault();
    // Handle report submission
    console.log('Report submitted:', formData);
    setFormData({ studentName: '', subject: '', grade: '', comments: '' });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Syncing reports...</p>
        </div>
      </div>
    );
  }

  const reports: Report[] = [
    {
      id: 1,
      studentName: 'John Doe',
      subject: 'Mathematics',
      grade: 'A',
      date: 'Mar 25, 2026',
      comments: 'Excellent progress in algebra and geometry. Keep up the good work!',
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      subject: 'English',
      grade: 'B',
      date: 'Mar 24, 2026',
      comments: 'Good understanding of literature concepts. Work on essay structure.',
    },
    {
      id: 3,
      studentName: 'Mike Johnson',
      subject: 'Physics',
      grade: 'A',
      date: 'Mar 23, 2026',
      comments: 'Outstanding grasp of complex physics concepts. Top performer!',
    },
    {
      id: 4,
      studentName: 'Sarah Williams',
      subject: 'Chemistry',
      grade: 'C',
      date: 'Mar 22, 2026',
      comments: 'Needs more practice with stoichiometry. Available for extra sessions.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h1 className="text-4xl font-black text-[#001A72] mb-1 flex items-center gap-3">
                <span>📂</span> Academic Reports
              </h1>
              <p className="text-gray-500 font-medium">Detailed session-by-session student evaluation</p>
            </div>
            {user?.role === 'teacher' && (
              <button
                onClick={() => setShowForm(!showForm)}
                className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-lg ${showForm ? 'bg-gray-100 text-gray-500 shadow-none' : 'bg-[#FFB81C] text-[#001A72] hover:bg-[#FFB81C]/90'
                  }`}
              >
                {showForm ? 'Cancel Editor' : 'Create New Report'}
              </button>
            )}
          </div>

          {/* Form Side */}
          {showForm && user?.role === 'teacher' && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 mb-12 border border-[#FFB81C]/20 animate-in fade-in slide-in-from-top-4 duration-500">
              <h3 className="text-2xl font-black text-[#001A72] mb-8">Evaluation Workshop</h3>
              <form onSubmit={handleSubmitReport} className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FormInput label="Student Name" name="studentName" value={formData.studentName} onChange={handleInputChange} placeholder="E.g. John Doe" />
                  <FormInput label="Subject" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="E.g. Biology" />

                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Grade</label>
                    <select name="grade" value={formData.grade} onChange={handleInputChange} className="bg-gray-50 border-2 border-gray-50 rounded-xl p-3 focus:outline-none focus:border-[#FFB81C] font-black text-sm">
                      <option value="">Select Grade</option>
                      <option value="A">A - Exceptional</option>
                      <option value="B">B - Mastery</option>
                      <option value="C">C - Progressing</option>
                      <option value="D">D - Developing</option>
                      <option value="F">F - Remediation Needed</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Session Date</label>
                    <input type="date" className="bg-gray-50 border-2 border-gray-50 rounded-xl p-3 focus:outline-none focus:border-[#FFB81C] font-black text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Professional Comments</label>
                  <textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-medium text-gray-700 leading-relaxed shadow-inner"
                    placeholder="Detailed evaluation of performance, strengths, and areas for improvement..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#001A72] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1a2d5e] transition shadow-xl shadow-blue-100"
                >
                  Verify & Publish Report
                </button>
              </form>
            </div>
          )}

          {/* History Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {reports.map((report) => (
              <div key={report.id} className="group bg-white rounded-[3rem] shadow-xl p-8 border border-gray-50 hover:shadow-2xl transition duration-500 relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-[#001A72] group-hover:text-[#FFB81C] transition duration-300">{report.studentName}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{report.subject} • {report.date}</p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg ${report.grade === 'A' ? 'bg-green-500 shadow-green-100' :
                      report.grade === 'B' ? 'bg-blue-500 shadow-blue-100' :
                        report.grade === 'C' ? 'bg-[#FFB81C] shadow-yellow-100' : 'bg-red-500 shadow-red-100'
                    }`}>
                    {report.grade}
                  </div>
                </div>

                <div className="flex-1 bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-8 relative">
                  <span className="absolute top-4 right-4 text-4xl opacity-10 font-serif">"</span>
                  <p className="text-gray-600 font-medium italic leading-relaxed text-sm">
                    {report.comments}
                  </p>
                </div>

                <div className="flex gap-4 border-t pt-8">
                  <button className="flex-1 py-3 bg-[#001A72]/5 text-[#001A72] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#001A72]/10 transition">
                    📥 Export PDF
                  </button>
                  <button className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition">
                    🗑️ Delete
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#001A72]/5 rounded-bl-[4rem] -translate-x-8 -translate-y-8 group-hover:bg-[#FFB81C]/5 transition duration-500"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function FormInput({ label, ...props }: FormInputProps): ReactElement {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{label}</label>
      <input
        {...props}
        className="bg-gray-50 border-2 border-gray-50 rounded-xl p-3 focus:outline-none focus:border-[#FFB81C] font-black text-sm"
      />
    </div>
  );
}
