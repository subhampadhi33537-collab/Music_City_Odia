import React from 'react';
import { Mic, Music, Headphones, Video, ShieldCheck, Cpu } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20 min-h-screen">
      
      {/* Intro section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 bg-studio-accent/10 border border-studio-accent/20 px-3 py-1 rounded-full text-xs font-semibold text-studio-accent uppercase tracking-wider">
            <span>About Music City Odia</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Odisha's Premier Music Recording & Dubbing Studio
          </h1>
          <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
            Based in Odisha, India, **Music City Odia** has been providing professional recording, vocal dubbing, mixing, mastering, and film editing services for over a decade. Our motto has always been simple: **"No.1 Quality Audio Sound in Odisha — Super Bass Sound Studio"**.
          </p>
          <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
            We work closely with vocalists, voiceover artists, video producers, and film directors to turn creative ideas into professional masterpieces. From hit Odia pop songs to cinematic movie dubs, we have everything you need under one roof.
          </p>
        </div>
        
        {/* Visual studio frame */}
        <div className="relative aspect-video lg:aspect-square bg-studio-card rounded-2xl border border-studio-border overflow-hidden shadow-2xl flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=600"
            alt="Studio Recording Booth"
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-studio-dark to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 p-4 glass rounded-xl border border-studio-border text-left">
            <span className="text-xs text-studio-accent font-bold uppercase tracking-wider">Live Sound Setup</span>
            <h4 className="text-white font-bold text-sm mt-0.5">High-Fidelity Acoustic Calibration</h4>
          </div>
        </div>
      </section>

      {/* Equipment Spec Section */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold text-white">Our Technical Setup</h2>
          <p className="text-gray-400 text-sm">
            We use industry-standard audio gear and recording software to deliver super bass audio fidelity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-studio-card border border-studio-border p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 bg-studio-border rounded-lg flex items-center justify-center text-studio-accent">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Hardware & Microphones</h3>
            <p className="text-sm text-studio-muted leading-relaxed">
              Equipped with Neumann U87, Rode NT1-A, and Shure SM7B condenser microphones running through preamps for warm, ultra-clean vocals.
            </p>
          </div>

          <div className="bg-studio-card border border-studio-border p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 bg-studio-border rounded-lg flex items-center justify-center text-studio-accent">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Workstation & DAWs</h3>
            <p className="text-sm text-studio-muted leading-relaxed">
              We process mixing and mastering in Cubase, Pro Tools, and Studio One. All tracks undergo advanced digital EQ analysis.
            </p>
          </div>

          <div className="bg-studio-card border border-studio-border p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 bg-studio-border rounded-lg flex items-center justify-center text-studio-accent">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Super Bass Monitors</h3>
            <p className="text-sm text-studio-muted leading-relaxed">
              Acoustic monitoring using Yamaha HS8 studio monitors and KRK Rokit systems, coupled with subwoofers for maximum bass fidelity.
            </p>
          </div>
        </div>
      </section>

      {/* Production Services details */}
      <section className="glass border border-studio-border rounded-2xl p-6 sm:p-10 space-y-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">Why Choose Music City Odia?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold">Unrivaled Quality (No.1 in Odisha)</h4>
              <p className="text-gray-400 text-sm mt-1">
                We calibrate room reflections and microphone patterns to make sure vocals sit perfectly in the stereo mix.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 shrink-0 mt-0.5">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold">Odia Language & Script Support</h4>
              <p className="text-gray-400 text-sm mt-1">
                We celebrate Odia culture. We print, catalog, database, and produce traditional, local, and modern tracks with proper UTF-8 font rendering.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 shrink-0 mt-0.5">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold">Complete Video Coverage</h4>
              <p className="text-gray-400 text-sm mt-1">
                From 4K cameras to professional video editors, we produce cinematic music videos ready for direct distribution on YouTube.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 shrink-0 mt-0.5">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold">Client Support & Revisions</h4>
              <p className="text-gray-400 text-sm mt-1">
                We work closely with you. If a mix needs vocal balancing or volume adjustments, we provide unlimited support.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
