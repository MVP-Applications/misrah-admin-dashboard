import React, { useState } from 'react';
import { Property, User } from '../types';

export const usePropertyActions = (
  properties: Property[],
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>,
  user: User
) => {
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; propertyId: string; propertyName: string }>({
    isOpen: false,
    propertyId: '',
    propertyName: ''
  });

  const addProperty = (newProp: Omit<Property, 'id' | 'rating' | 'reviews' | 'active' | 'hostId'>) => {
    const property: Property = {
      ...newProp,
      id: `prop-${Date.now()}`,
      rating: 0,
      reviews: 0,
      active: true,
      hostId: user.id,
      status: 'Pending'
    };
    setProperties(prev => [property, ...prev]);
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleApprove = (id: string) => {
    updateProperty(id, { status: 'Approved', active: true, rejectionReason: undefined });
  };

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

  const confirmRejection = (reason: string) => {
    updateProperty(rejectionModal.propertyId, {
      status: 'Rejected',
      active: false,
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
