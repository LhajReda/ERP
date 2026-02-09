import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FLA7A ERP database...');

  // =============================================
  // TENANT
  // =============================================
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'FLA7A Demo',
      subdomain: 'demo',
      plan: 'cooperative',
      maxFarms: 5,
      maxUsers: 50,
      isActive: true,
      subscriptionEnd: new Date('2027-12-31'),
    },
  });
  console.log('✅ Tenant created:', tenant.name);

  // =============================================
  // USERS
  // =============================================
  const passwordHash = await bcrypt.hash('Fla7a@2025', 10);

  const admin = await prisma.user.upsert({
    where: { phone: '+212661000001' },
    update: {},
    create: {
      phone: '+212661000001',
      email: 'admin@fla7a.ma',
      passwordHash,
      firstName: 'Mohammed',
      lastName: 'El Fassi',
      firstNameAr: 'محمد',
      lastNameAr: 'الفاسي',
      cin: 'AB123456',
      role: 'ADMIN',
      language: 'fr',
      tenantId: tenant.id,
    },
  });

  const comptable = await prisma.user.upsert({
    where: { phone: '+212662000002' },
    update: {},
    create: {
      phone: '+212662000002',
      email: 'compta@fla7a.ma',
      passwordHash,
      firstName: 'Fatima',
      lastName: 'Bennani',
      firstNameAr: 'فاطمة',
      lastNameAr: 'بناني',
      cin: 'BH234567',
      role: 'COMPTABLE',
      language: 'fr',
      tenantId: tenant.id,
    },
  });

  const chef = await prisma.user.upsert({
    where: { phone: '+212663000003' },
    update: {},
    create: {
      phone: '+212663000003',
      passwordHash,
      firstName: 'Brahim',
      lastName: 'Ait Ouahmane',
      firstNameAr: 'ابراهيم',
      lastNameAr: 'ايت وحمان',
      cin: 'JB345678',
      role: 'CHEF_EQUIPE',
      language: 'dar',
      tenantId: tenant.id,
    },
  });

  const commercial = await prisma.user.upsert({
    where: { phone: '+212664000004' },
    update: {},
    create: {
      phone: '+212664000004',
      email: 'ventes@fla7a.ma',
      passwordHash,
      firstName: 'Youssef',
      lastName: 'Tazi',
      firstNameAr: 'يوسف',
      lastNameAr: 'التازي',
      cin: 'CD456789',
      role: 'COMMERCIAL',
      language: 'fr',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Users created: admin, comptable, chef, commercial');

  // =============================================
  // FARM 1: Souss-Massa - Agrumes
  // =============================================
  const farm1 = await prisma.farm.create({
    data: {
      name: 'Domaine Al Baraka',
      nameAr: 'ضيعة البركة',
      ice: '001234567890123',
      region: 'SOUSS_MASSA',
      province: 'Taroudant',
      commune: 'Oulad Teima',
      douar: 'Douar Lbir',
      gpsLat: 30.4,
      gpsLng: -9.2,
      totalArea: 85,
      cultivatedArea: 72,
      waterSource: 'FORAGE',
      farmType: 'IRRIGUE',
      phone: '+212528301010',
      email: 'baraka@fla7a.ma',
      tenantId: tenant.id,
    },
  });

  // Farm 1 - Parcels
  const parcel1a = await prisma.parcel.create({
    data: {
      name: 'Bloc A - Orangers Valencia',
      nameAr: 'القطعة أ - البرتقال فالنسيا',
      code: 'SM-A01',
      area: 25,
      soilType: 'ARGILO_SABLEUX',
      irrigationType: 'GOUTTE_A_GOUTTE',
      waterQuota: 5000,
      status: 'CULTIVEE',
      currentCrop: 'Oranges Valencia Late',
      farmId: farm1.id,
    },
  });

  const parcel1b = await prisma.parcel.create({
    data: {
      name: 'Bloc B - Clémentines Nour',
      nameAr: 'القطعة ب - كليمونتين نور',
      code: 'SM-B01',
      area: 20,
      soilType: 'SABLO_LIMONEUX',
      irrigationType: 'GOUTTE_A_GOUTTE',
      waterQuota: 4000,
      status: 'CULTIVEE',
      currentCrop: 'Clémentine Nour',
      farmId: farm1.id,
    },
  });

  const parcel1c = await prisma.parcel.create({
    data: {
      name: 'Bloc C - Citrons Eureka',
      nameAr: 'القطعة ج - الليمون يوريكا',
      code: 'SM-C01',
      area: 15,
      soilType: 'LIMONEUX',
      irrigationType: 'GOUTTE_A_GOUTTE',
      waterQuota: 3000,
      status: 'CULTIVEE',
      currentCrop: 'Citron Eureka',
      farmId: farm1.id,
    },
  });

  await prisma.parcel.create({
    data: {
      name: 'Bloc D - Nouvelle plantation',
      nameAr: 'القطعة د - غراسة جديدة',
      code: 'SM-D01',
      area: 12,
      soilType: 'ARGILO_SABLEUX',
      irrigationType: 'GOUTTE_A_GOUTTE',
      status: 'PREPARATION',
      farmId: farm1.id,
    },
  });

  console.log('✅ Farm 1 created: Domaine Al Baraka (Souss-Massa, 85 ha, agrumes)');

  // =============================================
  // FARM 2: Fès-Meknès - Olivier
  // =============================================
  const farm2 = await prisma.farm.create({
    data: {
      name: 'Ferme Zitouna',
      nameAr: 'مزرعة الزيتون',
      ice: '002345678901234',
      region: 'FES_MEKNES',
      province: 'Meknès',
      commune: 'Ain Taoujdate',
      douar: 'Douar Zitoun',
      gpsLat: 33.85,
      gpsLng: -5.55,
      totalArea: 120,
      cultivatedArea: 100,
      waterSource: 'PUITS',
      farmType: 'MIXTE',
      phone: '+212535401020',
      tenantId: tenant.id,
    },
  });

  const parcel2a = await prisma.parcel.create({
    data: {
      name: 'Oliveraie Nord - Picholine',
      nameAr: 'زيتون الشمال - بيشولين',
      code: 'FM-N01',
      area: 40,
      soilType: 'CALCAIRE',
      irrigationType: 'GOUTTE_A_GOUTTE',
      waterQuota: 6000,
      status: 'CULTIVEE',
      currentCrop: 'Olive Picholine',
      farmId: farm2.id,
    },
  });

  const parcel2b = await prisma.parcel.create({
    data: {
      name: 'Oliveraie Sud - Haouzia',
      nameAr: 'زيتون الجنوب - الحوزية',
      code: 'FM-S01',
      area: 35,
      soilType: 'ARGILO_LIMONEUX',
      irrigationType: 'GRAVITAIRE',
      status: 'CULTIVEE',
      currentCrop: 'Olive Haouzia',
      farmId: farm2.id,
    },
  });

  await prisma.parcel.create({
    data: {
      name: 'Céréales - Blé tendre',
      nameAr: 'الحبوب - القمح اللين',
      code: 'FM-C01',
      area: 25,
      soilType: 'LIMONEUX',
      irrigationType: 'AUCUNE',
      status: 'CULTIVEE',
      currentCrop: 'Blé tendre Achtar',
      farmId: farm2.id,
    },
  });

  console.log('✅ Farm 2 created: Ferme Zitouna (Fès-Meknès, 120 ha, oliviers + céréales)');

  // =============================================
  // FARM 3: Gharb - Maraîchage
  // =============================================
  const farm3 = await prisma.farm.create({
    data: {
      name: 'Les Jardins du Gharb',
      nameAr: 'حدائق الغرب',
      ice: '003456789012345',
      region: 'RABAT_SALE_KENITRA',
      province: 'Kénitra',
      commune: 'Sidi Kacem',
      gpsLat: 34.22,
      gpsLng: -5.71,
      totalArea: 45,
      cultivatedArea: 40,
      waterSource: 'BARRAGE',
      farmType: 'IRRIGUE',
      phone: '+212537501030',
      tenantId: tenant.id,
    },
  });

  const parcel3a = await prisma.parcel.create({
    data: {
      name: 'Serres - Tomate',
      nameAr: 'البيوت البلاستيكية - الطماطم',
      code: 'GH-S01',
      area: 8,
      soilType: 'SABLO_LIMONEUX',
      irrigationType: 'GOUTTE_A_GOUTTE',
      waterQuota: 2500,
      status: 'CULTIVEE',
      currentCrop: 'Tomate Daniella',
      farmId: farm3.id,
    },
  });

  const parcel3b = await prisma.parcel.create({
    data: {
      name: 'Plein champ - Pomme de terre',
      nameAr: 'الحقل المفتوح - البطاطس',
      code: 'GH-P01',
      area: 15,
      soilType: 'SABLEUX',
      irrigationType: 'ASPERSION',
      waterQuota: 4000,
      status: 'CULTIVEE',
      currentCrop: 'Pomme de terre Spunta',
      farmId: farm3.id,
    },
  });

  await prisma.parcel.create({
    data: {
      name: 'Pastèque - Plein champ',
      nameAr: 'الدلاح - الحقل المفتوح',
      code: 'GH-W01',
      area: 12,
      soilType: 'SABLEUX',
      irrigationType: 'GOUTTE_A_GOUTTE',
      status: 'JACHERE',
      farmId: farm3.id,
    },
  });

  console.log('✅ Farm 3 created: Les Jardins du Gharb (Kénitra, 45 ha, maraîchage)');

  // =============================================
  // EMPLOYEES (Farm 1)
  // =============================================
  const emp1 = await prisma.employee.create({
    data: {
      cin: 'JB567890',
      firstName: 'Hassan',
      lastName: 'Ouahbi',
      firstNameAr: 'حسن',
      lastNameAr: 'وهبي',
      phone: '+212661100001',
      type: 'PERMANENT',
      role: 'CHEF_EQUIPE',
      dailyRate: 200,
      monthlyRate: 5200,
      cnssNumber: '123456789',
      hireDate: new Date('2020-03-15'),
      isActive: true,
      skills: ['taille', 'irrigation', 'traitement'],
      farmId: farm1.id,
    },
  });

  await prisma.employee.create({
    data: {
      cin: 'HA678901',
      firstName: 'Aicha',
      lastName: 'Raiss',
      firstNameAr: 'عائشة',
      lastNameAr: 'الرئيس',
      phone: '+212661100002',
      type: 'PERMANENT',
      role: 'TECHNICIEN',
      dailyRate: 180,
      monthlyRate: 4680,
      cnssNumber: '234567890',
      hireDate: new Date('2021-06-01'),
      isActive: true,
      skills: ['analyse_sol', 'fertilisation', 'phytosanitaire'],
      farmId: farm1.id,
    },
  });

  for (let i = 1; i <= 5; i++) {
    await prisma.employee.create({
      data: {
        cin: `SM${100000 + i}`,
        firstName: ['Ahmed', 'Mustapha', 'Rachid', 'Khalid', 'Said'][i - 1],
        lastName: ['Amrani', 'Bouzid', 'Chraibi', 'Dahbi', 'Errachidi'][i - 1],
        phone: `+21266110010${i}`,
        type: 'SAISONNIER',
        role: 'OUVRIER',
        dailyRate: 100,
        hireDate: new Date('2024-10-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
        skills: ['cueillette', 'conditionnement'],
        farmId: farm1.id,
      },
    });
  }

  // Employees Farm 2
  await prisma.employee.create({
    data: {
      cin: 'MA789012',
      firstName: 'Omar',
      lastName: 'Zeroual',
      firstNameAr: 'عمر',
      lastNameAr: 'زروال',
      phone: '+212662200001',
      type: 'PERMANENT',
      role: 'CHEF_EQUIPE',
      dailyRate: 180,
      monthlyRate: 4680,
      cnssNumber: '345678901',
      hireDate: new Date('2019-01-10'),
      isActive: true,
      skills: ['taille_olivier', 'pressoir', 'récolte'],
      farmId: farm2.id,
    },
  });

  // Employees Farm 3
  await prisma.employee.create({
    data: {
      cin: 'KB890123',
      firstName: 'Nadia',
      lastName: 'Filali',
      firstNameAr: 'نادية',
      lastNameAr: 'الفيلالي',
      phone: '+212663300001',
      type: 'PERMANENT',
      role: 'TECHNICIEN',
      dailyRate: 170,
      monthlyRate: 4420,
      cnssNumber: '456789012',
      hireDate: new Date('2022-02-15'),
      isActive: true,
      skills: ['serres', 'irrigation_goutte', 'semis'],
      farmId: farm3.id,
    },
  });

  console.log('✅ Employees created: 10 employees across 3 farms');

  // =============================================
  // PRODUCTS / STOCK
  // =============================================
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'NPK 15-15-15',
        nameAr: 'سماد مركب',
        sku: 'FERT-NPK-001',
        category: 'ENGRAIS',
        unit: 'SAC',
        currentStock: 150,
        minStock: 30,
        unitPrice: 280,
        farmId: farm1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sulfate de potassium',
        nameAr: 'كبريتات البوتاسيوم',
        sku: 'FERT-K2S-001',
        category: 'ENGRAIS',
        unit: 'SAC',
        currentStock: 80,
        minStock: 20,
        unitPrice: 420,
        farmId: farm1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Confidor (Imidaclopride)',
        nameAr: 'كونفيدور',
        sku: 'PHYTO-CONF-001',
        category: 'PHYTOSANITAIRE',
        unit: 'LITRE',
        currentStock: 45,
        minStock: 10,
        unitPrice: 350,
        onssaApproval: 'ONSSA-2024-001',
        activeSubstance: 'Imidaclopride 200 g/l',
        toxicityClass: 'II',
        farmId: farm1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Caisses agrumes 20kg',
        nameAr: 'صناديق الحوامض 20 كلغ',
        sku: 'EMB-CAI-001',
        category: 'EMBALLAGE',
        unit: 'UNITE',
        currentStock: 5000,
        minStock: 1000,
        unitPrice: 8,
        farmId: farm1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gasoil agricole',
        nameAr: 'الغازوال الفلاحي',
        sku: 'CARB-GAS-001',
        category: 'CARBURANT',
        unit: 'LITRE',
        currentStock: 2000,
        minStock: 500,
        unitPrice: 10.5,
        farmId: farm1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Huile olive extra vierge',
        nameAr: 'زيت الزيتون البكر الممتاز',
        sku: 'PROD-HUI-001',
        category: 'AUTRE',
        unit: 'LITRE',
        currentStock: 3000,
        minStock: 500,
        unitPrice: 65,
        farmId: farm2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Olives Picholine (conserve)',
        nameAr: 'زيتون بيشولين (معلب)',
        sku: 'PROD-OLV-001',
        category: 'AUTRE',
        unit: 'KG',
        currentStock: 8000,
        minStock: 1000,
        unitPrice: 25,
        farmId: farm2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Semences tomate Daniella F1',
        nameAr: 'بذور طماطم دانييلا',
        sku: 'SEM-TOM-001',
        category: 'SEMENCES',
        unit: 'UNITE',
        currentStock: 20000,
        minStock: 5000,
        unitPrice: 0.8,
        farmId: farm3.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Semences pomme de terre Spunta',
        nameAr: 'بذور البطاطس سبونتا',
        sku: 'SEM-PDT-001',
        category: 'SEMENCES',
        unit: 'KG',
        currentStock: 3000,
        minStock: 500,
        unitPrice: 12,
        farmId: farm3.id,
      },
    }),
  ]);

  console.log('✅ Products created:', products.length, 'items');

  // =============================================
  // SUPPLIERS
  // =============================================
  await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Agri-Souss Intrants',
        nameAr: 'فلاحة سوس للمدخلات',
        ice: '004567890123456',
        contact: 'M. Lahlou',
        phone: '+212528201010',
        city: 'Agadir',
        category: 'Engrais & Phytosanitaires',
        rating: 4,
        farmId: farm1.id,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Maroc Emballage SARL',
        nameAr: 'التعبئة المغرب ش.م.م',
        ice: '005678901234567',
        contact: 'Mme. Kadiri',
        phone: '+212522303030',
        city: 'Casablanca',
        category: 'Emballage',
        rating: 5,
        farmId: farm1.id,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Coopérative Zitoun Meknès',
        nameAr: 'تعاونية زيتون مكناس',
        contact: 'M. Benjelloun',
        phone: '+212535404040',
        city: 'Meknès',
        category: 'Pressoir & Conditionnement',
        rating: 4,
        farmId: farm2.id,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Semences du Gharb',
        nameAr: 'بذور الغرب',
        ice: '006789012345678',
        contact: 'M. Benali',
        phone: '+212537505050',
        city: 'Kénitra',
        category: 'Semences maraîchères',
        rating: 3,
        farmId: farm3.id,
      },
    }),
  ]);

  console.log('✅ Suppliers created: 4 suppliers');

  // =============================================
  // CLIENTS
  // =============================================
  await Promise.all([
    prisma.client.create({
      data: {
        name: 'Marjane Holding',
        nameAr: 'مرجان القابضة',
        type: 'Grossiste',
        ice: '100000000000001',
        contact: 'Service Achats',
        phone: '+212522600000',
        city: 'Casablanca',
        paymentTerms: '60 jours',
        creditLimit: 500000,
        rating: 5,
        farmId: farm1.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Souss Export SA',
        nameAr: 'سوس للتصدير',
        type: 'Exportateur',
        ice: '100000000000002',
        contact: 'M. El Idrissi',
        phone: '+212528700000',
        city: 'Agadir',
        country: 'Maroc',
        paymentTerms: '30 jours',
        creditLimit: 1000000,
        rating: 4,
        farmId: farm1.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Huilerie Atlas',
        nameAr: 'معصرة أطلس',
        type: 'Transformateur',
        ice: '100000000000003',
        contact: 'M. Fassi Fihri',
        phone: '+212535800000',
        city: 'Fès',
        paymentTerms: '45 jours',
        creditLimit: 300000,
        rating: 4,
        farmId: farm2.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Grossiste Légumes Rabat',
        nameAr: 'تاجر خضر بالجملة الرباط',
        type: 'Grossiste',
        contact: 'M. Chaoui',
        phone: '+212537900000',
        city: 'Rabat',
        paymentTerms: 'Comptant',
        farmId: farm3.id,
      },
    }),
  ]);

  console.log('✅ Clients created: 4 clients');

  // =============================================
  // BANK ACCOUNTS
  // =============================================
  await Promise.all([
    prisma.bankAccount.create({
      data: {
        bankName: 'Crédit Agricole du Maroc',
        accountNumber: '225 810 0001234567890123',
        rib: '225 810 0001234567890123 45',
        balance: 450000,
        isDefault: true,
        farmId: farm1.id,
      },
    }),
    prisma.bankAccount.create({
      data: {
        bankName: 'Attijariwafa Bank',
        accountNumber: '007 780 0009876543210987',
        balance: 120000,
        farmId: farm2.id,
      },
    }),
    prisma.bankAccount.create({
      data: {
        bankName: 'Banque Populaire',
        accountNumber: '101 150 0005432109876543',
        balance: 85000,
        isDefault: true,
        farmId: farm3.id,
      },
    }),
  ]);

  console.log('✅ Bank accounts created: 3 accounts');

  // =============================================
  // CULTURE CYCLES
  // =============================================
  const cycle1 = await prisma.cultureCycle.create({
    data: {
      parcelId: parcel1a.id,
      cropType: 'AGRUMES_ORANGE',
      variety: 'Valencia Late',
      varietyAr: 'فالنسيا لايت',
      season: 'PERENNE',
      campaignYear: '2024/2025',
      sowingDate: new Date('2018-11-01'),
      expectedHarvest: new Date('2025-03-15'),
      estimatedYield: 35000,
      actualYield: 28000,
      totalCost: 180000,
      totalRevenue: 350000,
      status: 'RECOLTE',
    },
  });

  await prisma.cultureCycle.create({
    data: {
      parcelId: parcel1b.id,
      cropType: 'AGRUMES_CLEMENTINE',
      variety: 'Nour',
      varietyAr: 'نور',
      season: 'PERENNE',
      campaignYear: '2024/2025',
      sowingDate: new Date('2019-10-15'),
      expectedHarvest: new Date('2025-01-15'),
      estimatedYield: 25000,
      actualYield: 22000,
      totalCost: 140000,
      totalRevenue: 440000,
      status: 'RECOLTE',
    },
  });

  await prisma.cultureCycle.create({
    data: {
      parcelId: parcel1c.id,
      cropType: 'AGRUMES_CITRON',
      variety: 'Eureka',
      season: 'PERENNE',
      campaignYear: '2024/2025',
      sowingDate: new Date('2020-03-01'),
      expectedHarvest: new Date('2025-06-01'),
      estimatedYield: 18000,
      totalCost: 95000,
      status: 'EN_COURS',
    },
  });

  const cycle2 = await prisma.cultureCycle.create({
    data: {
      parcelId: parcel2a.id,
      cropType: 'OLIVIER',
      variety: 'Picholine Marocaine',
      varietyAr: 'بيشولين مغربية',
      season: 'PERENNE',
      campaignYear: '2024/2025',
      sowingDate: new Date('2010-01-01'),
      expectedHarvest: new Date('2024-11-15'),
      estimatedYield: 60000,
      actualYield: 55000,
      totalCost: 200000,
      totalRevenue: 500000,
      status: 'TERMINE',
    },
  });

  await prisma.cultureCycle.create({
    data: {
      parcelId: parcel2b.id,
      cropType: 'OLIVIER',
      variety: 'Haouzia',
      varietyAr: 'الحوزية',
      season: 'PERENNE',
      campaignYear: '2024/2025',
      sowingDate: new Date('2012-03-01'),
      expectedHarvest: new Date('2024-12-01'),
      estimatedYield: 45000,
      actualYield: 42000,
      totalCost: 160000,
      totalRevenue: 380000,
      status: 'TERMINE',
    },
  });

  const cycle3 = await prisma.cultureCycle.create({
    data: {
      parcelId: parcel3a.id,
      cropType: 'TOMATE',
      variety: 'Daniella F1',
      season: 'AUTOMNE_HIVER',
      campaignYear: '2024/2025',
      sowingDate: new Date('2024-09-15'),
      expectedHarvest: new Date('2025-03-01'),
      estimatedYield: 120000,
      actualYield: 95000,
      totalCost: 280000,
      totalRevenue: 570000,
      status: 'RECOLTE',
    },
  });

  await prisma.cultureCycle.create({
    data: {
      parcelId: parcel3b.id,
      cropType: 'POMME_DE_TERRE',
      variety: 'Spunta',
      season: 'AUTOMNE_HIVER',
      campaignYear: '2024/2025',
      sowingDate: new Date('2024-10-01'),
      expectedHarvest: new Date('2025-02-15'),
      estimatedYield: 300000,
      totalCost: 250000,
      status: 'EN_COURS',
    },
  });

  console.log('✅ Culture cycles created: 7 cycles across 3 farms');

  // =============================================
  // FARM ACTIVITIES (samples)
  // =============================================
  await Promise.all([
    prisma.farmActivity.create({
      data: {
        cycleId: cycle1.id,
        type: 'FERTILISATION',
        date: new Date('2024-11-10'),
        description: 'Apport NPK 15-15-15, 500 kg/ha avant floraison',
        cost: 35000,
        laborHours: 16,
        workersCount: 4,
        createdBy: admin.id,
      },
    }),
    prisma.farmActivity.create({
      data: {
        cycleId: cycle1.id,
        type: 'TRAITEMENT_PHYTO',
        date: new Date('2024-12-05'),
        description: 'Traitement anti-cochenilles Confidor 0.5 L/ha',
        cost: 12000,
        laborHours: 8,
        workersCount: 2,
        equipmentUsed: 'Pulvérisateur tracté 2000L',
        createdBy: admin.id,
      },
    }),
    prisma.farmActivity.create({
      data: {
        cycleId: cycle1.id,
        type: 'IRRIGATION',
        date: new Date('2025-01-10'),
        description: 'Cycle irrigation goutte à goutte - 4h/jour',
        cost: 8000,
        laborHours: 4,
        workersCount: 1,
        createdBy: chef.id,
      },
    }),
    prisma.farmActivity.create({
      data: {
        cycleId: cycle1.id,
        type: 'RECOLTE',
        date: new Date('2025-02-01'),
        description: 'Début récolte oranges Valencia - première passe',
        cost: 45000,
        laborHours: 80,
        workersCount: 12,
        createdBy: chef.id,
      },
    }),
    prisma.farmActivity.create({
      data: {
        cycleId: cycle2.id,
        type: 'TAILLE',
        date: new Date('2024-09-01'),
        description: 'Taille de fructification oliviers Picholine',
        cost: 30000,
        laborHours: 120,
        workersCount: 8,
        createdBy: admin.id,
      },
    }),
    prisma.farmActivity.create({
      data: {
        cycleId: cycle2.id,
        type: 'RECOLTE',
        date: new Date('2024-11-15'),
        description: 'Récolte olives - gaulage + filets',
        cost: 60000,
        laborHours: 200,
        workersCount: 20,
        equipmentUsed: 'Vibreurs, filets',
        createdBy: admin.id,
      },
    }),
    prisma.farmActivity.create({
      data: {
        cycleId: cycle3.id,
        type: 'SEMIS',
        date: new Date('2024-09-15'),
        description: 'Repiquage tomate Daniella F1 en serre',
        cost: 15000,
        laborHours: 24,
        workersCount: 6,
        createdBy: admin.id,
      },
    }),
    prisma.farmActivity.create({
      data: {
        cycleId: cycle3.id,
        type: 'FERTILISATION',
        date: new Date('2024-10-20'),
        description: 'Fertigation NPK soluble via goutte à goutte',
        cost: 18000,
        laborHours: 4,
        workersCount: 1,
        createdBy: admin.id,
      },
    }),
  ]);

  console.log('✅ Farm activities created: 8 activities');

  // =============================================
  // HARVESTS
  // =============================================
  await Promise.all([
    prisma.harvest.create({
      data: {
        cycleId: cycle1.id,
        date: new Date('2025-02-01'),
        quantity: 15000,
        unit: 'KG',
        quality: 'Extra',
        caliber: '70-80mm',
        storageLocation: 'Station conditionnement',
        destinationType: 'Export',
      },
    }),
    prisma.harvest.create({
      data: {
        cycleId: cycle1.id,
        date: new Date('2025-02-15'),
        quantity: 13000,
        unit: 'KG',
        quality: 'Catégorie I',
        caliber: '60-70mm',
        storageLocation: 'Station conditionnement',
        destinationType: 'Marché local',
      },
    }),
    prisma.harvest.create({
      data: {
        cycleId: cycle2.id,
        date: new Date('2024-11-15'),
        quantity: 30000,
        unit: 'KG',
        quality: 'Huile',
        destinationType: 'Pressoir',
      },
    }),
    prisma.harvest.create({
      data: {
        cycleId: cycle2.id,
        date: new Date('2024-12-01'),
        quantity: 25000,
        unit: 'KG',
        quality: 'Table',
        destinationType: 'Conserverie',
      },
    }),
    prisma.harvest.create({
      data: {
        cycleId: cycle3.id,
        date: new Date('2025-01-05'),
        quantity: 50000,
        unit: 'KG',
        quality: 'Extra',
        caliber: '60-80mm',
        storageLocation: 'Chambre froide',
        destinationType: 'Grossiste',
      },
    }),
    prisma.harvest.create({
      data: {
        cycleId: cycle3.id,
        date: new Date('2025-02-01'),
        quantity: 45000,
        unit: 'KG',
        quality: 'Catégorie I',
        storageLocation: 'Chambre froide',
        destinationType: 'Marché',
      },
    }),
  ]);

  console.log('✅ Harvests created: 6 harvests');

  // =============================================
  // CERTIFICATIONS
  // =============================================
  await Promise.all([
    prisma.certification.create({
      data: {
        farmId: farm1.id,
        type: 'ONSSA',
        certificateNumber: 'ONSSA-SM-2024-001',
        issuedBy: 'ONSSA Taroudant',
        issueDate: new Date('2024-03-01'),
        expiryDate: new Date('2025-02-28'),
        status: 'active',
      },
    }),
    prisma.certification.create({
      data: {
        farmId: farm1.id,
        type: 'GLOBAL_GAP',
        certificateNumber: 'GG-MA-2024-5678',
        issuedBy: 'Bureau Veritas Maroc',
        issueDate: new Date('2024-06-15'),
        expiryDate: new Date('2025-06-14'),
        status: 'active',
      },
    }),
    prisma.certification.create({
      data: {
        farmId: farm2.id,
        type: 'BIO_MAROC',
        certificateNumber: 'BIO-MA-2024-0099',
        issuedBy: 'Ecocert Maroc',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2024-12-31'),
        status: 'expired',
      },
    }),
    prisma.certification.create({
      data: {
        farmId: farm3.id,
        type: 'ONSSA',
        certificateNumber: 'ONSSA-KN-2024-002',
        issuedBy: 'ONSSA Kénitra',
        issueDate: new Date('2024-05-01'),
        expiryDate: new Date('2025-04-30'),
        status: 'active',
      },
    }),
  ]);

  console.log('✅ Certifications created: 4 certifications');

  // =============================================
  // SOIL ANALYSES
  // =============================================
  await Promise.all([
    prisma.soilAnalysis.create({
      data: {
        parcelId: parcel1a.id,
        date: new Date('2024-09-15'),
        ph: 7.2,
        nitrogen: 45,
        phosphorus: 28,
        potassium: 180,
        organicMatter: 2.1,
        salinity: 0.8,
        texture: 'Argilo-sableux',
        labName: 'Laboratoire INRA Agadir',
      },
    }),
    prisma.soilAnalysis.create({
      data: {
        parcelId: parcel2a.id,
        date: new Date('2024-08-20'),
        ph: 7.8,
        nitrogen: 35,
        phosphorus: 22,
        potassium: 150,
        organicMatter: 1.8,
        salinity: 0.5,
        texture: 'Calcaire',
        labName: 'Laboratoire ENA Meknès',
      },
    }),
    prisma.soilAnalysis.create({
      data: {
        parcelId: parcel3a.id,
        date: new Date('2024-07-10'),
        ph: 6.8,
        nitrogen: 55,
        phosphorus: 35,
        potassium: 200,
        organicMatter: 2.8,
        salinity: 0.3,
        texture: 'Sablo-limoneux',
        labName: 'Laboratoire IAV Rabat',
      },
    }),
  ]);

  console.log('✅ Soil analyses created: 3 analyses');

  // =============================================
  // MARKET PRICES
  // =============================================
  const marketData = [
    { cropType: 'AGRUMES_ORANGE' as const, region: 'SOUSS_MASSA' as const, price: 5.5, market: 'Souk Oulad Teima' },
    { cropType: 'AGRUMES_CLEMENTINE' as const, region: 'SOUSS_MASSA' as const, price: 8.0, market: 'Souk Oulad Teima' },
    { cropType: 'AGRUMES_CITRON' as const, region: 'SOUSS_MASSA' as const, price: 7.0, market: 'Souk Agadir' },
    { cropType: 'OLIVIER' as const, region: 'FES_MEKNES' as const, price: 9.0, market: 'Souk Meknès' },
    { cropType: 'TOMATE' as const, region: 'RABAT_SALE_KENITRA' as const, price: 4.5, market: 'Marché Kénitra' },
    { cropType: 'POMME_DE_TERRE' as const, region: 'RABAT_SALE_KENITRA' as const, price: 3.5, market: 'Marché Kénitra' },
    { cropType: 'BLE_TENDRE' as const, region: 'FES_MEKNES' as const, price: 3.8, market: 'Souk Meknès' },
    { cropType: 'OIGNON' as const, region: 'CASABLANCA_SETTAT' as const, price: 2.8, market: 'Marché Gros Casa' },
  ];

  for (const mp of marketData) {
    await prisma.marketPrice.create({
      data: {
        ...mp,
        unit: 'KG',
        date: new Date('2025-01-15'),
        source: 'Relevé terrain FLA7A',
      },
    });
  }

  console.log('✅ Market prices created:', marketData.length, 'entries');

  // =============================================
  // ATTENDANCE RECORDS (last 7 days for emp1)
  // =============================================
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue; // Skip Sunday

    await prisma.attendance.create({
      data: {
        employeeId: emp1.id,
        date,
        checkIn: new Date(date.setHours(7, 0, 0)),
        checkOut: new Date(date.setHours(16, 0, 0)),
        hoursWorked: dayOfWeek === 6 ? 4 : 8,
        overtime: dayOfWeek === 6 ? 0 : 1,
        parcelName: 'Bloc A - Orangers',
        activityType: 'RECOLTE',
        status: dayOfWeek === 5 ? 'DEMI_JOURNEE' : 'PRESENT',
      },
    });
  }

  console.log('✅ Attendance records created: ~6 entries');

  // =============================================
  // NOTIFICATIONS
  // =============================================
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Stock bas: NPK 15-15-15',
        titleAr: 'مخزون منخفض: سماد مركب',
        message: 'Le stock de NPK est à 150 sacs, en dessous du seuil de 200.',
        messageAr: 'مخزون السماد المركب وصل ل 150 كيس، تحت العتبة ديال 200.',
        type: 'stock_alert',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Certification ONSSA expire dans 30 jours',
        titleAr: 'شهادة أونسا غادي تنتهي فـ 30 يوم',
        message: 'La certification ONSSA-SM-2024-001 expire le 28/02/2025.',
        messageAr: 'شهادة أونسا غادي تسالي فـ 28/02/2025.',
        type: 'compliance_alert',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: comptable.id,
        title: 'Facture en retard: Marjane Holding',
        titleAr: 'فاتورة متأخرة: مرجان القابضة',
        message: 'La facture FLA-2025-00012 de 185,000 MAD est en retard de 15 jours.',
        type: 'payment_alert',
        isRead: false,
      },
    }),
  ]);

  console.log('✅ Notifications created: 3 alerts');

  console.log('\n🎉 Seeding complete! FLA7A ERP is ready.');
  console.log('📊 Summary:');
  console.log('   - 1 Tenant (Demo)');
  console.log('   - 4 Users (admin, comptable, chef, commercial)');
  console.log('   - 3 Farms (Souss-Massa, Fès-Meknès, Kénitra)');
  console.log('   - 10 Parcels');
  console.log('   - 10 Employees');
  console.log('   - 9 Products');
  console.log('   - 4 Suppliers');
  console.log('   - 4 Clients');
  console.log('   - 3 Bank Accounts');
  console.log('   - 7 Culture Cycles');
  console.log('   - 8 Farm Activities');
  console.log('   - 6 Harvests');
  console.log('   - 4 Certifications');
  console.log('   - 3 Soil Analyses');
  console.log('   - 8 Market Prices');
  console.log('   - 3 Notifications');
  console.log('\n🔑 Login: +212661000001 / Fla7a@2025');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
