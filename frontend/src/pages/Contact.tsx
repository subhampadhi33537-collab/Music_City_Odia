import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'recording',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await api.bookings.submit(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', service: 'recording', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking request.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 min-h-screen">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Contact Our Studio</h1>
        <p className="text-studio-muted text-sm sm:text-base">
          Book a recording slot, request voice dubbing, or ask for song mastering packages.
        </p>
      </div>

      {/* Grid section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        
        {/* Contact details card - 5 cols */}
        <div className="lg:col-span-5 bg-studio-card border border-studio-border p-8 rounded-2xl flex flex-col justify-between space-y-8 text-left">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Get in Touch</h3>
            <p className="text-sm text-studio-muted leading-relaxed">
              We operate 7 days a week. Feel free to call us or write to us directly to check slot availability.
            </p>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 bg-studio-border rounded-lg flex items-center justify-center text-studio-accent shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-studio-muted block">Call Directly</span>
                  <a href="tel:9937987978" className="text-white hover:text-studio-accent font-semibold transition-colors">
                    +91 9937987978
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 bg-studio-border rounded-lg flex items-center justify-center text-studio-accent shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-studio-muted block">Email Support</span>
                  <a href="mailto:musiccityodia@gmail.com" className="text-white hover:text-studio-accent font-semibold transition-colors break-all">
                    musiccityodia@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 bg-studio-border rounded-lg flex items-center justify-center text-studio-accent shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-studio-muted block">Studio Address</span>
                  <span className="text-white font-medium">Odisha, India</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-studio-border pt-6">
            <span className="text-xs text-studio-muted uppercase tracking-wider block font-semibold mb-2">Our Operating Hours</span>
            <p className="text-sm text-white">Monday – Sunday: <span className="text-studio-gold">9:00 AM – 9:00 PM</span></p>
          </div>
        </div>

        {/* Contact Form - 7 cols */}
        <div className="lg:col-span-7 glass border border-studio-border p-6 sm:p-8 rounded-2xl text-left">
          <h3 className="text-xl font-bold text-white mb-6">Send a Booking Message</h3>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start space-x-2 text-sm mb-6">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              <h4 className="text-xl font-bold text-white">Message Sent Successfully!</h4>
              <p className="text-gray-400 text-sm max-w-sm">
                Thank you for contacting Music City Odia Studio. Our coordinator will contact you back on your phone number shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full bg-studio-card border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full bg-studio-card border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Email Address (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="w-full bg-studio-card border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Required Service</label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full bg-studio-card border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-studio-accent/50"
                >
                  <option value="recording">Song Vocal Recording</option>
                  <option value="dubbing">Voice Dubbing</option>
                  <option value="mixing">Audio Mixing & Mastering</option>
                  <option value="editing">Camera & Film Editing</option>
                  <option value="general">Other / General Query</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Your Message</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your recording request or question..."
                  className="w-full bg-studio-card border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-studio-accent hover:bg-studio-accent/90 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-studio-accent/20 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : 'Submit Booking Request'}</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
};
