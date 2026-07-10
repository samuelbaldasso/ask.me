import { isOpenNow } from '../../src/utils/schedule';

describe('isOpenNow', () => {
  const mockHours = (dow: number, opens: string, closes: string, closed = false) => [
    { dayOfWeek: dow, opensAt: opens, closesAt: closes, isClosed: closed },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retorna true quando dentro do horário', () => {
    // Terça-feira (2) às 12:00
    jest.setSystemTime(new Date('2024-01-02T12:00:00'));
    const hours = mockHours(2, '08:00', '18:00');
    expect(isOpenNow(hours)).toBe(true);
  });

  it('retorna false quando fora do horário', () => {
    jest.setSystemTime(new Date('2024-01-02T20:00:00'));
    const hours = mockHours(2, '08:00', '18:00');
    expect(isOpenNow(hours)).toBe(false);
  });

  it('retorna false quando isClosed = true', () => {
    jest.setSystemTime(new Date('2024-01-02T12:00:00'));
    const hours = mockHours(2, '08:00', '18:00', true);
    expect(isOpenNow(hours)).toBe(false);
  });

  it('retorna false quando não há horário para o dia', () => {
    jest.setSystemTime(new Date('2024-01-02T12:00:00')); // terça = 2
    const hours = mockHours(1, '08:00', '18:00'); // segunda = 1
    expect(isOpenNow(hours)).toBe(false);
  });

  it('suporta estabelecimentos que fecham após meia-noite', () => {
    // Abre às 22:00, fecha às 03:00 — verificando às 01:00
    jest.setSystemTime(new Date('2024-01-02T01:00:00'));
    const hours = mockHours(2, '22:00', '03:00');
    expect(isOpenNow(hours)).toBe(true);
  });

  it('retorna false para após-meia-noite quando fora do intervalo', () => {
    jest.setSystemTime(new Date('2024-01-02T04:00:00'));
    const hours = mockHours(2, '22:00', '03:00');
    expect(isOpenNow(hours)).toBe(false);
  });
});
