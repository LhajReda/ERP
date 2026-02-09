'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFarms, useCreateFarm, useDeleteFarm } from '@/hooks/use-api';
import {
  Plus,
  Tractor,
  MapPin,
  Sprout,
  Users,
  LayoutGrid,
  List,
  Search,
  MoreVertical,
  ChevronRight,
  Trash2,
} from 'lucide-react';

export default function FarmsPage() {
  const t = useTranslations('farm');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    province: '',
    area: '',
    iceNumber: '',
  });

  const { data: farms, isLoading, error } = useFarms();
  const createFarm = useCreateFarm();
  const deleteFarm = useDeleteFarm();

  const filtered = farms?.filter((f: any) =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.region?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFarm.mutateAsync({
        name: formData.name,
        region: formData.region,
        province: formData.province,
        area: parseFloat(formData.area),
        iceNumber: formData.iceNumber,
      });
      setDialogOpen(false);
      setFormData({ name: '', region: '', province: '', area: '', iceNumber: '' });
      alert('Ferme créée avec succès!');
    } catch (error: any) {
      alert('Erreur: ' + (error?.response?.data?.message || error.message));
    }
  };

  const handleDelete = async () => {
    if (!selectedFarmId) return;
    try {
      await deleteFarm.mutateAsync(selectedFarmId);
      setDeleteDialogOpen(false);
      setSelectedFarmId(null);
      alert('Ferme supprimée avec succès!');
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
            {isLoading ? '...' : `${farms?.length || 0} fermes - ${farms?.reduce((sum: number, f: any) => sum + (f.area || 0), 0) || 0} hectares total`}
          </p>
        </div>
        <Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
          {t('addFarm')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Rechercher une ferme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-s-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-e-lg transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Farm Cards */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tractor}
          title="Aucune ferme"
          description="Commencez par ajouter votre première ferme"
          action={<Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>Ajouter une ferme</Button>}
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {filtered.map((farm: any) => (
            <Card key={farm.id || farm._id} className="cursor-pointer group">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Tractor className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {farm.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {farm.region}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFarmId(farm.id || farm._id);
                      setDeleteDialogOpen(true);
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <p className="text-lg font-bold text-foreground">{farm.area || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Hectares</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <p className="text-lg font-bold text-foreground">{farm.parcels || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Parcelles</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <p className="text-lg font-bold text-foreground">{farm.activeCycles || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Cycles</p>
                  </div>
                </div>

                {/* Province */}
                <div className="mb-4">
                  <Badge variant="secondary">{farm.province || 'N/A'}</Badge>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    ICE: {farm.iceNumber || 'N/A'}
                  </div>
                  <Badge variant="success" dot>Active</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Farm Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une ferme</DialogTitle>
            <DialogDescription>Créez une nouvelle exploitation agricole</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <Input
                label="Nom de la ferme"
                placeholder="Domaine Al Baraka"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Région"
                placeholder="Souss-Massa"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                required
              />
              <Input
                label="Province"
                placeholder="Agadir"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                required
              />
              <Input
                label="Surface (ha)"
                type="number"
                placeholder="85"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                required
              />
              <Input
                label="Numéro ICE"
                placeholder="000000000000000"
                value={formData.iceNumber}
                onChange={(e) => setFormData({ ...formData, iceNumber: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success" loading={createFarm.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la ferme</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette ferme ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleteFarm.isPending}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
