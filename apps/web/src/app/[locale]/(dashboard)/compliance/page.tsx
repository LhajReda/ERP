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
import { useCertifications, useCreateCertification } from '@/hooks/use-api';
import { Plus, ShieldCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function CompliancePage() {
  const t = useTranslations('compliance');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ORGANIC',
    issueDate: '',
    expiryDate: '',
    issuedBy: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveFarmId(localStorage.getItem('fla7a_farm'));
    }
  }, []);

  const { data: certifications, isLoading } = useCertifications(activeFarmId || undefined);
  const createCertification = useCreateCertification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCertification.mutateAsync({
        farmId: activeFarmId,
        name: formData.name,
        type: formData.type,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        issuedBy: formData.issuedBy,
      });
      setDialogOpen(false);
      setFormData({ name: '', type: 'ORGANIC', issueDate: '', expiryDate: '', issuedBy: '' });
      alert('Certification créée avec succès!');
    } catch (error: any) {
      alert('Erreur: ' + (error?.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (cert: any) => {
    if (!cert.expiryDate) return <Badge variant="success" dot>Active</Badge>;
    const expiryDate = new Date(cert.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return <Badge variant="danger" dot>Expirée</Badge>;
    } else if (daysUntilExpiry < 30) {
      return <Badge variant="warning" dot>Expire bientôt</Badge>;
    } else {
      return <Badge variant="success" dot>Active</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? '...' : `${certifications?.length || 0} certifications`}
          </p>
        </div>
        <Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
          Nouvelle certification
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
      ) : certifications && certifications.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Aucune certification"
          description="Commencez par ajouter des certifications"
          action={
            <Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
              Ajouter une certification
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications?.map((cert: any) => (
            <Card key={cert.id || cert._id} className="cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {cert.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{cert.type}</p>
                    </div>
                  </div>
                  {getStatusBadge(cert)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Délivré par</span>
                    <span className="font-medium">{cert.issuedBy || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Délivré le</span>
                    <span className="font-medium">
                      {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expire le</span>
                    <span className="font-medium">
                      {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Certification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle certification</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle certification</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <Input
                label="Nom de la certification"
                placeholder="GlobalGAP v5.2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="ORGANIC">Agriculture Biologique</option>
                <option value="GLOBALGAP">GlobalGAP</option>
                <option value="RAINFOREST">Rainforest Alliance</option>
                <option value="FAIRTRADE">Fairtrade</option>
                <option value="ONSSA">ONSSA</option>
                <option value="OTHER">Autre</option>
              </Select>
              <Input
                label="Organisme émetteur"
                placeholder="ECOCERT"
                value={formData.issuedBy}
                onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                required
              />
              <Input
                label="Date de délivrance"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
              <Input
                label="Date d'expiration"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success" loading={createCertification.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
