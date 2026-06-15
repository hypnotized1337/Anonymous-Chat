import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-2 text-8xl md:text-9xl font-extrabold tracking-tighter text-foreground  animate-pulse">
            404
          </h1>
          <p className="mb-8 text-xl md:text-2xl text-muted-foreground tracking-widest font-light">
            PAGE NOT FOUND
          </p>
          <Link 
            to="/" 
            className="inline-block px-8 py-3 text-sm font-semibold tracking-wider text-foreground uppercase transition-all duration-300 border border-border rounded-full hover:bg-muted hover:border-foreground/40  backdrop-blur-sm"
          >
            Return Home
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;
