'use client'

import React, { useState } from 'react'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function About() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const paragraphContent = [
    "The love boat the blue lagoon back packers new to cruise home is where the anchor drops sundeck. Cruise life shore tours singles mingle whale shark diving the road less travelled poolside family holiday like no place on earth collect moments not things.", "Chilled towels island time Vanuatu not quite Fiji thrill seekers Numea to live is to travelled rusty dancemoves. Cruise eat sleep repeat born to wander allure of the seas vitamin sea sunset drinks sea days the bird dance. Live life one cruise at a time New Caledonia vacation mood on cruise time trip of a lifetime romance at sea. Find your bliss the edge oasis pan Pacific adventure bound cruiselings changes in latitudes, changes in attitudes great adventure. Three months in Asia gap year let the sea set you free port calls great barrier reef another day in paradise the scenic route. Endless horizon a new view every day paradise island snorkel dive Asian adventure captain's table languid afternoons. Crystal waters milkshake seas the day salt grill cruise insider choose your own adventure pirate speak endless summer gypsy life."
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact/contact`, formData)
      
      if (response.data.statusCode === 200) {
        toast.success(response.data.message || 'Message sent successfully!')
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        })
      } else {
        toast.error(response.data.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Contact form submission error:', error)
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data?.message || 'Failed to send message')
      } else {
        toast.error('Unable to connect to server')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar/>
      <div className="px-6 md:px-16 py-12 max-w-7xl mx-auto text-gray-800">
        {/* Hero Heading */}
        <h1 className="text-3xl md:text-4xl font-bold mb-8">About I AM BETTER THAN ME</h1>

        {/* Paragraph Block */}
        <p className="text-base md:text-lg mb-6">{paragraphContent[0]}</p>
        <p className="text-base md:text-lg mb-6">{paragraphContent[1]}</p>

        {/* Image Section */}
        <div className="my-10 flex justify-center">
          <img
            src="/assets/hero-about_img.png"
            alt="image"
            className="w-full max-w-3xl rounded-lg shadow-lg"
          />
        </div>

        {/* Bold Quote Section */}
        <p className="text-base md:text-lg font-semibold mb-6 text-black-800">
        The love boat the blue lagoon back packers new to cruise home is where the anchor drops sundeck. Cruise life shore tours singles mingle whale shark diving the road less travelled poolside family holiday like no place on earth collect moments not things. 
        </p>

        {/* Bullet Points */}
        <ul className="list-disc list-inside mb-8 ml-5 space-y-2">
          <li>Home is where the anchor drops endless horizon</li>
          <li>Pacific adventure out of Vanuatu</li>
          <li>Chilled breeze and long views</li>
          <li>The love boat still sails</li>
        </ul>

        {/*Paragraphs */}
        <p className="text-base md:text-lg mb-6">{paragraphContent[0]}</p>
        <p className="text-base md:text-lg mb-6">{paragraphContent[1]}</p>
        <p className="text-base md:text-lg mb-6">{paragraphContent[0]}</p>
        <p className="text-base md:text-lg mb-6">{paragraphContent[1]}</p>

        {/* Contact Form */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Contact us</h2>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Margaret Qerteach"
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:ring-black focus:border-black"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="meggy.qeri@gmail.com"
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:ring-black focus:border-black"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Public relations"
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:ring-black focus:border-black"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                placeholder="Your message here..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:ring-black focus:border-black"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
      <Footer/>
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  )
}
