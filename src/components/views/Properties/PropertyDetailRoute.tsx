import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Property, User } from '../../../types';
import { PropertyDetailView } from './PropertyDetailView';
import { usePropertyActions } from '../../../hooks/usePropertyActions';
import { getAdminPropertyById } from '../../../features/properties/api';
import { apiPropertyToViewModel } from '../../../features/properties/mappers';

interface PropertyDetailRouteProps {
  user: User;
}

export const PropertyDetailRoute = ({ user }: PropertyDetailRouteProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getAdminPropertyById(id)
      .then(doc => setProperty(apiPropertyToViewModel(doc)))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  const { updateProperty, deleteProperty } = usePropertyActions(refetch);

  if (loading && !property) {
    return (
      <div className="bg-white rounded-[40px] border border-border-misrah p-16 text-center shadow-sm space-y-4">
        <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">Loading asset…</p>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="bg-white rounded-[40px] border border-border-misrah p-16 text-center shadow-sm space-y-4">
        <h2 className="text-xl font-black italic text-primary uppercase">Asset Not Found</h2>
        <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">This property node no longer exists</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <PropertyDetailView
      property={property}
      onClose={() => navigate(-1)}
      onUpdate={updateProperty}
      onDelete={(id) => {
        deleteProperty(id);
        navigate(-1);
      }}
      user={user}
    />
  );
};
