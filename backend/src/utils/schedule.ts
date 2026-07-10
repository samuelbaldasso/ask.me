/**
 * Verifica se um estabelecimento está aberto no momento atual.
 *
 * @param hours - Array de horários de funcionamento do lugar
 * @returns true se aberto, false se fechado
 *
 * Nota: usa o timezone do servidor. Para um produto nacional,
 * a Fase 6 deve persistir o timezone por estabelecimento e
 * usar uma biblioteca como `luxon` para conversão precisa.
 */
export function isOpenNow(
  hours: Array<{
    dayOfWeek: number;
    opensAt: string;
    closesAt: string;
    isClosed: boolean;
  }>,
): boolean {
  const now = new Date();
  const todayDow = now.getDay(); // 0=dom, 6=sab
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayHours = hours.find((h) => h.dayOfWeek === todayDow);

  if (!todayHours || todayHours.isClosed) return false;

  const opens = parseTimeToMinutes(todayHours.opensAt);
  const closes = parseTimeToMinutes(todayHours.closesAt);

  // Suporte a estabelecimentos que fecham após meia-noite (closes < opens)
  if (closes < opens) {
    return currentMinutes >= opens || currentMinutes < closes;
  }

  return currentMinutes >= opens && currentMinutes < closes;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
