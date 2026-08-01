import { useState, useEffect } from 'react';
import { productApi } from '../api/modules/product.api';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { resolveMediaUrl } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function ProductListPage() {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (q = '') => {
    try {
      const { data } = await productApi.getAll({ search: q, limit: 100 });
      setProducts(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete product? This will also delete variants and media links.')) return;
    try {
      await productApi.delete(id);
      fetchProducts(search);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-display-md font-semibold text-ink">Products</h1>
        {hasPermission('product:create') && <Link to="/products/new">
          <Button className="rounded-pill bg-primary hover:bg-primary/90 text-white">
            Create Product
          </Button>
        </Link>}
      </div>

      <div className="flex items-center space-x-2">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm flex space-x-2">
          <Input 
            placeholder="Search by name or SKU..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="bg-canvas"
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <Card className="rounded-xl border-border shadow-sm">
        <Table>
          <TableHeader className="bg-canvas-parchment">
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const thumbnail = product.thumbnail;
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    {thumbnail ? (
                      <img src={resolveMediaUrl(thumbnail)} alt={product.name} className="h-10 w-10 rounded-md object-cover border border-border" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-canvas-parchment flex items-center justify-center text-[10px] text-ink-muted-80 border border-border">N/A</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-ink">
                    {product.name}
                    <div className="text-xs text-ink-muted-80 font-normal mt-0.5">
                      {product.categories?.map(c => c.name).join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>{product.sku || 'Multiple (Variable)'}</TableCell>
                  <TableCell>{product.brand?.name || '-'}</TableCell>
                  <TableCell>
                    {product.displayPrice != null ? `$${product.displayPrice}` : '—'}
                  </TableCell>
                  <TableCell>
                    {product.hasVariants ? 'Per variant' : (product.stock ?? '—')}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {product.isActive ? 'Active' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {hasPermission('product:update') && <Link to={`/products/${product.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">Edit</Button>
                    </Link>}
                    {hasPermission('product:delete') && <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-destructive hover:bg-destructive/10">Delete</Button>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
