// Promove um usuário existente a admin (acesso à fila de revisão em
// /admin/claims) — não há fluxo de cadastro para isso, é sempre manual.
// Uso: npm run db:make-admin -- seu-email@example.com
//
// Restrito ao e-mail do superadmin do produto: apenas um usuário deve ter
// isAdmin = true no sistema. Ver também db:sync-superadmin, que reforça essa
// invariante revogando isAdmin de qualquer outra conta.
import { prisma } from './prisma';

const SUPERADMIN_EMAIL = 'baldassosamuel93@gmail.com';

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Uso: npm run db:make-admin -- seu-email@example.com');
    process.exit(1);
  }

  if (email.trim().toLowerCase() !== SUPERADMIN_EMAIL) {
    console.error(
      `❌ Recusado: apenas ${SUPERADMIN_EMAIL} pode ser admin. ` +
        'Para revogar acesso indevido, rode npm run db:sync-superadmin.',
    );
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  // A checagem de admin é sempre lida do banco (ver requireAdmin em
  // middleware/auth.ts), não do JWT — mas o front guarda o `isAdmin` da
  // última resposta de login em localStorage, então é preciso sair e
  // entrar de novo pra ele aparecer com o link do /admin.
  console.log(`✅ ${user.email} agora é admin. Saia e entre de novo no site para o link aparecer.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
