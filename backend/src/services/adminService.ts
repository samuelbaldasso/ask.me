import { prisma } from '../db/prisma';
import { BusinessServiceError } from './businessService';

const CLAIM_LIST_SELECT = {
  id: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true } },
  place: { select: { id: true, name: true, address: true, city: true } },
} as const;

export async function listPendingClaims() {
  return prisma.businessClaim.findMany({
    where: { status: 'pending' },
    select: CLAIM_LIST_SELECT,
    orderBy: { createdAt: 'asc' },
  });
}

/** Estabelecimentos com dono aprovado — usado pra dar a opção de revogar. */
export async function listApprovedClaims() {
  return prisma.businessClaim.findMany({
    where: { status: 'approved' },
    select: CLAIM_LIST_SELECT,
    orderBy: { createdAt: 'asc' },
  });
}

async function findClaimOrThrow(claimId: string) {
  const claim = await prisma.businessClaim.findUnique({ where: { id: claimId } });

  if (!claim) {
    throw new BusinessServiceError('Reivindicação não encontrada', 404);
  }

  return claim;
}

async function findPendingClaimOrThrow(claimId: string) {
  const claim = await findClaimOrThrow(claimId);

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

/**
 * Desfaz uma aprovação anterior: desvincula o Place do lojista. O
 * estabelecimento volta a ficar "não reivindicado" — qualquer usuário
 * (inclusive o mesmo) pode reivindicá-lo de novo, gerando um novo ciclo de
 * revisão.
 */
export async function revokeClaim(claimId: string): Promise<void> {
  const claim = await findClaimOrThrow(claimId);

  if (claim.status !== 'approved') {
    throw new BusinessServiceError('Só é possível revogar uma reivindicação aprovada', 409);
  }

  await prisma.$transaction([
    prisma.place.update({ where: { id: claim.placeId }, data: { ownerId: null } }),
    prisma.businessClaim.update({
      where: { id: claimId },
      data: { status: 'revoked', reviewedAt: new Date() },
    }),
  ]);
}
