import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Upload, FileText, Music, Image, Check, AlertCircle } from 'lucide-react';

export const AdminNewSong: React.FC = () => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<any[]>([]);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [description, setDescription] = useState('');
  const [genreId, setGenreId] = useState('');
  const [price, setPrice] = useState('19'); // Default typical Odia studio single price
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  
  // File fields
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [fullFile, setFullFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const data = await api.genres.list();
        setGenres(data);
        if (data.length > 0) setGenreId(data[0].id);
      } catch (err) {
        console.error('Error loading genres:', err);
      }
    };
    loadGenres();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'preview' | 'full') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'cover') setCoverFile(file);
      else if (type === 'preview') setPreviewFile(file);
      else if (type === 'full') setFullFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!genreId) {
      setError('Please select a genre');
      return;
    }
    if (!coverFile) {
      setError('Please select a cover image artwork file');
      return;
    }
    if (!previewFile) {
      setError('Please select a 30-second preview MP3 clip file');
      return;
    }
    if (!fullFile) {
      setError('Please select the full master quality audio MP3 file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('description', description);
      formData.append('genre_id', genreId);
      formData.append('price', price);
      formData.append('is_published', String(isPublished));
      formData.append('is_featured', String(isFeatured));
      
      formData.append('cover_file', coverFile);
      formData.append('preview_file', previewFile);
      formData.append('full_file', fullFile);

      await api.admin.uploadSong(formData);
      navigate('/admin/songs');
    } catch (err: any) {
      setError(err.message || 'File upload failed. Make sure size matches server requirements.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen text-left">
      
      {/* Back button */}
      <div>
        <Link to="/admin/songs" className="inline-flex items-center text-gray-400 hover:text-white text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Songs
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-white">Upload Studio Song</h1>
        <p className="text-studio-muted text-sm mt-1">Publish new songs to the Music City Odia store.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Metadata Details - 7 cols */}
        <div className="lg:col-span-7 glass border border-studio-border p-6 sm:p-8 rounded-xl space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-studio-border pb-2">Song Metadata</h3>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400">Song Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sambalpuri Dhol Mix"
              className="w-full bg-studio-card border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400">Artist / Singer Name</label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. Asima Panda"
              className="w-full bg-studio-card border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Genre Category</label>
              <select
                required
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                className="w-full bg-studio-card border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-studio-accent/50"
              >
                {genres.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Price (INR)</label>
              <input
                type="number"
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="19"
                className="w-full bg-studio-card border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-studio-accent/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400">Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide information about mixing engineers, vocal patterns, or recording background..."
              className="w-full bg-studio-card border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent/50"
            ></textarea>
          </div>

          {/* Flags */}
          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded bg-studio-card border-studio-border text-studio-accent focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span>Published Immediately</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded bg-studio-card border-studio-border text-studio-accent focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span>Feature on Home Page</span>
            </label>
          </div>
        </div>

        {/* Media Asset Inputs - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Cover Art input */}
          <div className="bg-studio-card border border-studio-border p-5 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Image className="w-4 h-4 text-studio-accent" />
              <span>Cover Image</span>
            </h4>
            <div className="relative border border-dashed border-studio-border/60 rounded-lg p-4 text-center hover:bg-studio-border/10 transition-colors cursor-pointer">
              <input
                type="file"
                required
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'cover')}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <Upload className="w-6 h-6 text-studio-muted mx-auto mb-1.5" />
              <p className="text-xs text-studio-muted">Drag or click to choose artwork image</p>
              {coverFile && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-2 truncate flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> {coverFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Preview clip input */}
          <div className="bg-studio-card border border-studio-border p-5 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Music className="w-4 h-4 text-studio-accent" />
              <span>30-Second Preview Clip</span>
            </h4>
            <div className="relative border border-dashed border-studio-border/60 rounded-lg p-4 text-center hover:bg-studio-border/10 transition-colors cursor-pointer">
              <input
                type="file"
                required
                accept="audio/mpeg,audio/mp3"
                onChange={(e) => handleFileChange(e, 'preview')}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <Upload className="w-6 h-6 text-studio-muted mx-auto mb-1.5" />
              <p className="text-xs text-studio-muted">Upload 30s audio preview MP3 file</p>
              {previewFile && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-2 truncate flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> {previewFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Full Song audio input */}
          <div className="bg-studio-card border border-studio-border p-5 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-studio-accent" />
              <span>Full Master Song File</span>
            </h4>
            <div className="relative border border-dashed border-studio-border/60 rounded-lg p-4 text-center hover:bg-studio-border/10 transition-colors cursor-pointer">
              <input
                type="file"
                required
                accept="audio/mpeg,audio/mp3"
                onChange={(e) => handleFileChange(e, 'full')}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <Upload className="w-6 h-6 text-studio-muted mx-auto mb-1.5" />
              <p className="text-xs text-studio-muted">Upload full duration studio master MP3 file</p>
              {fullFile && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-2 truncate flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> {fullFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-studio-accent hover:bg-studio-accent/90 text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-studio-accent/20 disabled:opacity-50"
          >
            {loading ? 'Uploading Files...' : 'Publish & Save Song'}
          </button>

        </div>

      </form>
    </div>
  );
};
