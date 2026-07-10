/**
 * Seed de desenvolvimento — popula o banco com dados fictícios de SP.
 * Uso: npm run db:seed
 *
 * NÃO executar em produção — dados são para validação local/testes.
 */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Garantir coluna PostGIS e trigger
  const sqlPath = path.resolve(__dirname, '../../infra/postgis_location.sql');
  execSync(`psql "${process.env.DATABASE_URL}" -f "${sqlPath}"`, { stdio: 'inherit' });

  // Categorias
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'restaurante' }, update: {}, create: { slug: 'restaurante', label: 'Restaurante' } }),
    prisma.category.upsert({ where: { slug: 'farmacia' }, update: {}, create: { slug: 'farmacia', label: 'Farmácia' } }),
    prisma.category.upsert({ where: { slug: 'pet-shop' }, update: {}, create: { slug: 'pet-shop', label: 'Pet Shop' } }),
    prisma.category.upsert({ where: { slug: 'supermercado' }, update: {}, create: { slug: 'supermercado', label: 'Supermercado' } }),
  ]);

  const [restaurante, farmacia, petShop] = categories;

  // Estabelecimentos fictícios em São Paulo
  const places = [
    {
      name: 'Sushi Sakura',
      description: 'Culinária japonesa tradicional. Aceita pets na área externa.',
      address: 'Rua Augusta, 1200',
      city: 'São Paulo',
      lat: -23.5518,
      lng: -46.6565,
      categoryId: restaurante.id,
      acceptsPets: true,
      acceptsCards: true,
      phone: '(11) 3456-7890',
    },
    {
      name: 'Burger Brasil',
      description: 'Hambúrgueres artesanais.',
      address: 'Av. Paulista, 900',
      city: 'São Paulo',
      lat: -23.5631,
      lng: -46.6520,
      categoryId: restaurante.id,
      acceptsPets: false,
      acceptsCards: true,
    },
    {
      name: 'Farmácia São Paulo',
      description: 'Aberta 24h.',
      address: 'Rua da Consolação, 340',
      city: 'São Paulo',
      lat: -23.5530,
      lng: -46.6580,
      categoryId: farmacia.id,
      acceptsPets: false,
      acceptsCards: true,
    },
    {
      name: 'Pet Love',
      description: 'Pet shop completo com banho e tosa.',
      address: 'Rua Haddock Lobo, 500',
      city: 'São Paulo',
      lat: -23.5548,
      lng: -46.6592,
      categoryId: petShop.id,
      acceptsPets: true,
      acceptsCards: true,
    },
  ];

  for (const place of places) {
    const created = await prisma.place.create({ data: place });

    // Horários: seg-sex 11:00-22:00, sab 11:00-23:00, dom fechado
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

  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
