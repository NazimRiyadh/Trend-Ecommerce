import { useState, useEffect } from 'react';
import { roleApi } from '../api/modules/role.api';
import { permissionApi } from '../api/modules/permission.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function RolePage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data } = await roleApi.getAll({ limit: 100 });
      setRoles(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data } = await permissionApi.getAll({ limit: 1000 });
      const groups = {};
      (data.data || []).forEach(group => {
        groups[group.name] = (group.permissions || []).map(perm => ({ id: perm.id, action: perm.name.split(':')[1], name: perm.name }));
      });
      setPermissions(groups);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async (role) => {
    setLoading(true);
    try {
      const { data } = await roleApi.getById(role.id);
      const roleData = data.data;
      setEditingRole(roleData);
      setName(roleData.name);
      setDescription(roleData.description || '');
      setStatus(roleData.status);
      setSelectedPermissions(roleData.permissions.map(p => p.permission.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setStatus('active');
    setSelectedPermissions([]);
  };

  const togglePermission = (id) => {
    setSelectedPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleModulePermissions = (modulePerms, isChecked) => {
    const ids = modulePerms.map(p => p.id);
    setSelectedPermissions(prev => {
      if (isChecked) {
        return [...new Set([...prev, ...ids])];
      } else {
        return prev.filter(id => !ids.includes(id));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        description,
        status,
        permissionIds: selectedPermissions
      };
      if (editingRole) {
        await roleApi.update(editingRole.id, payload);
      } else {
        await roleApi.create(payload);
      }
      resetForm();
      fetchRoles();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-display-md font-semibold text-ink">Roles</h1>
        {!editingRole && (
          <Button onClick={() => setEditingRole({})} className="rounded-pill bg-primary hover:bg-primary/90 text-white">
            Create New Role
          </Button>
        )}
      </div>

      {editingRole !== null && (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="bg-canvas-parchment border-b border-border py-4">
            <CardTitle className="text-sm font-semibold text-ink">
              {editingRole.id ? 'Edit Role' : 'Create Role'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} />
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

              <div className="space-y-4">
                <Label>Permissions (Module by Action)</Label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-canvas-parchment">
                      <TableRow>
                        <TableHead>Module</TableHead>
                        <TableHead>Select All</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(permissions).map(([module, perms]) => {
                        const isAllSelected = perms.every(p => selectedPermissions.includes(p.id));
                        return (
                          <TableRow key={module}>
                            <TableCell className="font-semibold capitalize text-ink">{module}</TableCell>
                            <TableCell>
                              <Checkbox 
                                checked={isAllSelected}
                                onCheckedChange={(checked) => toggleModulePermissions(perms, checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-4">
                                {perms.map(p => (
                                  <div key={p.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`perm-${p.id}`}
                                      checked={selectedPermissions.includes(p.id)}
                                      onCheckedChange={() => togglePermission(p.id)}
                                    />
                                    <label htmlFor={`perm-${p.id}`} className="text-sm cursor-pointer capitalize">
                                      {p.action}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={loading} className="rounded-pill bg-primary hover:bg-primary/90 text-white">
                  {loading ? 'Saving...' : 'Save Role'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingRole === null && (
        <Card className="rounded-xl border-border shadow-sm">
          <Table>
            <TableHeader className="bg-canvas-parchment">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.id}</TableCell>
                  <TableCell className="font-medium text-ink">{role.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${role.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {role.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(role)} className="text-primary hover:bg-primary/10">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">Delete</Button>
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
