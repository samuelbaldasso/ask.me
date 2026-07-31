import { prisma } from '../db/prisma';
import { BusinessServiceError } from './businessService';

export async function listPendingClaims() {
  return prisma.businessClaim.findMany({
    where: { status: 'pending' },
    select: {
      id: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      place: { select: { id: true, name: true, address: true, city: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

async function findPendingClaimOrThrow(claimId: string) {
  const claim = await prisma.businessClaim.findUnique({ where: { id: claimId } });

  if (!claim) {
    throw new BusinessServiceError('Reivindicação não encontrada', 404);
  }

  if (claim.status !== 'pending') {
    throw new BusinessServiceError('Essa reivindicação já foi revisada', 409);
  }

  return claim;
}

/**
 * Aprova uma reivindicação: vincula o Place ao usuário e rejeita
 * automaticamente quaisquer outros pedidos pendentes para o mesmo
 * estabelecimento (só pode haver um dono).
 */
export async function approveClaim(claimId: string): Promise<void> {
  const claim = await findPendingClaimOrThrow(claimId);

  await prisma.$transaction([
    prisma.place.update({ where: { id: claim.placeId }, data: { ownerId: claim.userId } }),
    prisma.businessClaim.update({
      where: { id: claimId },
      data: { status: 'approved', reviewedAt: new Date() },
    }),
    prisma.businessClaim.updateMany({
      where: { placeId: claim.placeId, id: { not: claimId }, status: 'pending' },
      data: { status: 'rejected', reviewedAt: new Date() },
    }),
  ]);
}

export async function rejectClaim(claimId: string): Promise<void> {
  await findPendingClaimOrThrow(claimId);

  await prisma.businessClaim.update({
    where: { id: claimId },
    data: { status: 'rejected', reviewedAt: new Date() },
  });
}
