import { useState, useEffect } from 'react';
import { categoryApi } from '../api/modules/category.api';
import { mediaApi } from '../api/modules/media.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CategoryPage() {
  const [categories, setCategories] = useState([]); // tree
  const [flatCategories, setFlatCategories] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('none');
  const [mediaId, setMediaId] = useState('none');
  const [status, setStatus] = useState('active');
  const [sortOrder, setSortOrder] = useState('0');

  useEffect(() => {
    fetchCategories();
    fetchMedia();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await categoryApi.getTree();
      setCategories(data.data);
      
      const flat = [];
      const flatten = (nodes, depth = 0) => {
        nodes.forEach(node => {
          flat.push({ ...node, depth });
          if (node.children) flatten(node.children, depth + 1);
        });
      };
      flatten(data.data);
      setFlatCategories(flat);
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
    setEditingCategory(null);
    setName('');
    setDescription('');
    setParentId('none');
    setMediaId('none');
    setStatus('active');
    setSortOrder('0');
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setParentId(cat.parentId ? cat.parentId.toString() : 'none');
    setMediaId(cat.imageId ? cat.imageId.toString() : 'none');
    setStatus(cat.isActive ? 'active' : 'inactive');
    setSortOrder(cat.sortOrder.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        description,
        isActive: status === 'active',
        sortOrder: parseInt(sortOrder, 10)
      };
      if (parentId !== 'none') payload.parentId = parentId;
      else payload.parentId = null;
      if (mediaId !== 'none') payload.imageId = mediaId;
      else payload.imageId = null;

      if (editingCategory) {
        await categoryApi.update(editingCategory.id, payload);
      } else {
        await categoryApi.create(payload);
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete category?')) return;
    try {
      await categoryApi.delete(id);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-display-md font-semibold text-ink">Categories</h1>
        {!editingCategory && (
          <Button onClick={() => setEditingCategory({})} className="rounded-pill bg-primary hover:bg-primary/90 text-white">
            Create New Category
          </Button>
        )}
      </div>

      {editingCategory !== null && (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="bg-canvas-parchment border-b border-border py-4">
            <CardTitle className="text-sm font-semibold text-ink">
              {editingCategory.id ? 'Edit Category' : 'Create Category'}
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
                  <Label>Parent Category</Label>
                  <Select value={parentId} onValueChange={setParentId}>
                    <SelectTrigger><SelectValue placeholder="None (Root)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Root)</SelectItem>
                      {flatCategories.filter(c => c.id !== editingCategory?.id).map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {'—'.repeat(c.depth)} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Image (Media Library)</Label>
                  <Select value={mediaId} onValueChange={setMediaId}>
                    <SelectTrigger><SelectValue placeholder="No image" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No image</SelectItem>
                      {mediaList.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.fileName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
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
                  {loading ? 'Saving...' : 'Save Category'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingCategory === null && (
        <Card className="rounded-xl border-border shadow-sm">
          <Table>
            <TableHeader className="bg-canvas-parchment">
              <TableRow>
                <TableHead>Category Name (Tree)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatCategories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium text-ink">
                    <span style={{ marginLeft: `${cat.depth * 20}px` }}>
                      {cat.depth > 0 && '└─ '}
                      {cat.name}
                    </span>
                  </TableCell>
                  <TableCell>{cat.slug}</TableCell>
                  <TableCell>{cat.sortOrder}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {cat.isActive ? 'active' : 'inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)} className="text-primary hover:bg-primary/10">Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)} className="text-destructive hover:bg-destructive/10">Delete</Button>
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
