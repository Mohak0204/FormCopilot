import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Vault from './Vault';
import Forms from './Forms';
import FormDetail from './FormDetail';
import Checklist from './Checklist';

function NavigationBar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="bg-navy-900/90 backdrop-blur-md sticky top-0 z-50 border-b border-navy-700/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bronze to-bronze-dark flex items-center justify-center text-navy-950 font-black text-sm shadow-glow-bronze">
                C
              </div>
              <span className="font-display text-xl text-ivory tracking-tight hidden sm:block">
                Form<span className="text-bronze">Copilot</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Link
              to="/vault"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentPath === '/vault' ? 'bg-navy-700 text-bronze border border-navy-600' : 'text-ivory-dim hover:text-ivory hover:bg-navy-800'}`}
            >
              Document Vault
            </Link>
            <Link
              to="/forms"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentPath.startsWith('/forms') || currentPath.startsWith('/checklists') ? 'bg-navy-700 text-bronze border border-navy-600' : 'text-ivory-dim hover:text-ivory hover:bg-navy-800'}`}
            >
              Analyze Forms
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Home() {
  const [health, setHealth] = useState<string>('Checking Status...');

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => res.text())
      .then((data) => setHealth(data))
      .catch((err) => setHealth('Offline: ' + err.message));
  }, []);

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-navy-800/60 blur-3xl animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-navy-700/40 blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-bronze/5 blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-3xl w-full text-center space-y-10 z-10 p-8">
        <div className="inline-flex items-center space-x-2.5 bg-navy-800/80 backdrop-blur-sm border border-navy-600/50 rounded-full px-5 py-2 shadow-card text-sm font-medium text-ivory-dim">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health === 'OK' ? 'bg-status-green' : 'bg-status-red'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${health === 'OK' ? 'bg-status-green' : 'bg-status-red'}`}></span>
          </span>
          <span>{health === 'OK' ? 'System Online · Fully Local' : health}</span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl text-ivory tracking-tight leading-[1.1]">
          Master Your <br />
          <span className="text-bronze">Institutional Forms.</span>
        </h1>

        <p className="text-lg sm:text-xl text-ivory-dim max-w-2xl mx-auto leading-relaxed font-light">
          The privacy-first copilot that extracts requirements from complex PDFs and matches them against your secured, local document vault.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/vault"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 text-navy-950 bg-gradient-to-r from-bronze to-bronze-dark hover:from-bronze-light hover:to-bronze transition-all duration-300 font-semibold rounded-xl text-md px-8 py-4 shadow-glow-bronze hover:shadow-lg"
          >
            <span>Open Document Vault</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <Link
            to="/forms"
            className="w-full sm:w-auto flex items-center justify-center text-ivory-dim bg-transparent border border-navy-600 hover:border-bronze/50 hover:text-bronze transition-all duration-300 font-medium rounded-xl text-md px-8 py-4"
          >
            Analyze a Form
          </Link>
        </div>
      </div>
    </div>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col font-sans">
      <NavigationBar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vault" element={<MainLayout><Vault /></MainLayout>} />
        <Route path="/forms" element={<MainLayout><Forms /></MainLayout>} />
        <Route path="/forms/:id" element={<MainLayout><FormDetail /></MainLayout>} />
        <Route path="/checklists/:id" element={<MainLayout><Checklist /></MainLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
