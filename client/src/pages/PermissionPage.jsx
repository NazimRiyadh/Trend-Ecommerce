import { useState, useEffect } from 'react';
import { permissionApi } from '../api/modules/permission.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';

const STANDARD_ACTIONS = ['create', 'read', 'update', 'delete', 'watch', 'upload', 'write', 'approve', 'status'];

export default function PermissionPage() {
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedActions, setSelectedActions] = useState([]);
  const [customAction, setCustomAction] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPermissions = async () => {
    try {
      const { data } = await permissionApi.getAll({ limit: 1000 });
      const groups = {};
      (data.data || []).forEach(group => {
        (group.permissions || []).forEach(perm => {
          const parts = perm.name.split(':');
          const mod = parts[0] || 'general';
          const action = parts[1] || '';
          if (!groups[mod]) {
            groups[mod] = new Set();
          }
          if (action) {
            groups[mod].add(action);
          }
        });
      });
      const grouped = {};
      for (const [mod, actionsSet] of Object.entries(groups)) {
        grouped[mod] = Array.from(actionsSet);
      }
      setGroupedPermissions(grouped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const toggleAction = (action) => {
    setSelectedActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    
    let allActions = [...selectedActions];
    if (customAction.trim()) {
      allActions.push(customAction.trim());
    }

    if (!groupName || allActions.length === 0) {
      setError('Group name and at least one action are required');
      return;
    }

    setLoading(true);
    try {
      await permissionApi.createGroup({
        group: groupName.toLowerCase(),
        description,
        actions: allActions
      });
      setGroupName('');
      setDescription('');
      setSelectedActions([]);
      setCustomAction('');
      fetchPermissions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create permission group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-display-md font-semibold text-ink">Permissions</h1>
      </div>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader className="bg-canvas-parchment border-b border-border py-4">
          <CardTitle className="text-sm font-semibold text-ink">Create Permission Group</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name (Module Name)</Label>
                <Input 
                  id="groupName" 
                  placeholder="e.g. product" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="e.g. Manage product catalog" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Standard Actions</Label>
              <div className="flex flex-wrap gap-4">
                {STANDARD_ACTIONS.map(action => (
                  <div key={action} className="flex items-center space-x-2 bg-canvas-parchment px-3 py-2 rounded-lg border border-border">
                    <Checkbox 
                      id={`action-${action}`} 
                      checked={selectedActions.includes(action)}
                      onCheckedChange={() => toggleAction(action)}
                    />
                    <label htmlFor={`action-${action}`} className="text-sm font-medium leading-none cursor-pointer">
                      {action}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <Label htmlFor="customAction">Custom Action</Label>
              <Input 
                id="customAction" 
                placeholder="e.g. publish" 
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => {
                setGroupName(''); setSelectedActions([]); setCustomAction('');
              }}>
                Reset
              </Button>
              <Button type="submit" disabled={loading} className="rounded-pill bg-primary hover:bg-primary/90 text-white">
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader className="bg-canvas-parchment border-b border-border py-4">
          <CardTitle className="text-sm font-semibold text-ink">Existing Modules</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {Object.entries(groupedPermissions).map(([module, actions]) => (
              <div key={module} className="p-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-ink capitalize">{module}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {actions.map(action => (
                      <span key={action} className="text-xs bg-canvas-parchment text-ink-muted-80 border border-border px-2 py-1 rounded-full">
                        {module}:{action}
                      </span>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  Delete Group
                </Button>
              </div>
            ))}
            {Object.keys(groupedPermissions).length === 0 && (
              <div className="p-8 text-center text-ink-muted-80">
                No permissions found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
