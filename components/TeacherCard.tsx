import Link from 'next/link';
import { TeacherProfile } from '@/src/types';

interface TeacherCardProps {
  teacher: Partial<TeacherProfile> & { 
    photo_url?: string; 
    full_name?: string; 
    hourly_rate?: number; 
    baseHourlyRate?: number;
    lga?: string;
    students?: number;
    fullName?: string;
    subject?: string;
  };
}

export default function TeacherCard({ teacher }: TeacherCardProps) {
  const teacherId = teacher.id;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition border-2 border-[#001A72] hover:border-[#FFB81C]">
      <div className="bg-gradient-to-r from-[#001A72] to-[#FFB81C] p-6 text-center">
        <div className="flex justify-center mb-3">
          <img 
            src={teacher.photo_url || `https://via.placeholder.com/100/001A72/FFFFFF?text=${encodeURIComponent(teacher.full_name || teacher.fullName || 'Teacher')}`} 
            alt={teacher.full_name || teacher.fullName || 'Teacher'} 
            className="w-24 h-24 rounded-full border-4 border-white object-cover"
          />
        </div>
        <h3 className="text-xl font-bold text-white">{teacher.full_name || teacher.fullName}</h3>
        <p className="text-white/80">{teacher.subject || (teacher.subjects && teacher.subjects[0])}</p>
      </div>
      
      <div className="p-6">
        {/* Rating */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <span className="text-2xl font-bold text-[#001A72]">{teacher.rating || 4.5}</span>
            <span className="text-yellow-500 ml-1">★</span>
          </div>
          <p className="text-sm text-gray-600">{teacher.students || teacher.reviewsCount || 0} reviews</p>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Hourly Rate:</span>
            <span className="font-bold text-lg">₦{(teacher.hourly_rate || teacher.hourlyRate || teacher.baseHourlyRate || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium">{teacher.lga || teacher.location || 'Lagos'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Link 
            href={`/teachers/${teacherId}`}
            className="block w-full bg-[#001A72] text-white py-2 rounded-lg hover:bg-[#001A72]/90 font-semibold transition text-center"
          >
            View Profile & Book
          </Link>
          <button className="w-full bg-[#FFB81C] text-[#001A72] py-2 rounded-lg hover:bg-[#ffd06f] font-semibold transition">
            Send Message
          </button>
        </div>

        {/* Badge */}
        <div className="mt-4 text-center">
          <span className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
            ✓ Verified
          </span>
        </div>
      </div>
    </div>
  );
}
