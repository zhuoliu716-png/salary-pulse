export type InsuranceKey = 'pension' | 'medical' | 'unemployment' | 'housingFund';

export interface BaseLimit {
  floor: number;
  cap: number; // Infinity = 无上限
}

export interface CityPolicy {
  id: string;
  name: string;
  note: string;
  limits: Record<InsuranceKey, BaseLimit>;
}

export const INSURANCE_LABELS: Record<InsuranceKey, string> = {
  pension: '养老',
  medical: '医疗',
  unemployment: '失业',
  housingFund: '公积金',
};

const NO_LIMIT: BaseLimit = { floor: 0, cap: Infinity };

export const CITY_POLICIES: CityPolicy[] = [
  {
    id: 'shenzhen',
    name: '深圳（旧版预设）',
    note: '沿用旧项目参数，尚未核验当前政策；请对照工资单，或改用自定义基数',
    limits: {
      pension: { floor: 4775, cap: 27549 },
      medical: { floor: 6727, cap: 33633 },
      unemployment: { floor: 2520, cap: Infinity },
      housingFund: { floor: 2520, cap: 48471 },
    },
  },
  {
    id: 'none',
    name: '不封顶保底',
    note: '基数完全自定义',
    limits: { pension: NO_LIMIT, medical: NO_LIMIT, unemployment: NO_LIMIT, housingFund: NO_LIMIT },
  },
];

export function getPolicy(id: string): CityPolicy {
  return CITY_POLICIES.find((p) => p.id === id) ?? CITY_POLICIES[CITY_POLICIES.length - 1];
}
