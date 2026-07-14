/**
 * Seed adicional — estabelecimentos fictícios em Macaé/RJ, para testar
 * busca geográfica a partir de um dispositivo físico fora de São Paulo.
 * Uso: npx tsx src/db/seedMacae.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed Macaé...');

  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'restaurante' }, update: {}, create: { slug: 'restaurante', label: 'Restaurante' } }),
    prisma.category.upsert({ where: { slug: 'farmacia' }, update: {}, create: { slug: 'farmacia', label: 'Farmácia' } }),
    prisma.category.upsert({ where: { slug: 'pet-shop' }, update: {}, create: { slug: 'pet-shop', label: 'Pet Shop' } }),
    prisma.category.upsert({ where: { slug: 'supermercado' }, update: {}, create: { slug: 'supermercado', label: 'Supermercado' } }),
  ]);

  const [restaurante, farmacia, petShop] = categories;

  const places = [
    {
      name: 'Sushi Macaé',
      description: 'Culinária japonesa. Aceita pets na área externa.',
      address: 'Av. Elias Agostinho, 1200',
      city: 'Macaé',
      lat: -22.3711,
      lng: -41.7867,
      categoryId: restaurante.id,
      acceptsPets: true,
      acceptsCards: true,
      phone: '(22) 3456-7890',
    },
    {
      name: 'Burger do Farol',
      description: 'Hambúrgueres artesanais perto da praia.',
      address: 'Av. Rui Barbosa, 400',
      city: 'Macaé',
      lat: -22.3902,
      lng: -41.7749,
      categoryId: restaurante.id,
      acceptsPets: false,
      acceptsCards: true,
    },
    {
      name: 'Farmácia Macaé Centro',
      description: 'Aberta 24h.',
      address: 'Rua Sebastião Lacerda, 220',
      city: 'Macaé',
      lat: -22.3733,
      lng: -41.7870,
      categoryId: farmacia.id,
      acceptsPets: false,
      acceptsCards: true,
    },
    {
      name: 'Pet Macaé',
      description: 'Pet shop completo com banho e tosa.',
      address: 'Rua Teotônio Regadas, 88',
      city: 'Macaé',
      lat: -22.3765,
      lng: -41.7822,
      categoryId: petShop.id,
      acceptsPets: true,
      acceptsCards: true,
    },
  ];

  for (const place of places) {
    const existing = await prisma.place.findFirst({ where: { name: place.name, city: place.city } });
    if (existing) {
      console.log(`  ↷ ${place.name} já existe, pulando`);
      continue;
    }

    const created = await prisma.place.create({ data: place });

    const hours = [
      { dayOfWeek: 1, opensAt: '11:00', closesAt: '22:00' },
      { dayOfWeek: 2, opensAt: '11:00', closesAt: '22:00' },
      { dayOfWeek: 3, opensAt: '11:00', closesAt: '22:00' },
      { dayOfWeek: 4, opensAt: '11:00', closesAt: '22:00' },
      { dayOfWeek: 5, opensAt: '11:00', closesAt: '22:00' },
      { dayOfWeek: 6, opensAt: '11:00', closesAt: '23:00' },
      { dayOfWeek: 0, opensAt: '00:00', closesAt: '00:00', isClosed: true },
    ];

    await prisma.openingHours.createMany({
      data: hours.map((h) => ({ ...h, placeId: created.id })),
      skipDuplicates: true,
    });

    console.log(`  ✅ ${created.name}`);
  }

  console.log('✅ Seed Macaé concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
