'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInvoices, useCreateInvoice, useClients } from '@/hooks/use-api';
import { Plus, Receipt, FileText, TrendingUp } from 'lucide-react';

export default function FinancePage() {
  const t = useTranslations('finance');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    dueDate: '',
    description: '',
    type: 'SALE',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveFarmId(localStorage.getItem('fla7a_farm'));
    }
  }, []);

  const { data: invoices, isLoading } = useInvoices(activeFarmId || undefined);
  const { data: clients } = useClients(activeFarmId || undefined);
  const createInvoice = useCreateInvoice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoice.mutateAsync({
        farmId: activeFarmId,
        clientId: formData.clientId,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        description: formData.description,
        type: formData.type,
      });
      setDialogOpen(false);
      setFormData({ clientId: '', amount: '', dueDate: '', description: '', type: 'SALE' });
      alert('Facture créée avec succès!');
    } catch (error: any) {
      alert('Erreur: ' + (error?.response?.data?.message || error.message));
    }
  };

  const totalAmount = invoices?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? '...' : `${invoices?.length || 0} factures - ${totalAmount.toLocaleString()} MAD`}
          </p>
        </div>
        <Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
          Nouvelle facture
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      ) : invoices && invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucune facture"
          description="Commencez par créer une facture"
          action={
            <Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
              Créer une facture
            </Button>
          }
        />
      ) : (
        <Card hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/30">
                  <th className="text-start p-3 font-medium text-muted-foreground">Numéro</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">Montant</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">Échéance</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {invoices?.map((invoice: any) => (
                  <tr key={invoice.id || invoice._id} className="border-b hover:bg-secondary/20 transition-colors cursor-pointer">
                    <td className="p-3 font-medium">{invoice.number || invoice.id || '-'}</td>
                    <td className="p-3">{invoice.clientName || invoice.clientId || 'N/A'}</td>
                    <td className="p-3">
                      <Badge variant={invoice.type === 'SALE' ? 'success' : 'warning'}>
                        {invoice.type === 'SALE' ? 'Vente' : 'Achat'}
                      </Badge>
                    </td>
                    <td className="p-3 font-semibold">{invoice.amount?.toLocaleString() || 0} MAD</td>
                    <td className="p-3 text-muted-foreground">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3">
                      <Badge variant={invoice.status === 'PAID' ? 'success' : 'warning'} dot>
                        {invoice.status === 'PAID' ? 'Payée' : 'En attente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle facture</DialogTitle>
            <DialogDescription>Créez une nouvelle facture</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="SALE">Vente</option>
                <option value="PURCHASE">Achat</option>
              </Select>
              <Select
                label="Client"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
              >
                <option value="">Sélectionner un client</option>
                {clients?.map((c: any) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Montant (MAD)"
                type="number"
                step="0.01"
                placeholder="1000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              <Input
                label="Date d'échéance"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
              <Textarea
                label="Description"
                placeholder="Description de la facture..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success" loading={createInvoice.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
