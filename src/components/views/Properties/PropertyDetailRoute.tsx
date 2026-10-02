import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Property, User } from '../../../types';
import { PropertyDetailView } from './PropertyDetailView';
import { usePropertyActions } from '../../../hooks/usePropertyActions';
import { getAdminPropertyById, getPropertyById } from '../../../features/properties/api';
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
  const latestRequestRef = useRef(0);

  // Navigating to a different property: drop the old one so it isn't shown
  // while the new one loads.
  useEffect(() => {
    setProperty(null);
    setNotFound(false);
  }, [id]);

  const refetch = useCallback(() => {
    if (!id) return;
    const requestId = ++latestRequestRef.current;
    setLoading(true);
    setNotFound(false);
    // Host Hub reads its own property via GET /property/{id}; admin via
    // GET /admin/properties/{id}.
    const fetchProperty = user.role === 'manager' ? getPropertyById : getAdminPropertyById;
    fetchProperty(id)
      .then(doc => { if (requestId === latestRequestRef.current) setProperty(apiPropertyToViewModel(doc)); })
      .catch(() => { if (requestId === latestRequestRef.current) setNotFound(true); })
      .finally(() => { if (requestId === latestRequestRef.current) setLoading(false); });
  }, [id, user.role]);

  useEffect(() => { refetch(); }, [refetch]);

  const { updateProperty, deleteProperty, assignHost } = usePropertyActions(refetch, { isHost: user.role === 'manager' });

  if (loading && !property) {
    return (
      <div className="bg-white rounded-[40px] border border-border-misrah p-16 text-center shadow-sm flex flex-col items-center gap-4">
        <Loader2 size={36} className="animate-spin text-primary/30" />
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
    <div className="relative">
      {/* Background refresh (after an edit / status change) — keep the page, show a pill. */}
      {loading && (
        <div className="fixed top-6 right-6 z-[150] bg-primary text-white px-4 py-2.5 rounded-2xl shadow-luxury flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <Loader2 size={14} className="animate-spin text-accent" />
          Refreshing…
        </div>
      )}
    <PropertyDetailView
      property={property}
      onClose={() => navigate(-1)}
      onUpdate={updateProperty}
      onDelete={async (id) => {
        // Only leave the page once the delete actually succeeded.
        try {
          await deleteProperty(id);
          navigate(-1);
        } catch (err) {
          window.alert(err instanceof Error ? err.message : 'Failed to delete this property.');
        }
      }}
      onAssignHost={assignHost}
      user={user}
    />
    </div>
  );
};
