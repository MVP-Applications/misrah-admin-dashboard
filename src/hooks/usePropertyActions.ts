import { useState } from 'react';
import { Property } from '../types';
import {
  approveAdminProperty,
  createAdminProperty,
  deleteAdminProperty,
  rejectAdminProperty,
  updateAdminProperty,
} from '../features/properties/api';
import { viewModelPartialToUpdateRequest } from '../features/properties/mappers';
import type { CreatePropertyRequest } from '../features/properties/types';

// API-backed now — every action hits the real /admin/properties endpoints
// and then calls `refetch` so the caller's list/detail reloads from the
// server, rather than optimistically patching local state. `updateProperty`
// is called by 3 different call sites (approve/reject buttons, the
// active-toggle, and PropertyDetailView's full edit-form save) with
// different partial shapes — it routes to the right endpoint by inspecting
// which fields are present rather than each call site needing its own hook.
export const usePropertyActions = (refetch: () => void) => {
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; propertyId: string; propertyName: string }>({
    isOpen: false,
    propertyId: '',
    propertyName: ''
  });

  const addProperty = async (payload: CreatePropertyRequest) => {
    await createAdminProperty(payload);
    refetch();
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    const keys = Object.keys(updates);
    // PropertyDetailView's full-form save spreads the ENTIRE property (many
    // keys, including its current `status`) — that must NOT be mistaken for
    // an explicit approve/reject action, whose call sites only ever send a
    // small {status, active?, rejectionReason?} object (<=3 keys). The
    // backend's generic update endpoint has no `status` field at all
    // (approve/reject are the only way to change it), so a full-form save
    // correctly falls through to the generic-update branch below.
    const isStatusAction = 'status' in updates && keys.length <= 3;
    if (isStatusAction && updates.status === 'Approved') {
      await approveAdminProperty(id);
    } else if (isStatusAction && updates.status === 'Rejected') {
      await rejectAdminProperty(id, updates.rejectionReason);
    } else if ('active' in updates && keys.length === 1) {
      await updateAdminProperty(id, { isActive: updates.active });
    } else {
      await updateAdminProperty(id, viewModelPartialToUpdateRequest(updates));
    }
    refetch();
  };

  const deleteProperty = async (id: string) => {
    await deleteAdminProperty(id);
    refetch();
  };

  const handleApprove = (id: string) => updateProperty(id, { status: 'Approved' });

  const openRejectModal = (property: Property) => {
    setRejectionModal({
      isOpen: true,
      propertyId: property.id,
      propertyName: property.name
    });
  };

  const closeRejectModal = () => {
    setRejectionModal(prev => ({ ...prev, isOpen: false }));
  };

  const confirmRejection = async (reason: string) => {
    await updateProperty(rejectionModal.propertyId, {
      status: 'Rejected',
      rejectionReason: reason
    });
    setRejectionModal({ isOpen: false, propertyId: '', propertyName: '' });
  };

  return {
    addProperty,
    updateProperty,
    deleteProperty,
    handleApprove,
    rejectionModal,
    openRejectModal,
    closeRejectModal,
    confirmRejection
  };
};
