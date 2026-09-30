// GET /admin/dashboard?year&month — shape captured from a real response
// (Admin Overview). Only the admin portal calls it.

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

export interface AdminDashboardData {
  header: { liveInRegionCount: number };
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
}
