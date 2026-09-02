import { ArrowRight, Search, Upload, FileText, Lock, UserCheck, Shield, Check, Cpu, CheckCircle, Moon, Activity, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from './App';

export function LayeredPreview() {
    return (
        <div className="relative w-full max-w-5xl mx-auto mt-8 mb-4 flex justify-center px-2">
            <div
                className="relative w-full max-w-[1100px] flex justify-center pointer-events-none"
                style={{
                    maskImage: 'radial-gradient(ellipse at top, black 50%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at top, black 50%, transparent 80%)'
                }}
            >
                <img
                    src="/preview-card.png"
                    alt="FormCopilot Interface Preview"
                    className="w-full h-auto object-contain mix-blend-multiply opacity-90 transition-all duration-700 pointer-events-none drop-shadow-sm"
                />
            </div>
        </div>
    );
}

export function HorizontalStepper() {
    return (
        <div className="flex items-center justify-center max-w-4xl mx-auto w-full px-4 mb-4 mt-6">
            <div className="flex flex-col items-center group relative z-10 w-24">
                <div className="w-[52px] h-[52px] bg-white rounded-full border border-ink flex items-center justify-center mb-3 shadow-sm">
                    <Upload className="w-5 h-5 text-ink" />
                </div>
                <span className="text-[12px] font-semibold text-ink text-center leading-tight whitespace-nowrap">Upload Documents</span>
            </div>

            <div className="h-[1px] bg-ink/70 flex-1 max-w-[120px] -mt-8 mx-2"></div>

            <div className="flex flex-col items-center group relative z-10 w-24">
                <div className="w-[52px] h-[52px] bg-white rounded-full border border-ink flex items-center justify-center mb-3 shadow-sm">
                    <FileText className="w-5 h-5 text-ink" />
                </div>
                <span className="text-[12px] font-semibold text-ink text-center leading-tight whitespace-nowrap">Analyze Forms</span>
            </div>

            <div className="h-[1px] bg-ink/70 flex-1 max-w-[120px] -mt-8 mx-2"></div>

            <div className="flex flex-col items-center group relative z-10 w-24">
                <div className="w-[52px] h-[52px] bg-white rounded-full border border-ink flex items-center justify-center mb-3 shadow-sm">
                    <Search className="w-5 h-5 text-ink" />
                </div>
                <span className="text-[12px] font-semibold text-ink text-center leading-tight whitespace-nowrap">Match Requirements</span>
            </div>

            <div className="h-[1px] bg-ink/70 flex-1 max-w-[120px] -mt-8 mx-2"></div>

            <div className="flex flex-col items-center group relative z-10 w-24">
                <div className="w-[52px] h-[52px] bg-white rounded-full border border-ink flex items-center justify-center mb-3 shadow-sm">
                    <Check className="w-6 h-6 text-ink" />
                </div>
                <span className="text-[12px] font-semibold text-ink text-center leading-tight whitespace-nowrap">Ready to Submit</span>
            </div>
        </div>
    );
}

export function NavBarMetrics() {
    return (
        <div className="hidden md:flex items-center space-x-6 px-6">
            <div className="flex items-center space-x-2 text-ink-muted">
                <div className="relative">
                    <div className="w-2.5 h-2.5 bg-accent rounded-full animate-ping absolute inset-0 opacity-75"></div>
                    <div className="w-2.5 h-2.5 bg-accent rounded-full relative"></div>
                </div>
                <span className="text-[12px] font-medium tracking-wide">System Online</span>
            </div>

            <div className="w-[1px] h-4 bg-border"></div>

            <div className="flex items-center space-x-2 text-ink-muted">
                <Activity className="w-3.5 h-3.5 text-accent animate-pulse" />
                <span className="text-[12px] font-medium tracking-wide">Encrypted Vault</span>
            </div>

            <div className="w-[1px] h-4 bg-border"></div>

            <div className="flex items-center space-x-2 text-ink-muted group cursor-default">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-[12px] font-medium tracking-wide">Local Engine</span>
            </div>
        </div>
    );
}

export function RealHome() {
    return (
        <div className="min-h-screen bg-surface flex flex-col font-sans overflow-x-hidden relative">

            {/* Premium Floating Upper Bar with Glass Effect */}
            <header className="fixed top-6 inset-x-0 mx-auto w-[90%] max-w-5xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full z-50 px-5 py-3 flex items-center justify-between transition-all duration-300">
                <div className="flex items-center space-x-2.5 pl-1">
                    <div className="w-8 h-8 rounded-full bg-white border border-border shadow-[0_2px_10px_rgba(0,0,0,0.05)] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent"></div>
                        <Shield className="w-4 h-4 text-ink relative z-10" />
                    </div>
                    <span className="text-[17px] font-display font-semibold tracking-wide text-ink">FormCopilot</span>
                </div>

                <NavBarMetrics />

                <div className="flex items-center pr-1">
                    <button className="w-9 h-9 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-all border border-border shadow-sm group">
                        <Moon className="w-[16px] h-[16px] text-ink-muted group-hover:text-ink transition-colors" />
                    </button>
                    {/* Enter Vault button explicitly removed */}
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-visible pt-28 sm:pt-32 pb-4 px-4 bg-surface">
                {/* Subtle circular geometry */}
                <div className="absolute inset-0 bg-grid-strong bg-bottom pointer-events-none opacity-60" />
                <div className="absolute inset-0 bg-circles pointer-events-none opacity-100" />
                <div className="absolute inset-0 bg-circles-inner pointer-events-none opacity-100" />

                <div className="max-w-[900px] mx-auto relative z-10 flex flex-col items-center justify-center text-center mt-6">

                    <div className="flex flex-col items-center w-full max-w-[800px] px-2">
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-[4rem] text-ink tracking-tight leading-[1.05] text-center drop-shadow-sm">
                            Master Your<br className="hidden sm:block" /> Institutional Forms.
                        </h1>

                        <div className="flex justify-center w-full relative mt-6">
                            <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-md rounded-full px-5 py-2 border border-border/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-[12px] font-bold text-ink-secondary relative">
                                <div className="absolute -left-10 top-1/2 -translate-y-[60%] w-3 h-3 bg-accent/50 rounded-full"></div>
                                <div className="absolute -left-16 top-[10%] w-2 h-2 bg-accent-light/40 rounded-full"></div>
                                <div className="w-2 h-2 bg-accent rounded-full shrink-0"></div>
                                <span>Fully Local &bull; Privacy First</span>
                                <div className="absolute -right-8 -top-3 w-3.5 h-3.5 bg-accent/40 rounded-full bg-blend-multiply"></div>
                                <div className="absolute -right-12 top-1/4 w-2 h-2 bg-accent-light/60 rounded-full"></div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-8 pb-4 w-full max-w-[500px]">
                            <Link
                                to="/vault"
                                className="inline-flex items-center justify-center space-x-3 bg-ink hover:bg-ink-secondary text-surface-50 transition-all duration-300 font-bold rounded-xl text-[14px] px-8 py-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] border border-transparent w-full sm:w-auto"
                            >
                                <ArrowRight className="w-[18px] h-[18px]" />
                                <span>Open Document Vault</span>
                            </Link>
                            <Link
                                to="/forms"
                                className="inline-flex items-center justify-center space-x-3 bg-white/80 backdrop-blur-sm text-ink border border-border-dark hover:bg-surface-50 hover:border-ink transition-all duration-300 font-bold rounded-xl text-[14px] px-8 py-3.5 shadow-sm hover:shadow-md w-full sm:w-auto"
                            >
                                <Search className="w-[18px] h-[18px] text-ink" />
                                <span>Analyze a Form</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="w-full text-center mt-4 mb-0 max-w-4xl mx-auto">
                    <HorizontalStepper />
                </div>

                <LayeredPreview />
            </section>

            {/* Security & Trust - Premium Floating Cards */}
            <section className="py-12 px-4 border-t border-border/40 bg-surface relative z-10 w-full overflow-hidden">
                <div className="absolute inset-0 bg-grid-strong bg-center pointer-events-none opacity-30"></div>

                <div className="max-w-page mx-auto relative z-10">
                    <h2 className="font-display text-3xl text-ink tracking-tight mb-10 text-center">Security & Trust</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2 max-w-5xl mx-auto">
                        {[
                            { icon: Cpu, title: 'Local Processing', desc: 'Your data never leaves your device. All analysis performed locally on your own machine.' },
                            { icon: Lock, title: 'AES-256 Encryption', desc: 'Military-grade encryption protects your Vault documents powerfully at rest and in transit.' },
                            { icon: UserCheck, title: 'User Sovereignty', desc: 'You are the sole autonomous custodian of your information. No cloud storage forever.' },
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/50 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none"></div>
                                <div className="w-14 h-14 bg-surface-50 border border-white shadow-inner rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                    <item.icon className="w-6 h-6 text-ink" />
                                </div>
                                <h3 className="font-bold text-ink text-[17px] mb-2.5 relative z-10">{item.title}</h3>
                                <p className="text-[14px] font-medium text-ink-muted leading-relaxed relative z-10">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How FormCopilot Works - Premium Floating Cards */}
            <section className="py-12 px-4 border-t border-border/40 bg-surface relative overflow-hidden z-10">
                <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>
                <div className="max-w-page mx-auto relative z-10">
                    <div className="text-center mb-10">
                        <h2 className="font-display text-3xl sm:text-4xl text-ink tracking-tight mb-3">How FormCopilot Works</h2>
                        <p className="text-ink-secondary font-medium text-[15px] max-w-2xl mx-auto">Intelligent AI automation meets absolute uncompromising privacy.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2 max-w-6xl mx-auto">
                        {[
                            { icon: Upload, title: 'Upload Documents', desc: 'Secure your IDs, certificates, and proofs in an encrypted local vault.', step: '01' },
                            { icon: FileText, title: 'Analyze Forms', desc: 'Extract every complex requirement perfectly from institutional PDF forms.', step: '02' },
                            { icon: Search, title: 'Match Requirements', desc: 'Our engine intelligently maps form needs to your vault documents to check readiness.', step: '03' },
                            { icon: CheckCircle, title: 'Complete Checklist', desc: 'Receive a brilliant readiness report with simple actions for successful submission.', step: '04' },
                        ].map((item, idx) => (
                            <div key={idx} className="group relative bg-white/70 backdrop-blur-lg border border-white/60 rounded-[24px] p-7 transition-all duration-500 shadow-[0_4px_24px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 flex flex-col h-full overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-5 relative z-10">
                                    <span className="text-[13px] font-extrabold text-ink-faint/60 font-mono tracking-widest">{item.step}</span>
                                    <div className="w-11 h-11 bg-white border border-border/50 group-hover:border-ink/20 shadow-sm rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-105">
                                        <item.icon className="w-[20px] h-[20px] text-ink-secondary group-hover:text-ink transition-colors" />
                                    </div>
                                </div>
                                <h3 className="font-bold text-ink text-[16px] mb-3 tracking-wide relative z-10">{item.title}</h3>
                                <p className="text-[14px] font-medium text-ink-muted leading-relaxed flex-1 relative z-10">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
