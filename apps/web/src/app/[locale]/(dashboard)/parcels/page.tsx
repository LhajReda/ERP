'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useParcels, useCreateParcel } from '@/hooks/use-api';
import { getErrorMessage } from '@/lib/error-message';
import { Plus, Map, MapPin } from 'lucide-react';

type ParcelRow = {
  id?: string;
  _id?: string;
  name?: string;
  area?: number;
  soilType?: string;
  irrigationType?: string;
};

export default function ParcelsPage() {
  const t = useTranslations('parcel');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    soilType: '',
    irrigationType: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveFarmId(localStorage.getItem('fla7a_farm'));
    }
  }, []);

  const { data: parcels, isLoading } = useParcels(activeFarmId || undefined);
  const createParcel = useCreateParcel();
  const parcelRows = Array.isArray(parcels) ? (parcels as ParcelRow[]) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createParcel.mutateAsync({
        farmId: activeFarmId,
        name: formData.name,
        area: parseFloat(formData.area),
        soilType: formData.soilType,
        irrigationType: formData.irrigationType,
      });
      setDialogOpen(false);
      setFormData({ name: '', area: '', soilType: '', irrigationType: '' });
      alert('Parcelle créée avec succès!');
    } catch (error: unknown) {
      alert(`Erreur: ${getErrorMessage(error)}`);
    }
  };

  const totalArea = parcelRows.reduce((sum: number, p: ParcelRow) => sum + (p.area || 0), 0);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? '...' : `${parcelRows.length} parcelles - ${totalArea} ha`}
          </p>
        </div>
        <Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
          {t('addParcel')}
        </Button>
      </div>

      {/* Map placeholder */}
      <Card hover={false} className="overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-fla7a-50 to-sky-50 flex items-center justify-center border-b">
          <div className="text-center">
            <Map className="h-12 w-12 text-primary/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carte interactive des parcelles</p>
            <p className="text-xs text-muted-foreground">(Intégration MapBox/Leaflet)</p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : parcelRows.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Aucune parcelle"
          description="Commencez par ajouter des parcelles à votre ferme"
          action={{
            label: 'Ajouter une parcelle',
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parcelRows.map((parcel: ParcelRow) => (
            <Card key={parcel.id || parcel._id} className="cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-sky-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{parcel.name}</h3>
                      <p className="text-xs text-muted-foreground">{parcel.area} ha</p>
                    </div>
                  </div>
                  <Badge variant="success" dot>
                    Active
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type de sol</span>
                    <span className="font-medium">{parcel.soilType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Irrigation</span>
                    <span className="font-medium">{parcel.irrigationType || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Parcel Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle parcelle</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle parcelle à votre ferme</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <Input
                label="Nom de la parcelle"
                placeholder="A1 - Verger Nord"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Surface (ha)"
                type="number"
                step="0.01"
                placeholder="25"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                required
              />
              <Select
                label="Type de sol"
                value={formData.soilType}
                onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                required
              >
                <option value="">Sélectionner</option>
                <option value="Argileux">Argileux</option>
                <option value="Limoneux">Limoneux</option>
                <option value="Sablonneux">Sablonneux</option>
                <option value="Calcaire">Calcaire</option>
              </Select>
              <Select
                label="Type d'irrigation"
                value={formData.irrigationType}
                onChange={(e) => setFormData({ ...formData, irrigationType: e.target.value })}
                required
              >
                <option value="">Sélectionner</option>
                <option value="Goutte à goutte">Goutte à goutte</option>
                <option value="Aspersion">Aspersion</option>
                <option value="Gravitaire">Gravitaire</option>
                <option value="Pluvial">Pluvial</option>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success" loading={createParcel.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
