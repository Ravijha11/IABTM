'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const HowItWorksPage: React.FC = () => {
  // Contact form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: 'Public relations',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const subjects = [
    'General inquiry',
    'Public relations',
    'Support',
    'Feedback',
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact/how-it-works`, form);
      
      if (response.data.statusCode === 200) {
        toast.success(response.data.message || 'Message sent successfully!');
        // Reset form
        setForm({
          name: '',
          email: '',
          subject: 'Public relations',
          message: '',
        });
      } else {
        toast.error(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('How it works form submission error:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data?.message || 'Failed to send message');
      } else {
        toast.error('Unable to connect to server');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-12 items-start w-full">
            {/* Main Content */}
            <div className="flex-1 min-w-0 w-full lg:max-w-[1000px] flex flex-col gap-y-10">
              {/* Main Heading */}
              <h1
                className="text-[32px] font-bold leading-[120%] text-[#2e2e2e]"
                style={{ fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              >
                About I AM BETTER THAN ME
              </h1>

              {/* First Paragraph */}
              <p className="text-base leading-relaxed text-[#222]">
                The love boat the blue lagoon back packers new to cruise home is where the anchor drops sundeck. Cruise life shore tours singles mingle whale shark diving the road less travelled poolside family holiday like no place on earth collect moments not things.
              </p>

              {/* Second Paragraph */}
              <p className="text-base leading-relaxed text-[#222]">
                Chilled towels island time Vanuatu not quite Fiji thrill seekers Numea to live is to travelled rusty dancemoves. Cruise eat sleep repeat born to wander allure of the seas vitamin sea sunset drinks sea days the bird dance. Live life one cruise at a time New Caledonia vacation mood on cruise time trip of a lifetime romance at sea. Find your bliss the edge oasis pan Pacific adventure bound cruiselings changes in latitudes, changes in attitudes great adventure. Three months in Asia gap year let the sea set you free port calls great barrier reef another day in paradise the scenic route. Endless horizon a new view every day paradise island snorkel dive Asian adventure captain's table languid afternoons. Crystal waters milkshake seas the day salt grill cruise insider choose your own adventure pirate speak endless summer gypsy life.
              </p>

              {/* Image Section */}
              <div>
                <div className="relative w-full h-[220px] sm:h-[300px] md:h-[340px] lg:h-[400px] xl:h-[440px] 2xl:h-[480px] mx-auto">
                  <Image
                    src="/assets/Rectangle 261.png"
                    alt="IABTM How it works illustration"
                    fill
                    className="object-cover rounded-lg"
                    priority
                  />
                </div>
              </div>

              {/* Bolded Subheading and Bullet List */}
              <div>
                <div className="font-bold text-base mb-2">
                  The love boat the blue lagoon back packers new to cruise home is where the anchor drops sundeck. Cruise life shore tours singles mingle whale shark diving the road less travelled poolside family holiday like no place on earth collect moments not things.
                </div>
                <ul className="list-disc pl-6 text-base text-[#222]">
                  <li>Home is where the anchor drops endless horizon</li>
                  <li>Pacific adventure bound cruiselings</li>
                  <li>Chilled towels island time Vanuatu</li>
                  <li>The love boat salt grill oasis</li>
                </ul>
              </div>

              {/* More Paragraphs with Bolded Subheading */}
              <div>
                <div className="text-base leading-relaxed text-[#222] mb-2">
                  The love boat the blue lagoon back packers new to cruise home is where the anchor drops sundeck. Cruise life shore tours singles mingle whale shark diving the road less travelled poolside family holiday like no place on earth collect moments not things.
                </div>
                <p className="text-base leading-relaxed text-[#222] mb-2">
                  Chilled towels island time Vanuatu not quite Fiji thrill seekers Numea to live is to travelled rusty dancemoves. Cruise eat sleep repeat born to wander allure of the seas vitamin sea sunset drinks sea days the bird dance. Live life one cruise at a time New Caledonia vacation mood on cruise time trip of a lifetime romance at sea. Find your bliss the edge oasis pan Pacific adventure bound cruiselings changes in latitudes, changes in attitudes great adventure. Three months in Asia gap year let the sea set you free port calls great barrier reef another day in paradise the scenic route. Endless horizon a new view every day paradise island snorkel dive Asian adventure captain's table languid afternoons. Crystal waters milkshake seas the day salt grill cruise insider choose your own adventure pirate speak endless summer gypsy life.
                </p>
              </div>
              <div>
                <div className="text-base leading-relaxed text-[#222] mb-2">
                  The love boat the blue lagoon back packers new to cruise home is where the anchor drops sundeck. Cruise life shore tours singles mingle whale shark diving the road less travelled poolside family holiday like no place on earth collect moments not things.
                </div>
                <p className="text-base leading-relaxed text-[#222] mb-2">
                  Chilled towels island time Vanuatu not quite Fiji thrill seekers Numea to live is to travelled rusty dancemoves. Cruise eat sleep repeat born to wander allure of the seas vitamin sea sunset drinks sea days the bird dance. Live life one cruise at a time New Caledonia vacation mood on cruise time trip of a lifetime romance at sea. Find your bliss the edge oasis pan Pacific adventure bound cruiselings changes in latitudes, changes in attitudes great adventure. Three months in Asia gap year let the sea set you free port calls great barrier reef another day in paradise the scenic route. Endless horizon a new view every day paradise island snorkel dive Asian adventure captain's table languid afternoons. Crystal waters milkshake seas the day salt grill cruise insider choose your own adventure pirate speak endless summer gypsy life.
                </p>
              </div>
            </div>

            {/* Contact Us Section */}
            <div className="w-full lg:w-[340px] xl:w-[360px] flex-shrink-0 lg:pl-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Satoshi, sans-serif' }}>Contact us</h2>
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-6"
                  style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 400, fontSize: 16, lineHeight: '120%', letterSpacing: 0 }}
                >
                  <div>
                    <label className="block mb-1">Your name</label>
                    <input
                      className="w-full rounded-md px-4 py-2 bg-white border border-gray-300 text-black focus:outline-none"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full rounded-md px-4 py-2 bg-white border border-gray-300 text-black focus:outline-none"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Subject</label>
                    <select
                      className="w-full rounded-md px-4 py-2 bg-white border border-gray-300 text-black focus:outline-none"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      required
                    >
                      {subjects.map(sub => (
                        <option key={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Message</label>
                    <textarea
                      className="w-full rounded-md px-4 py-2 bg-white border border-gray-300 text-black focus:outline-none"
                      rows={4}
                      placeholder="Your message here..."
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 px-8 py-2 bg-[#222] text-white rounded-full font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Submit'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default HowItWorksPage; 