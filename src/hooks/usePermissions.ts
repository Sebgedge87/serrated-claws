import { useMemo } from 'react';
import type { LanceData, LanceMembership } from '@/lib/types';

export interface Permissions {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Only admins can create new top-level entities */
  canCreate: boolean;
  /** Only admins can delete entities and manage users */
  canDelete: boolean;
  canManageUsers: boolean;
  /** Can edit a specific coven (admin OR that coven's leader) */
  canManageCoven: (covenId: string) => boolean;
  /** Can edit a specific function (admin OR that function's leader) */
  canManageFunction: (fnId: string) => boolean;
  /** Can edit a specific business (admin OR a business owner) */
  canManageBusiness: (bizId: string) => boolean;
  /** Can edit members of a house (admin OR that house's Earl) */
  canManageHouse: (houseId: string) => boolean;
}

export function usePermissions(membership: LanceMembership | null, data: LanceData): Permissions {
  return useMemo(() => {
    const role = membership?.role ?? 'viewer';
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isSuperAdmin = role === 'super_admin';
    const myMemberId = membership?.member_id ?? null;
    const myMember = myMemberId
      ? data.members.find(m => m.id === myMemberId) ?? null
      : null;

    function canManageCoven(covenId: string): boolean {
      if (isAdmin) return true;
      if (!myMember) return false;
      const coven = data.covens.find(c => c.id === covenId);
      return !!coven?.leader && coven.leader === myMember.id;
    }

    function canManageFunction(fnId: string): boolean {
      if (isAdmin) return true;
      if (!myMember) return false;
      const fn = data.functions.find(f => f.id === fnId);
      return !!fn?.leader && fn.leader === myMember.id;
    }

    function canManageBusiness(bizId: string): boolean {
      if (isAdmin) return true;
      if (!myMember) return false;
      const biz = data.businesses.find(b => b.id === bizId);
      return !!biz?.owners.includes(myMember.id);
    }

    function canManageHouse(houseId: string): boolean {
      if (isAdmin) return true;
      if (!myMember) return false;
      return myMember.house_id === houseId &&
        (myMember.rank?.toLowerCase().includes('earl') ?? false);
    }

    return {
      isAdmin,
      isSuperAdmin,
      canCreate: isAdmin,
      canDelete: isAdmin,
      canManageUsers: isAdmin,
      canManageCoven,
      canManageFunction,
      canManageBusiness,
      canManageHouse,
    };
  }, [membership, data]);
}
