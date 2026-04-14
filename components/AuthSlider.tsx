'use client';

import { useState, useEffect } from 'react';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2000&auto=format&fit=crop',
    title: 'The Perfect Match for Your Child',
    text: 'We understand that every child learns differently. Our platform is designed to help parents find verified professional teachers who seamlessly fit their child\'s unique learning style and personality.',
  },
  {
    image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=2000&auto=format&fit=crop',
    title: 'Quality Education, Verified',
    text: 'Say goodbye to guesswork. Every tutor on our platform undergoes a rigorous vetting process so you can have complete peace of mind about who is mentoring your child.',
  },
  {
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop',
    title: 'Monitor Progress Seamlessly',
    text: 'Stay entirely informed on your child\'s academic journey. Approve lesson logs and monitor progress reports directly from your specialized parent dashboard.',
  }
];

export default function AuthSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-primary">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-out"
            style={{
              backgroundImage: `url('${slide.image}')`,
              transform: index === current ? 'scale(1.05)' : 'scale(1)'
            }}
          />

          {/* Accent Overlays: A deep primary color tint + a strong bottom gradient for text readability */}
          <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />

          {/* Floating Text Box */}
          <div className="absolute bottom-16 left-12 right-12">
            <div className={`transform transition-all duration-1000 delay-300 ${index === current ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl">
                <h3 className="text-xl lg:text-3xl font-bold text-white mb-4 tracking-tight">
                  {slide.title}
                </h3>
                <p className="text-white/90 text-sm lg:text-base leading-relaxed">
                  {slide.text}
                </p>

                {/* Progress dot indicators */}
                <div className="flex gap-2 mt-8">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrent(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-white' : 'w-4 bg-white/40 hover:bg-white/70'
                        }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
