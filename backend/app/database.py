from supabase import create_client, Client
from app.config import settings

_client: Client | None = None


def get_supabase_client() -> Client:
    """Return a singleton Supabase client (lazy init so the app can import without valid keys)."""
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


class _LazySupabaseClient:
    """Proxy that defers Supabase client creation until first use."""

    def __getattr__(self, name: str):
        return getattr(get_supabase_client(), name)


supabase_client = _LazySupabaseClient()
