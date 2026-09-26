import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  ArrowLeft,
  Upload,
  FileText,
  Music,
  Image as ImageIcon,
  Check,
  AlertCircle,
  ExternalLink,
  HardDrive,
  Disc,
  Link as LinkIcon
} from 'lucide-react';

export const AdminNewSong: React.FC = () => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<any[]>([]);
  
  // Metadata fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genreId, setGenreId] = useState('');
  const [price, setPrice] = useState('19');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [description, setDescription] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Google Drive option
  const [driveFolderId] = useState('1zur8UsA64ko5cBtXXLQl0aInPLmI2U8m');
  const [driveWebLink, setDriveWebLink] = useState('');
  
  // Media Files
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [fullFile, setFullFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      if (type === 'cover') {
        setCoverFile(file);
        setCoverPreviewUrl(URL.createObjectURL(file));
      } else if (type === 'preview') {
        setPreviewFile(file);
      } else if (type === 'full') {
        setFullFile(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setError('Please enter a song title');
      return;
    }
    if (!artist.trim()) {
      setError('Please enter the artist/singer name');
      return;
    }
    if (!genreId) {
      setError('Please select a genre category');
      return;
    }
    if (!fullFile && !driveWebLink.trim()) {
      setError('Please either select a master audio file to upload to Google Drive, or provide an existing Google Drive file link/ID');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('artist', artist.trim());
      if (album.trim()) formData.append('album', album.trim());
      if (genreId) formData.append('genre_id', genreId);
      formData.append('price', price);
      if (durationSeconds) formData.append('duration_seconds', durationSeconds);
      if (description.trim()) formData.append('description', description.trim());
      if (lyrics.trim()) formData.append('lyrics', lyrics.trim());
      formData.append('is_published', String(isPublished));
      formData.append('is_featured', String(isFeatured));
      
      if (driveWebLink.trim()) {
        formData.append('drive_web_link', driveWebLink.trim());
      }
      
      if (coverFile) {
        formData.append('cover_file', coverFile);
      }
      if (previewFile) {
        formData.append('preview_file', previewFile);
      }
      if (fullFile) {
        formData.append('full_file', fullFile);
      }

      await api.admin.uploadSong(formData);
      setSuccessMsg('Song successfully uploaded to Google Drive and published in catalog!');
      setTimeout(() => {
        navigate('/admin/songs');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'File upload failed. Please verify connection and file format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen text-left">
      
      {/* Navigation & Header */}
      <div>
        <Link to="/admin/songs" className="inline-flex items-center text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Song Inventory
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-2.5">
            <Disc className="w-8 h-8 text-studio-accent animate-spin-slow" style={{ animationDuration: '8s' }} />
            Upload Studio Track
          </h1>
          <p className="text-studio-muted text-sm mt-1">
            Store master audio in Google Drive cloud storage and register metadata with Odia lyrics in PostgreSQL.
          </p>
        </div>

        {/* Google Drive Status Pill */}
        <a
          href={`https://drive.google.com/drive/folders/${driveFolderId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-3d-secondary inline-flex items-center space-x-2 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold shrink-0"
        >
          <HardDrive className="w-4 h-4" />
          <span>Drive: {driveFolderId.slice(0, 10)}...</span>
          <ExternalLink className="w-3.5 h-3.5 ml-1" />
        </a>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start space-x-3">
          <Check className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Song Metadata Column - 7 Cols */}
        <div className="lg:col-span-7 glass-3d p-6 sm:p-8 rounded-2xl space-y-5">
          <h3 className="text-xs font-bold text-studio-accent uppercase tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-studio-accent" /> Song Metadata & Odia Lyrics
          </h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Song Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sambalpuri Dhol Mix (Super Bass)"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent transition-colors shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Artist / Singer *</label>
              <input
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Asima Panda, Humanne Sagar"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent transition-colors shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Album Name</label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="e.g. Super Bass Odia Vol. 1"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent transition-colors shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Genre Category *</label>
              <select
                required
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                className="w-full bg-[#151620] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-studio-accent transition-colors"
              >
                {genres.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Price (INR ₹)</label>
              <input
                type="number"
                required
                min={0}
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="19"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-studio-accent transition-colors shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Duration (sec)</label>
              <input
                type="number"
                min={0}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                placeholder="240"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-studio-accent transition-colors shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Song Description / Studio Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Recording engineers, vocal styling, or studio instruments used..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent transition-colors shadow-inner"
            ></textarea>
          </div>

          {/* Lyrics Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300">Lyrics / ଗୀତ ଲିରିକ୍ସ</label>
              <span className="text-[11px] text-studio-gold font-medium">Odia script or Roman English</span>
            </div>
            <textarea
              rows={4}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="ମୁଁ ଓଡ଼ିଆ ଟୋକା, ଛାତି ମୋର ଚଉଡ଼ା...\nPaste complete song lyrics here for public display in music player..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent transition-colors font-mono text-xs shadow-inner"
            ></textarea>
          </div>

          {/* Visibility Flags */}
          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded bg-white/10 border-white/20 text-studio-accent focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-xs">Publish to Store Immediately</span>
            </label>

            <label className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded bg-white/10 border-white/20 text-studio-accent focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-xs">Feature on Homepage Hero</span>
            </label>
          </div>
        </div>

        {/* Media & Google Drive Storage Column - 5 Cols */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Google Drive Audio Upload Box */}
          <div className="glass-3d glow-border-emerald p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Google Drive Storage</span>
              </h4>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                Active Vault
              </span>
            </div>

            <p className="text-xs text-studio-muted">
              Audio uploaded here will be automatically placed into the configured Google Drive folder.
            </p>

            {/* Audio Upload File Area */}
            <div className="relative border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-5 text-center transition-all cursor-pointer bg-emerald-950/20 group">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileChange(e, 'full')}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              <Upload className="w-7 h-7 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-gray-200">Click or drag master audio file to upload</p>
              <p className="text-[11px] text-studio-muted mt-1">MP3, WAV, FLAC, M4A (Lossless Audio)</p>
              {fullFile && (
                <div className="mt-3 inline-flex items-center text-xs text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-lg shadow-sm">
                  <Check className="w-4 h-4 mr-1.5 text-emerald-400" /> {fullFile.name} ({(fullFile.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
              )}
            </div>

            {/* Alternative: Direct Drive Link */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-studio-accent" />
                <span>Or Enter Existing Google Drive Link / ID:</span>
              </label>
              <input
                type="text"
                value={driveWebLink}
                onChange={(e) => setDriveWebLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/1.../view"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-studio-accent shadow-inner"
              />
            </div>
          </div>

          {/* Cover Art Artwork Input with 3D Preview */}
          <div className="glass-3d p-6 rounded-2xl space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-studio-accent" />
              <span>Album Cover Artwork</span>
            </h4>
            
            <div className="relative border border-dashed border-white/15 hover:border-studio-accent/50 rounded-xl p-4 text-center transition-all cursor-pointer bg-white/[0.02]">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'cover')}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              {coverPreviewUrl ? (
                <div className="flex items-center justify-center space-x-3.5">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-xl preserve-3d">
                    <img src={coverPreviewUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left text-xs">
                    <p className="text-emerald-400 font-bold">{coverFile?.name}</p>
                    <p className="text-studio-muted text-[11px]">Click to replace artwork</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-studio-muted mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-gray-300">Choose square artwork image</p>
                  <p className="text-[11px] text-studio-muted">JPG, PNG, WebP (1:1 recommended)</p>
                </>
              )}
            </div>
          </div>

          {/* Optional 30s Preview Clip */}
          <div className="glass-3d p-5 rounded-2xl space-y-2">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <Music className="w-4 h-4 text-studio-gold" />
              <span>30-Second Preview (Optional)</span>
            </h4>
            <p className="text-[11px] text-studio-muted">
              If omitted, preview is streamed directly from Google Drive stream endpoint.
            </p>
            <div className="relative border border-dashed border-white/10 hover:border-studio-gold/50 rounded-xl p-3 text-center transition-all cursor-pointer bg-white/[0.02]">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileChange(e, 'preview')}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              <p className="text-xs text-gray-400">Upload custom 30s MP3 preview (optional)</p>
              {previewFile && (
                <p className="text-[11px] text-studio-gold font-bold mt-1">
                  ✓ {previewFile.name}
                </p>
              )}
            </div>
          </div>

          {/* 3D Tactile Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-3d w-full bg-studio-accent text-white font-extrabold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <span className="animate-pulse">Uploading to Google Drive & Saving...</span>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Save Song to Google Drive</span>
              </>
            )}
          </button>

        </div>

      </form>
    </div>
  );
};
