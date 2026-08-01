import { useState, useEffect } from 'react';
import { userApi } from '../api/modules/user.api';
import { roleApi } from '../api/modules/role.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function UserPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await userApi.getAll({ limit: 100 });
      console.log('fetchUsers response:', data);
      console.log('fetchUsers data.data:', data?.data);
      setUsers(data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await roleApi.getAll({ limit: 100, status: 'active' });
      console.log('fetchRoles response:', data);
      console.log('fetchRoles data.data:', data?.data);
      setRoles(data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setGender('male');
    setRoleId('');
    setStatus('active');
  };

  const handleEdit = async (user) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // never prefill password
    setPhone(user.phone || '');
    setGender(user.gender || 'male');
    setRoleId(user.roleId.toString());
    setStatus(user.status);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        phone,
        gender,
        roleId: parseInt(roleId, 10),
        status,
      };
      if (password) {
        payload.password = password;
      }

      if (editingUser) {
        await userApi.update(editingUser.id, payload);
      } else {
        await userApi.create(payload);
      }
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-display-md font-semibold text-ink">Users</h1>
        {!editingUser && (
          <Button onClick={() => setEditingUser({})} className="rounded-pill bg-primary hover:bg-primary/90 text-white">
            Create New User
          </Button>
        )}
      </div>

      {editingUser !== null && (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="bg-canvas-parchment border-b border-border py-4">
            <CardTitle className="text-sm font-semibold text-ink">
              {editingUser.id ? 'Edit User' : 'Create User'}
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
                  <Label>Email</Label>
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Password {editingUser.id && '(Leave blank to keep)'}</Label>
                  <Input type="password" required={!editingUser.id} value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={roleId} onValueChange={setRoleId}>
                    <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
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
                  {loading ? 'Saving...' : 'Save User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingUser === null && (
        <Card className="rounded-xl border-border shadow-sm">
          <Table>
            <TableHeader className="bg-canvas-parchment">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell className="font-medium text-ink">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role?.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.isActive ? 'active' : 'inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="text-primary hover:bg-primary/10">Edit</Button>
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
