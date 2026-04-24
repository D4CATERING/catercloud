// js/auth.js
(function () {
  if (window.Auth && window.supabaseClient) return;

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase SDK no está cargado");
    return;
  }

  const SUPABASE_URL = "https://uieygujsqfthnktgwrwp.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZXlndWpzcWZ0aG5rdGd3cndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTA2ODMsImV4cCI6MjA4NjIyNjY4M30.6ds8AqZdDqz5Nx9Y_WhvJV-ANpcizLV8Fvv9oCR-R1c";

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  window.supabaseClient = supabaseClient;

  // ── Helper interno para emitir el evento de forma centralizada ──
  function emitUserChanged(user) {
    window.currentUser = user || null;
    document.dispatchEvent(new CustomEvent("user:changed", { detail: user || null }));
  }

  window.Auth = {
    async signIn(email, password) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      // NO emitimos aquí — onAuthStateChange lo hará automáticamente
      return data;
    },

    async signOut() {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      // NO emitimos aquí — onAuthStateChange lo hará automáticamente
    },

    async getUser() {
      try {
        const { data } = await supabaseClient.auth.getUser();
        return data.user;
      } catch (e) {
        return null;
      }
    }
  };

  // Estado inicial
  window.currentUser = null;

  // Cargar usuario al inicio (solo actualiza estado, sin emitir evento)
  // onAuthStateChange se disparará solo con INITIAL_SESSION si hay sesión activa
  (async () => {
    const { data } = await supabaseClient.auth.getUser();
    if (data.user && !window.currentUser) {
      window.currentUser = data.user;
    }
  })();

  // Fuente de verdad única para todos los cambios de sesión
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event, session?.user?.email);
    emitUserChanged(session?.user || null);
  });

})();
