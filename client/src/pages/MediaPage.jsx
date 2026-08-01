import { useState, useEffect } from 'react';
import { mediaApi } from '../api/modules/media.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { resolveMediaUrl } from '../api/axiosInstance';

export default function MediaPage() {
  const [mediaList, setMediaList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [editingMedia, setEditingMedia] = useState(null);
  const [altText, setAltText] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async (q = '') => {
    try {
      const { data } = await mediaApi.getAll({ search: q, limit: 100 });
      setMediaList(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    // Debounce ideally, but just fetch on enter or button click
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedia(search);
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      await mediaApi.upload(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      fetchMedia(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = null; // reset file input
    }
  };

  const openEdit = (media) => {
    setEditingMedia(media);
    setAltText(media.altText || '');
    setTitle(media.title || '');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await mediaApi.update(editingMedia.id, { altText, title });
      setEditingMedia(null);
      fetchMedia(search);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await mediaApi.delete(id);
      fetchMedia(search);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-display-md font-semibold text-ink">Media Library</h1>
        <div>
          <input
            type="file"
            id="file-upload"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center rounded-pill bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Files'}
          </Label>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <form onSubmit={onSearchSubmit} className="flex-1 max-w-sm flex space-x-2">
          <Input 
            placeholder="Search files..." 
            value={search} 
            onChange={handleSearch} 
            className="bg-canvas"
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {mediaList.map(media => (
          <Card key={media.id} className="overflow-hidden border-border bg-canvas hover:shadow-md transition-shadow group relative">
            <div className="aspect-square bg-canvas-parchment relative">
              {media.mimeType.startsWith('image/') ? (
                <img 
                  src={resolveMediaUrl(media.thumbnailUrl || media.publicUrl)} 
                  alt={media.altText || media.fileName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-muted-48">
                  {media.mimeType.split('/')[1].toUpperCase()}
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center space-y-2 transition-opacity">
                <Button size="sm" variant="secondary" onClick={() => openEdit(media)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(media.id)}>Delete</Button>
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-ink truncate" title={media.fileName}>{media.fileName}</p>
              <p className="text-[10px] text-ink-muted-80">{(media.size / 1024).toFixed(1)} KB</p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Input value={altText} onChange={e => setAltText(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingMedia(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
