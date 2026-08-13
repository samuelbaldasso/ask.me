// Garante a invariante "apenas um superadmin no sistema": promove
// SUPERADMIN_EMAIL e revoga isAdmin de qualquer outro usuário que o tenha.
// Uso: npm run db:sync-superadmin
import { prisma } from './prisma';

const SUPERADMIN_EMAIL = 'baldassosamuel93@gmail.com';

async function main() {
  const superadmin = await prisma.user.findUnique({ where: { email: SUPERADMIN_EMAIL } });

  if (!superadmin) {
    console.warn(
      `⚠️  Nenhum usuário com e-mail ${SUPERADMIN_EMAIL} encontrado ainda — ` +
        'ele precisa logar ao menos uma vez antes de ser promovido.',
    );
  } else if (!superadmin.isAdmin) {
    await prisma.user.update({ where: { id: superadmin.id }, data: { isAdmin: true } });
    console.log(`✅ ${SUPERADMIN_EMAIL} promovido a admin.`);
  } else {
    console.log(`✔️  ${SUPERADMIN_EMAIL} já é admin.`);
  }

  const revoked = await prisma.user.updateMany({
    where: { isAdmin: true, email: { not: SUPERADMIN_EMAIL } },
    data: { isAdmin: false },
  });

  if (revoked.count > 0) {
    console.log(`🔒 Revogado isAdmin de ${revoked.count} usuário(s) diferente(s) do superadmin.`);
  } else {
    console.log('🔒 Nenhum outro usuário tinha isAdmin — nada a revogar.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
