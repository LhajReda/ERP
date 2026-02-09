'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProducts, useCreateProduct, useCreateStockMovement, useLowStockAlerts } from '@/hooks/use-api';
import {
  Plus,
  Package,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Filter,
} from 'lucide-react';

const categories = ['Tous', 'ENGRAIS', 'PHYTOSANITAIRE', 'SEMENCE', 'MATERIEL', 'AUTRE'];

export default function StockPage() {
  const t = useTranslations('stock');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category: 'ENGRAIS',
    currentStock: '',
    unit: 'kg',
    minStock: '',
    price: '',
  });

  const [movementForm, setMovementForm] = useState({
    productId: '',
    type: 'IN',
    quantity: '',
    notes: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const farmId = localStorage.getItem('fla7a_farm');
      setActiveFarmId(farmId);
    }
  }, []);

  const { data: products, isLoading } = useProducts(activeFarmId || undefined);
  const { data: lowStockAlerts } = useLowStockAlerts(activeFarmId || undefined);
  const createProduct = useCreateProduct();
  const createMovement = useCreateStockMovement();

  const filtered = products?.filter((p: any) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Tous' || p.category === category;
    return matchSearch && matchCat;
  }) || [];

  const lowStockCount = lowStockAlerts?.length || 0;

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({
        farmId: activeFarmId,
        name: productForm.name,
        category: productForm.category,
        currentStock: parseFloat(productForm.currentStock),
        unit: productForm.unit,
        minStock: parseFloat(productForm.minStock),
        price: parseFloat(productForm.price),
      });
      setProductDialogOpen(false);
      setProductForm({ name: '', category: 'ENGRAIS', currentStock: '', unit: 'kg', minStock: '', price: '' });
      alert('Produit créé avec succès!');
    } catch (error: any) {
      alert('Erreur: ' + (error?.response?.data?.message || error.message));
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMovement.mutateAsync({
        productId: movementForm.productId,
        type: movementForm.type,
        quantity: parseFloat(movementForm.quantity),
        notes: movementForm.notes,
      });
      setMovementDialogOpen(false);
      setMovementForm({ productId: '', type: 'IN', quantity: '', notes: '' });
      alert('Mouvement enregistré avec succès!');
    } catch (error: any) {
      alert('Erreur: ' + (error?.response?.data?.message || error.message));
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? '...' : `${products?.length || 0} produits - ${lowStockCount} alertes stock`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<ArrowDownCircle className="h-4 w-4" />}
            onClick={() => setMovementDialogOpen(true)}
          >
            Entrée
          </Button>
          <Button
            variant="success"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setProductDialogOpen(true)}
          >
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Alert */}
      {lowStockCount > 0 && (
        <Card hover={false} className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">{lowStockCount} produits en stock faible</p>
              <p className="text-xs text-amber-600">Pensez à passer commande auprès de vos fournisseurs</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Produits ({products?.length || 0})</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === cat ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {cat === 'Tous' ? 'Tous' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <Card hover={false}>
              <CardContent className="p-6">
                <Skeleton className="h-64" />
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Aucun produit"
              description="Commencez par ajouter des produits à votre inventaire"
              action={
                <Button
                  variant="success"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setProductDialogOpen(true)}
                >
                  Ajouter un produit
                </Button>
              }
            />
          ) : (
            <Card hover={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="text-start p-3 font-medium text-muted-foreground">Produit</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">Catégorie</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">Stock</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">Niveau</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">Prix unitaire</th>
                      <th className="text-start p-3 font-medium text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p: any) => {
                      const stock = p.currentStock || p.stock || 0;
                      const min = p.minStock || p.min || 100;
                      const level = Math.min((stock / min) * 100, 100);
                      const isLow = stock < min;

                      return (
                        <tr key={p.id || p._id} className="border-b hover:bg-secondary/20 transition-colors cursor-pointer">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span className="font-medium">{p.name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary">{p.category}</Badge>
                          </td>
                          <td className="p-3 font-semibold">
                            {stock} {p.unit}
                          </td>
                          <td className="p-3 w-32">
                            <Progress
                              value={level}
                              variant={level < 60 ? 'danger' : level < 80 ? 'warning' : 'success'}
                              size="sm"
                            />
                          </td>
                          <td className="p-3">{p.price?.toFixed(2) || '0.00'} MAD</td>
                          <td className="p-3">
                            {isLow ? (
                              <Badge variant="danger" dot>
                                Stock faible
                              </Badge>
                            ) : (
                              <Badge variant="success" dot>
                                OK
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="movements">
          <Card hover={false}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                Les mouvements de stock seront affichés ici
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau produit</DialogTitle>
            <DialogDescription>Ajoutez un nouveau produit à votre inventaire</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProductSubmit}>
            <div className="space-y-4 py-4">
              <Input
                label="Nom du produit"
                placeholder="Engrais NPK 15-15-15"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                required
              />
              <Select
                label="Catégorie"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                required
              >
                <option value="ENGRAIS">Engrais</option>
                <option value="PHYTOSANITAIRE">Phytosanitaire</option>
                <option value="SEMENCE">Semence</option>
                <option value="MATERIEL">Matériel</option>
                <option value="AUTRE">Autre</option>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Stock initial"
                  type="number"
                  placeholder="100"
                  value={productForm.currentStock}
                  onChange={(e) => setProductForm({ ...productForm, currentStock: e.target.value })}
                  required
                />
                <Input
                  label="Unité"
                  placeholder="kg"
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Stock minimum"
                type="number"
                placeholder="50"
                value={productForm.minStock}
                onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })}
                required
              />
              <Input
                label="Prix unitaire (MAD)"
                type="number"
                step="0.01"
                placeholder="45.00"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success" loading={createProduct.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Movement Dialog */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mouvement de stock</DialogTitle>
            <DialogDescription>Enregistrez une entrée ou sortie de stock</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovementSubmit}>
            <div className="space-y-4 py-4">
              <Select
                label="Produit"
                value={movementForm.productId}
                onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
                required
              >
                <option value="">Sélectionner un produit</option>
                {products?.map((p: any) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Type"
                value={movementForm.type}
                onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}
                required
              >
                <option value="IN">Entrée</option>
                <option value="OUT">Sortie</option>
              </Select>
              <Input
                label="Quantité"
                type="number"
                placeholder="50"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                required
              />
              <Input
                label="Notes"
                placeholder="Livraison fournisseur..."
                value={movementForm.notes}
                onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMovementDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success" loading={createMovement.isPending}>
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
