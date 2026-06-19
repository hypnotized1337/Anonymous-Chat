import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Sparkles, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Features() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    async function fetchFeatures() {
      try {
        const { data, error } = await supabase.functions.invoke('summarize-features');
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        setSummary(data.summary);
        setCached(data.cached);
      } catch (e: any) {
        setError(e.message || 'Failed to load features');
      } finally {
        setLoading(false);
      }
    }
    fetchFeatures();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 font-mono relative overflow-hidden">
      <div className="fixed top-3 right-3 z-50">
        <ThemeToggle />
      </div>
      <Helmet>
        <title>Features — Chat</title>
        <meta name="description" content="An AI-generated overview of Chat's features: ephemeral rooms, password protection, real-time presence, and more." />
        <link rel="canonical" href="https://chat.lovable.app/features" />
        <meta property="og:title" content="Features — Chat" />
        <meta property="og:description" content="An AI-generated overview of Chat's features: ephemeral rooms, password protection, real-time presence, and more." />
        <meta property="og:url" content="https://chat.lovable.app/features" />
      </Helmet>

      <div className="max-w-xl mx-auto relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground  transition-all mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> back home
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tighter text-foreground ">
              Features
            </h1>
            {cached && (
              <span className="text-[10px] text-muted-foreground/60 border border-border rounded px-1.5 py-0.5 leading-none w-fit">
                cached
              </span>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" /> loading features…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: "easeOut", duration: 0.5 }}
            className="border border-border rounded-xl bg-card shadow-lg overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
              <Sparkles className="w-3.5 h-3.5 text-foreground/90" />
              <span className="text-[11px] text-muted-foreground font-medium tracking-wide">
                AI-GENERATED · GEMINI-2.5-FLASH
              </span>
            </div>
            <div className="px-5 py-6 text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap prose  prose-xs max-w-none [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-wide [&_ul]:mt-0 [&_li]:text-foreground/80">
              {summary}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
