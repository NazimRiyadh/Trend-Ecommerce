import { useState, useEffect } from 'react';
import { brandApi } from '../api/modules/brand.api';
import { mediaApi } from '../api/modules/media.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function BrandPage() {
  const [brands, setBrands] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [editingBrand, setEditingBrand] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoId, setLogoId] = useState('none');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    fetchBrands();
    fetchMedia();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data } = await brandApi.getAll({ limit: 100 });
      setBrands(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMedia = async () => {
    try {
      const { data } = await mediaApi.getAll({ limit: 100 });
      setMediaList(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setEditingBrand(null);
    setName('');
    setDescription('');
    setLogoId('none');
    setStatus('active');
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setDescription(brand.description || '');
    setLogoId(brand.logoId ? brand.logoId.toString() : 'none');
    setStatus(brand.status);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        description,
        status,
      };
      if (logoId !== 'none') payload.logoId = logoId;
      else payload.logoId = null;

      if (editingBrand) {
        await brandApi.update(editingBrand.id, payload);
      } else {
        await brandApi.create(payload);
      }
      resetForm();
      fetchBrands();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete brand?')) return;
    try {
      await brandApi.delete(id);
      fetchBrands();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-display-md font-semibold text-ink">Brands</h1>
        {!editingBrand && (
          <Button onClick={() => setEditingBrand({})} className="rounded-pill bg-primary hover:bg-primary/90 text-white">
            Create New Brand
          </Button>
        )}
      </div>

      {editingBrand !== null && (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="bg-canvas-parchment border-b border-border py-4">
            <CardTitle className="text-sm font-semibold text-ink">
              {editingBrand.id ? 'Edit Brand' : 'Create Brand'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label>Logo (Media Library)</Label>
                  <Select value={logoId} onValueChange={setLogoId}>
                    <SelectTrigger><SelectValue placeholder="No logo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No logo</SelectItem>
                      {mediaList.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.fileName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={loading} className="rounded-pill bg-primary hover:bg-primary/90 text-white">
                  {loading ? 'Saving...' : 'Save Brand'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingBrand === null && (
        <Card className="rounded-xl border-border shadow-sm">
          <Table>
            <TableHeader className="bg-canvas-parchment">
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Brand Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    {brand.logoId ? (
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-[10px] text-primary">Logo</div>
                    ) : (
                      <div className="h-8 w-8 rounded-md bg-canvas-parchment flex items-center justify-center text-xs text-ink-muted-80">N/A</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-ink">{brand.name}</TableCell>
                  <TableCell>{brand.slug}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${brand.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {brand.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(brand)} className="text-primary hover:bg-primary/10">Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(brand.id)} className="text-destructive hover:bg-destructive/10">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
