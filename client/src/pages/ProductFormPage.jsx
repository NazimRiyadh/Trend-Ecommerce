import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi } from '../api/modules/product.api';
import { categoryApi } from '../api/modules/category.api';
import { brandApi } from '../api/modules/brand.api';
import { mediaApi } from '../api/modules/media.api';
import { attributeApi } from '../api/modules/attribute.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { resolveMediaUrl } from '../api/axiosInstance';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dropdown data
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [mediaList, setMediaList] = useState([]);

  // --- Form State ---
  // Details
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [active, setActive] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);
  
  // Pricing & Stock (for Simple product)
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('0');
  
  // Organization
  const [brandId, setBrandId] = useState('none');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  // Media
  const [productMedia, setProductMedia] = useState([]); // { mediaId, isThumbnail, sortOrder }

  // Variants
  const [selectedAttributes, setSelectedAttributes] = useState({}); // { attrId: [valueIds...] }
  const [variants, setVariants] = useState([]);
  const [loadedProduct, setLoadedProduct] = useState(null); // [{ sku, price, salePrice, stock, attributeValues: { attrId: valId }, mediaId }]

  useEffect(() => {
    fetchFormData();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchFormData = async () => {
    try {
      const [br, cat, attr, med] = await Promise.all([
        brandApi.getAll({ limit: 100 }),
        categoryApi.getTree(),
        attributeApi.getAll({ limit: 100 }),
        mediaApi.getAll({ limit: 100 })
      ]);
      setBrands(br.data.data || []);
      
      const flat = [];
      const flatten = (nodes, depth = 0) => {
        nodes.forEach(node => {
          flat.push({ ...node, depth });
          if (node.children) flatten(node.children, depth + 1);
        });
      };
      flatten(cat.data.data);
      setCategories(flat);
      
      setAttributes(attr.data.data || []);
      setMediaList(med.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data } = await productApi.getById(id);
      const p = data.data;
      setLoadedProduct(p);
      
      setName(p.name);
      setSlug(p.slug);
      setSku(p.sku || '');
      setShortDescription(p.shortDescription || '');
      setLongDescription(p.longDescription || '');
      setActive(p.isActive);
      setHasVariants(p.hasVariants);
      
      setPrice(p.price ? p.price.toString() : '');
      setSalePrice(p.salePrice ? p.salePrice.toString() : '');
      setStock(p.stock ? p.stock.toString() : '0');
      
      setBrandId(p.brandId ? p.brandId.toString() : 'none');
      setSelectedCategoryIds(p.categories ? p.categories.map(c => c.id) : []);
      
      setProductMedia(p.media ? p.media.map(m => ({
        mediaId: m.mediaId,
        isThumbnail: m.isThumbnail,
        sortOrder: m.sortOrder,
        mediaUrl: m.url
      })) : []);

      if (p.hasVariants && p.variants) {
        setVariants(p.variants.map(v => {
          const attrVals = {};
          v.attributeValues.forEach(av => {
            attrVals[av.attributeId] = av.valueId;
          });
          return {
            sku: v.sku,
            price: v.price.toString(),
            salePrice: v.salePrice ? v.salePrice.toString() : '',
            stock: v.stock.toString(),
            mediaId: v.media?.[0]?.mediaId || 'none',
            attributeValues: attrVals
          };
        }));
      }

    } catch (err) {
      setError('Failed to fetch product data');
    }
  };

  const toggleCategory = (id) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // --- Variant Generation ---
  const toggleAttributeValue = (attrId, valId) => {
    setSelectedAttributes(prev => {
      const current = prev[attrId] || [];
      const updated = current.includes(valId) 
        ? current.filter(v => v !== valId)
        : [...current, valId];
        
      const newState = { ...prev, [attrId]: updated };
      if (updated.length === 0) delete newState[attrId];
      return newState;
    });
  };

  const generateVariants = () => {
    const attrIds = Object.keys(selectedAttributes);
    if (attrIds.length === 0) {
      setVariants([]);
      return;
    }

    // Cartesian product
    const cartesian = (arrays) => {
      return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    };

    const arraysToMultiply = attrIds.map(attrId => 
      selectedAttributes[attrId].map(valId => ({ attrId, valId }))
    );

    let combinations = [];
    if (arraysToMultiply.length === 1) {
      combinations = arraysToMultiply[0].map(item => [item]);
    } else {
      combinations = cartesian(arraysToMultiply);
    }

    const newVariants = combinations.map((combo, i) => {
      const attrVals = {};
      combo.forEach(c => { attrVals[c.attrId] = c.valId; });
      return {
        sku: `${sku || 'SKU'}-${i+1}`,
        price: price || '0',
        salePrice: '',
        stock: '0',
        mediaId: 'none',
        attributeValues: attrVals
      };
    });

    setVariants(newVariants);
  };

  // --- Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        slug,
        shortDescription,
        longDescription,
        isActive: active,
        hasVariants,
        sku,
        brandId: brandId !== 'none' ? brandId : null,
        categoryIds: selectedCategoryIds,
        media: productMedia.map(m => ({
          mediaId: m.mediaId,
          isThumbnail: m.isThumbnail,
          sortOrder: m.sortOrder
        }))
      };

      if (!hasVariants) {
        payload.sku = sku;
        payload.price = parseFloat(price) || 0;
        if (salePrice) payload.salePrice = parseFloat(salePrice);
        payload.stock = parseInt(stock, 10) || 0;
      } else {
        payload.variants = variants.map(v => {
          const vPayload = {
            sku: v.sku,
            price: parseFloat(v.price) || 0,
            stock: parseInt(v.stock, 10) || 0,
            attributes: Object.values(v.attributeValues).map(attributeValueId => ({ attributeValueId })),
          };
          if (v.salePrice) vPayload.salePrice = parseFloat(v.salePrice);
          return vPayload;
        });
      }

      if (isEditing) {
        const updatePayload = {
          name, slug, sku, shortDescription, longDescription,
          isActive: active, hasVariants,
          brandId: brandId !== 'none' ? brandId : null,
          categoryIds: selectedCategoryIds
        };
        if (!hasVariants) {
          updatePayload.price = parseFloat(price) || 0;
          updatePayload.salePrice = salePrice ? parseFloat(salePrice) : null;
          updatePayload.stock = parseInt(stock, 10) || 0;
        }
        await productApi.update(id, updatePayload);

        const oldMedia = loadedProduct?.media || [];
        const oldMediaIds = new Set(oldMedia.map(m => m.mediaId));
        const currentMediaIds = new Set(productMedia.map(m => m.mediaId));
        for (const m of productMedia) {
          if (oldMediaIds.has(m.mediaId)) {
            await productApi.updateMedia(id, m.mediaId, { isThumbnail:m.isThumbnail, sortOrder:m.sortOrder });
          } else {
            await productApi.addMedia(id, { mediaId:m.mediaId, isThumbnail:m.isThumbnail, sortOrder:m.sortOrder });
          }
        }
        for (const mediaId of oldMediaIds) {
          if (!currentMediaIds.has(mediaId)) await productApi.deleteMedia(id, mediaId);
        }

        if (hasVariants) {
          for (const v of variants) {
            const variantPayload = {
              sku:v.sku, price:parseFloat(v.price)||0,
              salePrice:v.salePrice ? parseFloat(v.salePrice) : null,
              stock:parseInt(v.stock,10)||0,
              attributes:Object.values(v.attributeValues).map(attributeValueId => ({attributeValueId}))
            };
            if (v.id) await productApi.updateVariant(id, v.id, variantPayload);
            else await productApi.addVariants(id, variantPayload);
          }
        }
      } else {
        await productApi.create(payload);
      }

      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  const addMedia = (mId, url) => {
    if (productMedia.some(m => m.mediaId === mId)) return;
    setProductMedia([...productMedia, { 
      mediaId: mId, 
      isThumbnail: productMedia.length === 0, // first is thumb
      sortOrder: productMedia.length,
      mediaUrl: url
    }]);
  };

  const removeMedia = (mId) => {
    setProductMedia(prev => {
      const next = prev.filter(m => m.mediaId !== mId);
      // Ensure one thumbnail remains if there are items
      if (next.length > 0 && !next.some(m => m.isThumbnail)) {
        next[0] = { ...next[0], isThumbnail: true };
      }
      return next;
    });
  };

  const setThumbnail = (mId) => {
    setProductMedia(prev => prev.map(m => ({
      ...m,
      isThumbnail: m.mediaId === mId
    })));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-display-md font-semibold text-ink">
          {isEditing ? 'Edit Product' : 'Create Product'}
        </h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => navigate('/products')}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-pill bg-primary hover:bg-primary/90 text-white">
            {loading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-border">
        {['details', 'organization', 'media', 'variants'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-ink-muted-80 hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'details' && (
          <Card className="rounded-xl border-border shadow-sm">
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={e => setSlug(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label>Short Description</Label>
                  <Input value={shortDescription} onChange={e => setShortDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="active" checked={active} onCheckedChange={setActive} />
                    <label htmlFor="active" className="text-sm font-medium leading-none cursor-pointer">Active</label>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Long Description</Label>
                  <textarea 
                    className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={longDescription} 
                    onChange={e => setLongDescription(e.target.value)} 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-ink">Product Type</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="hasVariants" checked={hasVariants} onCheckedChange={setHasVariants} />
                    <label htmlFor="hasVariants" className="text-sm font-medium leading-none cursor-pointer">This product has variants</label>
                  </div>
                </div>

                {!hasVariants && (
                  <div className="grid grid-cols-3 gap-6 bg-canvas-parchment p-4 rounded-lg border border-border">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input value={sku} onChange={e => setSku(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Sale Price ($)</Label>
                      <Input type="number" step="0.01" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input type="number" value={stock} onChange={e => setStock(e.target.value)} />
                    </div>
                  </div>
                )}
                {hasVariants && (
                  <div className="bg-canvas-parchment p-4 rounded-lg border border-border text-sm text-ink-muted-80">
                    Pricing and stock will be configured per variant in the Variants tab.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'organization' && (
          <Card className="rounded-xl border-border shadow-sm">
            <CardContent className="pt-6 grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-ink">Brand</h3>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Brand</SelectItem>
                    {brands.map(b => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-ink">Categories</h3>
                <div className="bg-canvas border border-border rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center space-x-2" style={{ paddingLeft: `${cat.depth * 20}px` }}>
                      <Checkbox 
                        id={`cat-${cat.id}`}
                        checked={selectedCategoryIds.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                      />
                      <label htmlFor={`cat-${cat.id}`} className="text-sm font-medium leading-none cursor-pointer">
                        {cat.name}
                      </label>
                    </div>
                  ))}
                  {categories.length === 0 && <span className="text-sm text-ink-muted-80">No categories available</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'media' && (
          <Card className="rounded-xl border-border shadow-sm">
            <CardContent className="pt-6 space-y-6">
              <div className="flex space-x-4">
                {/* Product Media Gallery */}
                <div className="flex-1 space-y-4">
                  <h3 className="font-semibold text-ink">Product Gallery</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {productMedia.sort((a,b) => a.sortOrder - b.sortOrder).map((m, idx) => (
                      <div key={m.mediaId} className={`relative aspect-square border-2 rounded-lg overflow-hidden group ${m.isThumbnail ? 'border-primary' : 'border-border'}`}>
                        <img src={resolveMediaUrl(m.mediaUrl)} alt="Product media" className="w-full h-full object-cover" />
                        {m.isThumbnail && <div className="absolute top-1 left-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded">Thumbnail</div>}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center space-y-2 transition-opacity">
                          {!m.isThumbnail && <Button size="sm" variant="secondary" className="h-6 text-xs" onClick={() => setThumbnail(m.mediaId)}>Make Thumbnail</Button>}
                          <Button size="sm" variant="destructive" className="h-6 text-xs" onClick={() => removeMedia(m.mediaId)}>Remove</Button>
                        </div>
                      </div>
                    ))}
                    {productMedia.length === 0 && (
                      <div className="col-span-4 aspect-[4/1] flex items-center justify-center border-2 border-dashed border-border rounded-lg text-ink-muted-80 text-sm">
                        No media attached. Select from the library on the right.
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Library Picker */}
                <div className="w-[300px] border-l border-border pl-4 space-y-4">
                  <h3 className="font-semibold text-ink">Media Library</h3>
                  <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
                    {mediaList.filter(m => m.mimeType.startsWith('image/')).map(m => {
                      const isAdded = productMedia.some(pm => pm.mediaId === m.id);
                      return (
                        <div 
                          key={m.id} 
                          className={`aspect-square border rounded cursor-pointer overflow-hidden relative ${isAdded ? 'opacity-50 grayscale' : 'hover:border-primary'}`}
                          onClick={() => !isAdded && addMedia(m.id, m.thumbnailUrl || m.publicUrl)}
                        >
                          <img src={resolveMediaUrl(m.thumbnailUrl || m.publicUrl)} alt={m.altText || m.fileName} className="w-full h-full object-cover" />
                          {isAdded && <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white text-xs font-bold">Added</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'variants' && (
          <div className="space-y-6">
            {!hasVariants && (
              <div className="bg-canvas-parchment p-8 text-center rounded-xl border border-border text-ink-muted-80">
                You have not enabled variants for this product. Check the box in the Details tab first.
              </div>
            )}
            
            {hasVariants && (
              <>
                <Card className="rounded-xl border-border shadow-sm">
                  <CardHeader className="bg-canvas-parchment border-b border-border py-4 flex flex-row justify-between items-center">
                    <CardTitle className="text-sm font-semibold text-ink">Choose Attributes</CardTitle>
                    <Button variant="secondary" size="sm" onClick={generateVariants}>Generate Variants</Button>
                  </CardHeader>
                  <CardContent className="pt-6 grid grid-cols-3 gap-6">
                    {attributes.map(attr => (
                      <div key={attr.id} className="space-y-2 border border-border p-3 rounded-lg">
                        <h4 className="font-medium text-sm text-ink">{attr.name}</h4>
                        <div className="space-y-1">
                          {attr.values.map(val => (
                            <div key={val.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`attr-${attr.id}-val-${val.id}`}
                                checked={(selectedAttributes[attr.id] || []).includes(val.id)}
                                onCheckedChange={() => toggleAttributeValue(attr.id, val.id)}
                              />
                              <label htmlFor={`attr-${attr.id}-val-${val.id}`} className="text-xs cursor-pointer">{val.value}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {variants.length > 0 && (
                  <Card className="rounded-xl border-border shadow-sm">
                    <CardHeader className="bg-canvas-parchment border-b border-border py-4 flex flex-row justify-between items-center">
                      <CardTitle className="text-sm font-semibold text-ink">Configure Variants ({variants.length})</CardTitle>
                      <Button variant="destructive" size="sm" onClick={() => setVariants([])}>Clear All</Button>
                    </CardHeader>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Combination</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Sale Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Image</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variants.map((variant, idx) => {
                          // Build combination name
                          const comboNames = Object.entries(variant.attributeValues).map(([attrId, valId]) => {
                            const attr = attributes.find(a => a.id.toString() === attrId);
                            const val = attr?.values.find(v => v.id === valId);
                            return val?.value || '?';
                          });
                          
                          return (
                            <TableRow key={idx}>
                              <TableCell className="text-xs font-medium">{comboNames.join(' / ')}</TableCell>
                              <TableCell><Input className="h-8 text-xs w-24" value={variant.sku} onChange={(e) => {
                                const newV = [...variants]; newV[idx].sku = e.target.value; setVariants(newV);
                              }}/></TableCell>
                              <TableCell><Input className="h-8 text-xs w-20" type="number" step="0.01" value={variant.price} onChange={(e) => {
                                const newV = [...variants]; newV[idx].price = e.target.value; setVariants(newV);
                              }}/></TableCell>
                              <TableCell><Input className="h-8 text-xs w-20" type="number" step="0.01" value={variant.salePrice} onChange={(e) => {
                                const newV = [...variants]; newV[idx].salePrice = e.target.value; setVariants(newV);
                              }}/></TableCell>
                              <TableCell><Input className="h-8 text-xs w-16" type="number" value={variant.stock} onChange={(e) => {
                                const newV = [...variants]; newV[idx].stock = e.target.value; setVariants(newV);
                              }}/></TableCell>
                              <TableCell>
                                <Select value={variant.mediaId} onValueChange={(val) => {
                                  const newV = [...variants]; newV[idx].mediaId = val; setVariants(newV);
                                }}>
                                  <SelectTrigger className="h-8 text-xs w-24"><SelectValue placeholder="No img"/></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {productMedia.map(pm => (
                                      <SelectItem key={pm.mediaId} value={pm.mediaId.toString()}>Img #{pm.mediaId}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="text-destructive h-6 px-2" onClick={() => {
                                  setVariants(variants.filter((_, i) => i !== idx));
                                }}>Remove</Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
