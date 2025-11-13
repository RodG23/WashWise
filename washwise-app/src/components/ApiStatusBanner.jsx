import { useApiAvailability } from '../hooks/useApiAvailability';

export default function ApiStatusBanner() {
  const { apiDown } = useApiAvailability();

  if (!apiDown) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 z-50 shadow-md">
      <span className="font-semibold">Servidor indisponível</span> — a aplicação está offline.
    </div>
  );
}
