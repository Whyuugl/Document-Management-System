export type RetentionStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

export function getRemainingRetentionDays(retentionDueAt: Date | string): number {
  const dueDate = new Date(retentionDueAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
}

export function getRetentionStatus(retentionDueAt: Date | string): RetentionStatus {
  const remainingDays = getRemainingRetentionDays(retentionDueAt);
  if (remainingDays <= 0) return 'EXPIRED';
  if (remainingDays <= 90) return 'EXPIRING_SOON';
  return 'ACTIVE';
}
