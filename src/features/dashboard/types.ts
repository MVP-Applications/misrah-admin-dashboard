// GET /admin/dashboard?year&month — shape captured from a real response
// (Admin Overview). GET /host/dashboard/overview?year&month returns the same
// structure minus `header` (HostDashboardOverviewDataDto in the live spec),
// so both portals share this type.

export interface AdminDashboardParams {
  year?: number;
  // 1–12
  month?: number;
}

export interface AdminDashboardAssetClass {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AdminDashboardRegion {
  cityId: string;
  name: string;
  propertyCount: number;
  imageUrl: string | null;
  // Hub inspector details (captured response) — optional so an older
  // backend without them still passes; the UI falls back per field.
  country?: string;
  description?: string;
  categoryTag?: string | null;
  latitude?: number;
  longitude?: number;
  formattedCoordinates?: string;
  nodeStatus?: string;
  occupancyRate?: number;
  occupancyFormatted?: string;
  occupancyIndex?: string;
  avgDailyRate?: number;
  formattedAvgDailyRate?: string;
  avgDailyRateLabel?: string;
  liveBookingsCount?: number;
  liveBookingsAmount?: number;
  formattedLiveBookingsAmount?: string;
}

export interface AdminDashboardActiveOp {
  bookingId: string;
  bookingType: 'experience' | 'property' | string;
  travelerName: string;
  // Seen as a bare file ID in the captured response, not a URL.
  travelerAvatarUrl?: string | null;
  title: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
}

export interface AdminDashboardIntelItem {
  id: string;
  message: string;
  category: string;
  timestamp: string;
  entityType?: string;
  entityId?: string;
}

export interface AdminDashboardYieldItem {
  propertyId: string;
  title: string;
  bookingsCount: number;
  amount: number;
  formattedAmount: string;
  currency: string;
  // Relative to the top property (top = 100) — drives the bar width.
  percentage: number;
}

export interface AdminDashboardData {
  // Admin only — absent on the host overview.
  header?: { liveInRegionCount: number };
  kpis: {
    platformRevenue: {
      totalRevenue: number;
      formattedRevenue: string;
      currency: string;
      growthPercentage: number;
      isPositiveGrowth: boolean;
    };
    inventoryScope: { totalProperties: number; pendingAuditCount: number };
    complianceQueue: { count: number; needsOptimization: boolean };
    marketSentiment: { score: number; engagementGrowthPercentage: number; isPositiveGrowth: boolean };
  };
  assetClasses: { totalHubs: number; classes: AdminDashboardAssetClass[] };
  geoHubs: { activeNodesCount: number; regions: AdminDashboardRegion[] };
  activeOps: AdminDashboardActiveOp[];
  intelFeed: AdminDashboardIntelItem[];
  // "Yield Distribution" panel — returned by both /admin/dashboard and
  // /host/dashboard/overview. Optional so an older backend without it still
  // passes the shape check.
  yieldDistribution?: {
    highestBookingsCount: number;
    totalYield: number;
    currency: string;
    items: AdminDashboardYieldItem[];
  };
}

// ---------------------------------------------------------------------------
// GET /host/dashboard/earnings — captured response + HostLedgerItemDto from
// the live OpenAPI spec (ledger items were empty in the captured sample).
// ---------------------------------------------------------------------------

export type EarningsTimeframe = 'D' | 'W' | 'M' | 'Y';

export interface HostEarningsParams {
  timeframe?: EarningsTimeframe;
  year?: number;
  month?: number;
  propertyId?: string;
  ledgerPage?: number;
  ledgerLimit?: number;
}

interface MoneyKpi {
  amount: number;
  formattedAmount: string;
  currency: string;
}

export interface HostEarningsLedgerItem {
  id: string;
  type: 'PAYOUT' | 'BOOKING' | string;
  title: string;
  subtitle: string;
  status: 'COMPLETED' | 'PROCESSING' | 'CONFIRMED' | 'PENDING' | string;
  date: string;
  formattedDate: string;
  amount: number;
  formattedAmount: string;
  currency: string;
  iconType: 'payout' | 'booking' | string;
  travelerAvatarUrl?: string | null;
}

export interface HostEarningsData {
  kpis: {
    totalRevenue: MoneyKpi & { growthPercentage: number; isPositiveGrowth: boolean; comparisonLabel: string };
    inEscrow: MoneyKpi & { statusLabel: string; description: string };
    avgNightlyRate: MoneyKpi & { growthPercentage: number; isPositiveGrowth: boolean; seasonalityLabel: string };
    activeNodes: { count: number; statusLabel: string; description: string };
  };
  revenueMatrix: {
    title: string;
    subtitle: string;
    timeframe: string;
    currency: string;
    totalRevenue: number;
    data: Array<{
      label: string;
      amount: number;
      formattedAmount: string;
      currency: string;
      bookingsCount: number;
      occupancyRate: number;
    }>;
  };
  operationalOccupancy: { rate: number; formattedRate: string; totalBookedNights: number; totalAvailableNights: number };
  netYieldMomentum: { momentumPercentage: number; formattedMomentum: string; isPositive: boolean };
  ledger: {
    title: string;
    subtitle: string;
    totalItems: number;
    page: number;
    totalPages: number;
    viewFullHistoryLabel: string;
    items: HostEarningsLedgerItem[];
  };
}
