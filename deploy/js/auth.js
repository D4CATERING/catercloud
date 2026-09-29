// js/auth.js
(function () {
  if (window.Auth && window.supabaseClient) {
    window.AuthReady = Promise.resolve(window.Auth);
    return;
  }

  const SUPABASE_URL = "https://uieygujsqfthnktgwrwp.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZXlndWpzcWZ0aG5rdGd3cndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTA2ODMsImV4cCI6MjA4NjIyNjY4M30.6ds8AqZdDqz5Nx9Y_WhvJV-ANpcizLV8Fvv9oCR-R1c";

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }

  async function ensureSupabaseSdk() {
    if (window.supabase?.createClient) return;

    const urls = [
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js",
      "https://unpkg.com/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js",
      "vendor/supabase.min.js"
    ];

    let lastError = null;
    for (const url of urls) {
      try {
        await loadScript(url);
        if (window.supabase?.createClient) return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Supabase SDK no esta cargado");
  }

  function emitUserChanged(user) {
    window.currentUser = user || null;
    if (typeof window.rellenarResponsableConUsuarioActual === "function") {
      window.rellenarResponsableConUsuarioActual(false);
    }
    document.dispatchEvent(new CustomEvent("user:changed", { detail: user || null }));
  }

  async function initAuth() {
    await ensureSupabaseSdk();

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    window.supabaseClient = supabaseClient;

    async function readAuthenticatedUser() {
      try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (sessionData?.session?.user) return sessionData.session.user;
      } catch (error) {
        console.warn("No se pudo leer la sesion local de Supabase:", error);
      }

      try {
        const { data } = await supabaseClient.auth.getUser();
        return data?.user || null;
      } catch (error) {
        console.warn("No se pudo validar el usuario de Supabase:", error);
        return null;
      }
    }

    window.obtenerNombreUsuarioActual = function () {
      const user = window.currentUser;
      if (!user) return "";

      return (
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.display_name ||
        user.email ||
        ""
      ).toString();
    };

    window.rellenarResponsableConUsuarioActual = function (force = false) {
      const input = document.getElementById("responsable");
      const nombre = window.obtenerNombreUsuarioActual();
      if (input && nombre && (force || !input.value)) {
        input.value = nombre;
      }
    };

    window.Auth = {
      async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        return data;
      },

      async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
      },

      async resetPassword(email, redirectTo) {
        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo
        });
        if (error) throw error;
        return data;
      },

      async updatePassword(newPassword) {
        const { data, error } = await supabaseClient.auth.updateUser({
          password: newPassword
        });
        if (error) throw error;
        return data;
      },

      async getUser() {
        const user = await readAuthenticatedUser();
        if (user && window.currentUser?.id !== user.id) emitUserChanged(user);
        return user;
      }
    };

    window.currentUser = null;

    const initialUser = await readAuthenticatedUser();
    emitUserChanged(initialUser || null);

    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      emitUserChanged(session?.user || null);
    });

    return window.Auth;
  }

  window.AuthReady = initAuth().catch(error => {
    console.error("No se pudo inicializar la autorizacion:", error);
    window.AuthInitError = error;
    return null;
  });
})();
