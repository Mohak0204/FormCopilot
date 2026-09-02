import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import {
  Shield, FileText, Upload, Search, CheckCircle
} from 'lucide-react';
import Vault from './Vault';
import Forms from './Forms';
import FormDetail from './FormDetail';
import MatchDocuments from './MatchDocuments';
import Checklist from './Checklist';
import { RealHome as Home } from './HomePreview';

/* ───────────────────── SHARED: Logo ───────────────────── */
export function Logo({ size = 'default' }: { size?: 'default' | 'small' }) {
  const iconSize = size === 'small' ? 'w-6 h-6' : 'w-7 h-7';
  const textSize = size === 'small' ? 'text-base' : 'text-lg';
  return (
    <div className="flex items-center space-x-2.5 group">
      <div className={`${iconSize} rounded-md bg-ink flex items-center justify-center text-surface`}>
        <Shield className="w-3.5 h-3.5" />
      </div>
      <span className={`font-display ${textSize} text-ink tracking-tight`}>
        FormCopilot
      </span>
    </div>
  );
}

/* ───────────────────── SHARED: NavigationBar ───────────────────── */
function NavigationBar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navLinks = [
    { to: '/vault', label: 'Document Vault', match: (p: string) => p === '/vault' },
    { to: '/forms', label: 'Analyze Forms', match: (p: string) => p.startsWith('/forms') || p.startsWith('/checklists') },
  ];

  return (
    <nav className="bg-surface-50/90 backdrop-blur-sm sticky top-0 z-50 border-b border-border">
      <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <Link to="/" className="flex-shrink-0">
            <Logo size="small" />
          </Link>
          <div className="flex items-center space-x-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${link.match(currentPath)
                  ? 'text-ink bg-surface-200'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-100'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ───────────────────── SHARED: WorkflowStepper ───────────────────── */
const WORKFLOW_STEPS = ['Upload', 'Requirements', 'Match Documents', 'Ready'] as const;

const STEP_ICONS = [Upload, FileText, Search, CheckCircle] as const;

export function WorkflowStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto py-4">
      {WORKFLOW_STEPS.map((step, i) => {
        const Icon = STEP_ICONS[i];
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-2
                ${isCompleted
                  ? 'bg-accent text-white border-accent'
                  : isCurrent
                    ? 'bg-accent/10 text-accent border-accent'
                    : 'bg-surface-200 text-ink-faint border-border'
                }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium whitespace-nowrap
                ${isCompleted ? 'text-accent' : isCurrent ? 'text-accent' : 'text-ink-muted'}`}>
                {i + 1}. {step}
              </span>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 mt-[-18px] rounded-full ${isCompleted ? 'bg-accent' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────── SHARED: Footer ───────────────────── */
export function Footer() {
  return (
    <footer className="py-8 px-4 mt-auto border-t border-border">
      <div className="max-w-page mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
        <div className="flex items-center space-x-6">
          <a href="#" className="hover:text-ink transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-ink transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-ink transition-colors">Contact</a>
        </div>
        <span>© 2024 FormCopilot. All rights reserved.</span>
      </div>
    </footer>
  );
}



/* ───────────────────── LAYOUT ───────────────────── */
function FallbackError({ error }: { error: any }) {
  return (
    <div className="p-8 text-status-red bg-status-red-bg min-h-screen">
      <h1 className="text-2xl font-bold mb-4">React App Crashed</h1>
      <pre className="whitespace-pre-wrap font-mono text-sm">{error.message}</pre>
      <pre className="whitespace-pre-wrap font-mono text-xs mt-4">{error.stack}</pre>
    </div>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <NavigationBar />
      <main className="flex-1 w-full max-w-page mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-grid">
        <ErrorBoundary FallbackComponent={FallbackError}>
          {children}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

/* ───────────────────── APP ───────────────────── */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vault" element={<MainLayout><Vault /></MainLayout>} />
        <Route path="/forms" element={<MainLayout><Forms /></MainLayout>} />
        <Route path="/forms/:id" element={<MainLayout><FormDetail /></MainLayout>} />
        <Route path="/match/:id" element={<MainLayout><MatchDocuments /></MainLayout>} />
        <Route path="/checklists/:id" element={<MainLayout><Checklist /></MainLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
