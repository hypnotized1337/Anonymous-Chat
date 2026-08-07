import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // These are public browser credentials. Keep production builds functional
  // when the hosting builder does not copy the gitignored local .env file.
  const supabaseUrl = env.VITE_SUPABASE_URL || "https://wqhceghaxjdmxouoyqse.supabase.co";
  const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaGNlZ2hheGpkbXhvdW95cXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MjgwNDYsImV4cCI6MjA4NjAwNDA0Nn0.6IO8ea9IwbH3LB76oz1lG4JCjJlAKMv4Djuqz5h2xDg";

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
