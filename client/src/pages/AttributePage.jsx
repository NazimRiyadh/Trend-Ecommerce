import { useState, useEffect } from 'react';
import { attributeApi } from '../api/modules/attribute.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AttributePage() {
  const [attributes, setAttributes] = useState([]);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('dropdown');
  const [values, setValues] = useState([]);

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const { data } = await attributeApi.getAll({ limit: 100 });
      setAttributes(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setEditingAttribute(null);
    setName('');
    setType('dropdown');
    setValues([]);
  };

  const handleEdit = (attr) => {
    setEditingAttribute(attr);
    setName(attr.name);
    setType(attr.type);
    setValues(attr.values || []);
  };

  const addValue = () => {
    setValues([...values, { value: '', referenceValue: '' }]);
  };

  const updateValue = (index, field, val) => {
    const newValues = [...values];
    newValues[index][field] = val;
    setValues(newValues);
  };

  const removeValue = (index) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    setValues(newValues);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        type,
        values: values.map(v => ({
          id: v.id, // pass id if it exists for updating
          value: v.value,
          referenceValue: v.referenceValue || null
        }))
      };

      if (editingAttribute) {
        await attributeApi.update(editingAttribute.id, payload);
      } else {
        await attributeApi.create(payload);
      }
      resetForm();
      fetchAttributes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete attribute?')) return;
    try {
      await attributeApi.delete(id);
      fetchAttributes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-display-md font-semibold text-ink">Attributes</h1>
        {!editingAttribute && (
          <Button onClick={() => setEditingAttribute({})} className="rounded-pill bg-primary hover:bg-primary/90 text-white">
            Create New Attribute
          </Button>
        )}
      </div>

      {editingAttribute !== null && (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="bg-canvas-parchment border-b border-border py-4">
            <CardTitle className="text-sm font-semibold text-ink">
              {editingAttribute.id ? 'Edit Attribute' : 'Create Attribute'}
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
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="radio">Radio</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="colour_swatch">Colour Swatch</SelectItem>
                      <SelectItem value="image_swatch">Image Swatch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Values</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addValue}>Add Value</Button>
                </div>
                {values.length === 0 && <p className="text-sm text-ink-muted-80">No values added yet.</p>}
                {values.map((v, i) => (
                  <div key={i} className="flex space-x-4 items-center">
                    <Input 
                      placeholder="Value (e.g. Red, XL)" 
                      required 
                      value={v.value} 
                      onChange={e => updateValue(i, 'value', e.target.value)} 
                    />
                    {(type === 'colour_swatch' || type === 'image_swatch') && (
                      <Input 
                        placeholder={type === 'colour_swatch' ? "Hex code (e.g. #FF0000)" : "Media URL"} 
                        value={v.referenceValue || ''} 
                        onChange={e => updateValue(i, 'referenceValue', e.target.value)} 
                      />
                    )}
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeValue(i)}>Remove</Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={loading} className="rounded-pill bg-primary hover:bg-primary/90 text-white">
                  {loading ? 'Saving...' : 'Save Attribute'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingAttribute === null && (
        <Card className="rounded-xl border-border shadow-sm">
          <Table>
            <TableHeader className="bg-canvas-parchment">
              <TableRow>
                <TableHead>Attribute Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Values Count</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.map((attr) => (
                <TableRow key={attr.id}>
                  <TableCell className="font-medium text-ink">{attr.name}</TableCell>
                  <TableCell>{attr.type}</TableCell>
                  <TableCell>{attr.values?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(attr)} className="text-primary hover:bg-primary/10">Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(attr.id)} className="text-destructive hover:bg-destructive/10">Delete</Button>
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
