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
import { useEmployees, useCreateEmployee, useAttendanceToday, useMarkAttendance } from '@/hooks/use-api';
import { Plus, Users, UserCheck, Mail, Phone, Calendar } from 'lucide-react';

export default function HRPage() {
  const t = useTranslations('hr');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    salary: '',
    startDate: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveFarmId(localStorage.getItem('fla7a_farm'));
    }
  }, []);

  const { data: employees, isLoading } = useEmployees(activeFarmId || undefined);
  const { data: attendanceToday } = useAttendanceToday(activeFarmId || undefined);
  const createEmployee = useCreateEmployee();
  const markAttendance = useMarkAttendance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmployee.mutateAsync({
        farmId: activeFarmId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        salary: parseFloat(formData.salary),
        startDate: formData.startDate,
      });
      setDialogOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', position: '', salary: '', startDate: '' });
      alert('Employé créé avec succès!');
    } catch (error: any) {
      alert('Erreur: ' + (error?.response?.data?.message || error.message));
    }
  };

  const handleAttendance = async (status: 'PRESENT' | 'ABSENT') => {
    if (!selectedEmployeeId) return;
    try {
      await markAttendance.mutateAsync({
        employeeId: selectedEmployeeId,
        farmId: activeFarmId,
        status,
        date: new Date().toISOString(),
      });
      setAttendanceDialogOpen(false);
      setSelectedEmployeeId('');
      alert('Pointage enregistré!');
    } catch (error: any) {
      alert('Erreur: ' + (error?.response?.data?.message || error.message));
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? '...' : `${employees?.length || 0} employés`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<UserCheck className="h-4 w-4" />} onClick={() => setAttendanceDialogOpen(true)}>
            Pointage
          </Button>
          <Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
            Ajouter employé
          </Button>
        </div>
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
      ) : employees && employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun employé"
          description="Commencez par ajouter des employés"
          action={
            <Button variant="success" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
              Ajouter un employé
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees?.map((emp: any) => (
            <Card key={emp.id || emp._id} className="cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <p className="text-xs text-muted-foreground">{emp.position}</p>
                    </div>
                  </div>
                  <Badge variant="success" dot>
                    Actif
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{emp.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{emp.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Salaire</span>
                    <span className="font-medium">{emp.salary || 0} MAD</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel employé</DialogTitle>
            <DialogDescription>Ajoutez un nouvel employé à votre équipe</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  placeholder="Ahmed"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Nom"
                  placeholder="Benali"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Email"
                type="email"
                placeholder="ahmed@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Téléphone"
                placeholder="+212 6..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Poste"
                placeholder="Ouvrier agricole"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
              />
              <Input
                label="Salaire mensuel (MAD)"
                type="number"
                placeholder="3000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                required
              />
              <Input
                label="Date d'embauche"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success" loading={createEmployee.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pointage du jour</DialogTitle>
            <DialogDescription>Marquer la présence d'un employé</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              label="Employé"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              required
            >
              <option value="">Sélectionner un employé</option>
              {employees?.map((emp: any) => (
                <option key={emp.id || emp._id} value={emp.id || emp._id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => handleAttendance('ABSENT')} disabled={!selectedEmployeeId}>
              Absent
            </Button>
            <Button variant="success" onClick={() => handleAttendance('PRESENT')} disabled={!selectedEmployeeId}>
              Présent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
