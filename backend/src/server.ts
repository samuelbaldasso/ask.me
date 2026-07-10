import app from './app';
import { env } from './config/env';
import { prisma } from './db/prisma';

async function main() {
  // Verifica conexão com o banco antes de aceitar tráfego
  await prisma.$connect();
  console.log('✅ Banco de dados conectado');

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Ask.me backend rodando em http://localhost:${env.PORT}`);
    console.log(`   Ambiente: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Encerrando servidor...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Conexão com banco encerrada');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('❌ Falha ao iniciar servidor:', err);
  process.exit(1);
});
