'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCultureCycles, useCreateCultureCycle, useParcels } from '@/hooks/use-api';
import { getErrorMessage } from '@/lib/error-message';
import { Plus, Sprout, Calendar, MapPin } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'success' | 'info' | 'warning' | 'default' }> = {
  HARVEST: { label: 'Récolte', variant: 'success' },
  GROWING: { label: 'Croissance', variant: 'info' },
  SOWING: { label: 'Semis', variant: 'warning' },
  PLANNING: { label: 'Planifié', variant: 'default' },
};

type CultureCycleRow = {
  id?: string;
  _id?: string;
  status?: string;
  progress?: number;
  cropType?: string;
  parcelName?: string;
  parcelId?: string;
  area?: number;
  startDate?: string;
};

type ParcelOption = {
  id?: string;
  _id?: string;
  name?: string;
};

export default function CulturePage() {
  const t = useTranslations('culture');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cropType: '',
    parcelId: '',
    startDate: '',
    expectedEndDate: '',
    plantingDensity: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveFarmId(localStorage.getItem('fla7a_farm'));
    }
  }, []);

  const { data: cycles, isLoading } = useCultureCycles(activeFarmId || undefined);
  const { data: parcels } = useParcels(activeFarmId || undefined);
  const parcelList = Array.isArray(parcels) ? (parcels as ParcelOption[]) : [];
  const cycleRows = Array.isArray(cycles) ? (cycles as CultureCycleRow[]) : [];
  const createCycle = useCreateCultureCycle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCycle.mutateAsync({
        farmId: activeFarmId,
        cropType: formData.cropType,
        parcelId: formData.parcelId,
        startDate: formData.startDate,
        expectedEndDate: formData.expectedEndDate,
        plantingDensity: parseFloat(formData.plantingDensity),
      });
      setDialogOpen(false);
      setFormData({ cropType: '', parcelId: '', startDate: '', expectedEndDate: '', plantingDensity: '' });
      alert('Cycle créé avec succès!');
    } catch (error: unknown) {
      alert(`Erreur: ${getErrorMessage(error)}`);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? '...' : `${cycleRows.length} cycles actifs`}
          </p>
        </div>
        <Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
          {t('addCycle')}
        </Button>
      </div>

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
      ) : cycleRows.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="Aucun cycle"
          description="Commencez par créer un cycle de culture"
          action={{
            label: 'Creer un cycle',
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cycleRows.map((cycle: CultureCycleRow) => {
            const status = cycle.status || 'PLANNING';
            const st = statusConfig[status] || statusConfig.PLANNING;
            const progress = cycle.progress || 0;

            return (
              <Card key={cycle.id || cycle._id} className="cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Sprout className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {cycle.cropType}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {cycle.parcelName || cycle.parcelId}
                        </p>
                      </div>
                    </div>
                    <Badge variant={st.variant} dot>
                      {st.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <p className="text-sm font-bold">{cycle.area || '-'} ha</p>
                      <p className="text-[10px] text-muted-foreground">Surface</p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <p className="text-sm font-bold flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3" />
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {cycle.startDate ? new Date(cycle.startDate).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} variant={progress > 80 ? 'success' : 'default'} size="sm" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Cycle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau cycle de culture</DialogTitle>
            <DialogDescription>Créez un nouveau cycle de production</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <Input
                label="Type de culture"
                placeholder="Oranges Valencia"
                value={formData.cropType}
                onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                required
              />
              <Select
                label="Parcelle"
                value={formData.parcelId}
                onChange={(e) => setFormData({ ...formData, parcelId: e.target.value })}
                required
              >
                <option value="">Sélectionner une parcelle</option>
                {parcelList.map((p: ParcelOption) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Date de début"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <Input
                label="Date de fin prévue"
                type="date"
                value={formData.expectedEndDate}
                onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
                required
              />
              <Input
                label="Densité de plantation"
                type="number"
                placeholder="1000"
                value={formData.plantingDensity}
                onChange={(e) => setFormData({ ...formData, plantingDensity: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success" loading={createCycle.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
