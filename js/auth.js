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

  window.Auth = {
    async signIn(email, password) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (error) throw error;
      
      // 🔥 FORZAR actualización del usuario inmediatamente
      const { data: { user } } = await supabaseClient.auth.getUser();
      window.currentUser = user;
      document.dispatchEvent(new CustomEvent("user:changed", { detail: user }));
      
      return data;
    },
    
    async signOut() {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      window.currentUser = null;
      document.dispatchEvent(new CustomEvent("user:changed", { detail: null }));
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

  // Cargar usuario al inicio
  (async () => {
    const { data } = await supabaseClient.auth.getUser();
    window.currentUser = data.user;
    if (data.user) {
      document.dispatchEvent(new CustomEvent("user:changed", { detail: data.user }));
    }
  })();

  // Escuchar cambios de autenticación
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event, session?.user?.email);
    if (session?.user) {
      window.currentUser = session.user;
      document.dispatchEvent(new CustomEvent("user:changed", { detail: session.user }));
    } else {
      window.currentUser = null;
      document.dispatchEvent(new CustomEvent("user:changed", { detail: null }));
    }
  });
})();