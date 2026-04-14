'use client';

import { useState, useEffect, ReactElement } from 'react';
import Link from 'next/link';

interface Slide {
  id: number;
  title: string;
  description: string;
  image: string;
  cta: string;
}

export default function HomePage(): ReactElement {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const slides: Slide[] = [
    {
      id: 1,
      title: 'Find Expert Tutors',
      description: 'Connect with qualified teachers verified for excellence',
      image: 'linear-gradient(135deg, #001A72 0%, #FFB81C 100%)',
      cta: 'Browse Tutors'
    },
    {
      id: 2,
      title: 'Learn at Your Pace',
      description: 'Flexible scheduling that fits your lifestyle and goals',
      image: 'linear-gradient(135deg, #FFB81C 0%, #001A72 100%)',
      cta: 'Get Started'
    },
    {
      id: 3,
      title: 'Track Progress',
      description: 'Monitor learning outcomes with real-time updates',
      image: 'linear-gradient(135deg, #001A72 0%, #4CAF50 100%)',
      cta: 'Learn More'
    },
    {
      id: 4,
      title: 'Secure Payments',
      description: 'Safe escrow system with transparent fee structure',
      image: 'linear-gradient(135deg, #4CAF50 0%, #001A72 100%)',
      cta: 'Book Now'
    },
    {
      id: 5,
      title: 'Join Our Community',
      description: 'Thousands of students and tutors trust EduWins',
      image: 'linear-gradient(135deg, #FFB81C 0%, #FF5722 100%)',
      cta: 'Get Started'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = (): void => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = (): void => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Sliders Section */}
      <section className="relative w-full h-80 md:h-96 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ background: slide.image }}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4 max-w-2xl">
                <h1 className="text-5xl md:text-6xl font-bold mb-4">{slide.title}</h1>
                <p className="text-xl md:text-2xl mb-8 font-medium">{slide.description}</p>
                <Link
                  href="/search"
                  className="inline-block bg-[#FFB81C] text-[#001A72] px-8 py-3 rounded-lg text-lg font-bold hover:bg-[#ffd06f] transition"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Previous Button */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/40 hover:bg-white/70 text-white p-3 rounded-full transition z-20 w-12 h-12 flex items-center justify-center"
          aria-label="Previous slide"
        >
          ❮
        </button>

        {/* Next Button */}
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/40 hover:bg-white/70 text-white p-3 rounded-full transition z-20 w-12 h-12 flex items-center justify-center"
          aria-label="Next slide"
        >
          ❯
        </button>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-3 rounded-full transition ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/60 w-3'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Top Qualified Teachers */}
      <div className="mb-16 border-4 border-[#001A72] rounded-xl p-8 max-w-7xl mx-auto mt-12">
        <h2 className="text-4xl font-bold mb-12 text-center border-b-4 border-[#FFB81C] pb-6">Top Qualified Teachers</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <TeacherInfoCard 
            name="Mr. Okonkwo" 
            subject="Mathematics" 
            rating="4.8" 
            reviews="45" 
            rate="500" 
            location="Lagos Island" 
            imgText="Okonkwo"
          />
          <TeacherInfoCard 
            name="Mrs. Adeyemi" 
            subject="English Language" 
            rating="4.9" 
            reviews="32" 
            rate="400" 
            location="Lekki" 
            imgText="Adeyemi"
          />
          <TeacherInfoCard 
            name="Dr. Chukwu" 
            subject="Physics & Chemistry" 
            rating="4.7" 
            reviews="28" 
            rate="800" 
            location="Victoria Island" 
            imgText="Chukwu"
          />
          <TeacherInfoCard 
            name="Miss Inyene" 
            subject="Biology & Health" 
            rating="4.8" 
            reviews="38" 
            rate="550" 
            location="Ikeja" 
            imgText="Inyene"
          />
          <TeacherInfoCard 
            name="Mr. Afolabi" 
            subject="History & Civics" 
            rating="4.9" 
            reviews="52" 
            rate="450" 
            location="Ikoyi" 
            imgText="Afolabi"
          />
        </div>
        <div className="text-center mt-8">
          <Link href="/search" className="inline-block bg-[#001A72] border-2 border-[#FFB81C] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#FFB81C] hover:text-[#001A72] transition">
            View All Teachers
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-12 text-center">Why Choose EDU-WINS?</h2>
        <div className="grid md:grid-cols-4 gap-6 justify-center">
          <FeatureCard icon="🔒" title="Secure & Safe" desc="OTP verification & filtered chat ensure safety" />
          <FeatureCard icon="⭐" title="Trusted Tutors" desc="Dynamic trust scores based on student reviews" />
          <FeatureCard icon="💰" title="Fair Payments" desc="Transparent split: 80% tutor, 15% platform, 5% welfare" />
          <FeatureCard icon="📱" title="Works Offline" desc="Progressive web app - install and access anywhere" />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-[#001A72] to-blue-400 rounded-xl p-12 text-white mb-16 text-center max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <StatItem value="250+" label="Active Tutors" />
          <StatItem value="500+" label="Happy Students" />
          <StatItem value="₦15M+" label="Paid Out" />
          <StatItem value="4.8★" label="Avg Rating" />
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-16 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-12 text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <StepItem number="1" title="Sign Up" desc="Create your account with email & phone verification" />
          <StepItem number="2" title="Find Match" desc="Search tutors by subject, location & hourly rate" color="bg-[#FFB81C]" />
          <StepItem number="3" title="Book Lesson" desc="Schedule lessons and pay securely via Paystack" />
          <StepItem number="4" title="Learn & Earn" desc="Complete lessons and build your trust score" color="bg-[#FFB81C]" />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-7xl mx-auto mb-16">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-gray-600 mb-8">Join thousands of students and tutors on EduWins</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/search" className="bg-[#001A72] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#001A72]/90 transition">
            Search Tutors Now
          </Link>
          <button className="bg-[#FFB81C] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#001A72]/90 transition">
            Watch Demo
          </button>
        </div>
      </div>
    </div>
  );
}

interface TeacherInfoCardProps {
  name: string;
  subject: string;
  rating: string;
  reviews: string;
  rate: string;
  location: string;
  imgText: string;
}

function TeacherInfoCard({ name, subject, rating, reviews, rate, location, imgText }: TeacherInfoCardProps): ReactElement {
  return (
    <div className="bg-white rounded-lg border-2 border-[#001A72] shadow-md overflow-hidden hover:shadow-lg hover:border-[#FFB81C] transition">
      <div className="bg-gradient-to-r from-[#001A72] to-[#FFB81C] p-6 text-center">
        <div className="flex justify-center mb-3">
          <img 
            src={`https://via.placeholder.com/100/001A72/FFFFFF?text=${imgText}`} 
            alt={name} 
            className="w-24 h-24 rounded-full border-4 border-white object-cover"
          />
        </div>
        <h3 className="text-xl font-bold text-white">{name}</h3>
        <p className="text-white/80">{subject}</p>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <span className="text-2xl font-bold text-[#001A72]">{rating}</span>
            <span className="text-yellow-500 ml-1">★</span>
          </div>
          <p className="text-sm text-gray-600">{reviews} reviews</p>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Hourly Rate:</span>
            <span className="font-bold text-lg">₦{rate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium">{location}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Link href="/search" className="block w-full bg-[#001A72] text-white py-2 rounded-lg hover:bg-[#001A72]/90 font-semibold transition text-center">
            View Profile & Book
          </Link>
          <button className="w-full bg-[#FFB81C] text-[#001A72] py-2 rounded-lg hover:bg-[#ffd06f] font-semibold transition">
            Send Message
          </button>
        </div>
        <div className="mt-4 text-center">
          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Verified Teacher
          </span>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps): ReactElement {
  return (
    <div className="bg-white p-8 rounded-lg shadow text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps): ReactElement {
  return (
    <div>
      <div className="text-4xl font-bold mb-2">{value}</div>
      <div className="text-white">{label}</div>
    </div>
  );
}

interface StepItemProps {
  number: string;
  title: string;
  desc: string;
  color?: string;
}

function StepItem({ number, title, desc, color = "bg-[#001A72]" }: StepItemProps): ReactElement {
  return (
    <div className="text-center">
      <div className={`${color} text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4 mx-auto`}>{number}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}
