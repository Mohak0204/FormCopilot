import { useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, FileText, CircleAlert, BookOpen, Sparkles, Info,
    ChevronDown, ArrowRight, AlertTriangle, ShieldCheck, Loader2, Lock
} from 'lucide-react';
import { WorkflowStepper } from './App';

type FormRequirement = {
    requirementId: string;
    description: string;
    documentTypeNeeded: string;
    mandatory: boolean;
    category: string;
    sourceClause?: string;
};

type FormInfo = {
    formId: string;
    title: string;
    pageCount: number;
    rawText: string;
    status: string;
};

function AccordionItem({ req, isOpen, onToggle }: {
    req: FormRequirement;
    isOpen: boolean;
    onToggle: () => void;
}) {
    const getGuidanceText = (r: FormRequirement): string => {
        const docType = r.documentTypeNeeded;
        const category = r.category?.toLowerCase() || 'general';

        let sectionHint = 'Provide this in the relevant section of the form.';
        if (category === 'identity') sectionHint = 'Provide this in the identity/personal details section.';
        else if (category === 'address') sectionHint = 'Provide this in the address/residence section.';
        else if (category === 'financial') sectionHint = 'Provide this in the financial details or income section.';
        else if (category === 'education') sectionHint = 'Provide this in the educational qualifications section.';

        let keepReady = `Keep your ${docType} ready for reference or verification.`;
        if (docType.toLowerCase().includes('aadhaar')) keepReady = 'Enter your name exactly as it appears on your Aadhaar card.';
        else if (docType.toLowerCase().includes('pan')) keepReady = 'Enter your PAN number accurately. Keep your PAN Card ready.';
        else if (docType.toLowerCase().includes('birth certificate')) keepReady = 'Ensure date of birth matches across all documents.';
        else if (docType.toLowerCase().includes('marksheet')) keepReady = `Keep your ${docType} ready. Ensure marks are legible.`;

        return `${sectionHint}\n${keepReady}`;
    };

    return (
        <div className="border-b border-border-light last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-100 transition-colors text-left group"
            >
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                    {req.mandatory ? (
                        <div className="w-8 h-8 rounded-full bg-status-amber-bg flex items-center justify-center flex-shrink-0">
                            <CircleAlert className="w-4 h-4 text-status-amber" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center flex-shrink-0">
                            <Info className="w-4 h-4 text-ink-muted" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-ink truncate">{req.documentTypeNeeded}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${req.mandatory
                                ? 'bg-status-amber-bg text-status-amber border border-status-amber-border'
                                : 'bg-surface-200 text-ink-muted border border-border-dark'
                                }`}>
                                {req.mandatory ? 'Required' : 'Optional'}
                            </span>
                            {req.category && (
                                <span className="text-[10px] font-medium text-ink-secondary bg-surface-100 px-2 py-0.5 rounded-full hidden sm:inline border border-border-light">
                                    {req.category}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-ink-faint transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                <div className="px-5 pb-5 pl-[4.5rem]">
                    <p className="text-sm text-ink-secondary leading-relaxed">{req.description}</p>
                    <p className="text-sm text-ink-secondary leading-relaxed mt-2 whitespace-pre-line">{getGuidanceText(req)}</p>
                    {req.sourceClause && (
                        <div className="bg-surface-100 rounded-lg p-3 mt-3 border border-border-light">
                            <p className="text-xs text-ink-muted font-mono leading-relaxed">
                                <span className="font-semibold mr-1 text-ink-secondary">Condition:</span>
                                {req.sourceClause}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function FormDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [requirements, setRequirements] = useState<FormRequirement[]>([]);
    const [formInfo, setFormInfo] = useState<FormInfo | null>(null);

    // AI summary state
    const [formSummary, setFormSummary] = useState<string | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryRequested, setSummaryRequested] = useState(false);

    // Accordion state
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

    const fetchReqs = useCallback(async () => {
        try {
            const [reqsRes, formRes] = await Promise.all([
                axios.get(`/api/v1/forms/${id}/requirements`),
                axios.get(`/api/v1/forms/${id}`)
            ]);
            setRequirements(reqsRes.data);
            setFormInfo(formRes.data);
        } catch (_e) {
            console.error(_e);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchReqs();
    }, [fetchReqs, id]);

    const generateChecklist = () => {
        navigate(`/match/${id}`);
    };

    const requestFormSummary = async () => {
        if (summaryLoading || formSummary) return;
        setSummaryLoading(true);
        setSummaryRequested(true);
        try {
            const { data } = await axios.post('/api/v1/llm/summarize', {
                title: formInfo?.title || 'Unknown Form',
                rawText: formInfo?.rawText || '',
                requirements: requirements.map(r => ({
                    documentTypeNeeded: r.documentTypeNeeded,
                    description: r.description,
                    mandatory: r.mandatory,
                    category: r.category,
                    sourceClause: r.sourceClause
                }))
            });
            setFormSummary(data.summary);
        } catch (_e) {
            console.error(_e);
            setFormSummary('Unable to generate form summary at this time.');
        } finally {
            setSummaryLoading(false);
        }
    };

    const toggleAccordion = (id: string) => {
        setOpenAccordions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const mandatoryReqs = requirements.filter(r => r.mandatory);
    const optionalReqs = requirements.filter(r => !r.mandatory);
    const categories = useMemo(() => [...new Set(requirements.map(r => r.category || 'General'))], [requirements]);

    const currentStep = useMemo(() => {
        if (requirements.length === 0) return 0; // still on upload/analysis
        return 1; // requirements extracted
    }, [requirements]);

    return (
        <div className="animate-in duration-500 max-w-[1100px] mx-auto pb-16">
            <div className="mb-6 flex items-center">
                <button onClick={() => navigate('/forms')} className="inline-flex items-center text-sm font-medium text-ink-muted hover:text-ink transition-colors mr-4">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back
                </button>
            </div>

            {/* Title Section */}
            <h1 className="font-display text-4xl text-ink tracking-tight text-center mb-10">Unified Form Analysis Overview</h1>

            {/* Progress Stepper */}
            <div className="mb-10 bg-surface-50 rounded-2xl border border-border p-6 shadow-sm">
                <WorkflowStepper currentStep={currentStep} />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-6">

                    {/* Form Header Info Box */}
                    <div className="bg-surface-50 rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-surface-200 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-ink-secondary" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-semibold text-ink text-base truncate">{formInfo?.title || 'Loading...'}</h2>
                                <div className="flex items-center space-x-3 text-xs text-ink-muted mt-1">
                                    <span className="flex items-center space-x-1">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>{formInfo?.pageCount || '—'} pages</span>
                                    </span>
                                    <span className={`font-medium ${formInfo?.status === 'ANALYZED' ? 'text-accent' : 'text-status-amber'}`}>
                                        {formInfo?.status === 'ANALYZED' ? 'Analysis Complete' : formInfo?.status || '...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Summary Card */}
                    {requirements.length > 0 && (
                        <div className="bg-surface-50 rounded-xl border border-border overflow-hidden shadow-card">
                            <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-surface-100/50">
                                <h2 className="font-semibold text-ink text-base">Understand This Form</h2>
                            </div>
                            <div className="p-6">
                                {summaryLoading && (
                                    <div className="flex items-center space-x-3 text-accent mb-4">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm font-medium text-ink-secondary">Generating AI plain-English summary...</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-ink">AI-generated plain-English summary:</h3>

                                    {formSummary ? (
                                        <div className="whitespace-pre-line text-sm text-ink-secondary leading-relaxed">
                                            {formSummary}
                                        </div>
                                    ) : !summaryRequested && !summaryLoading ? (
                                        <div className="text-sm text-ink-secondary leading-relaxed">
                                            This official form is required for various institutional processes. It includes critical sections that require supporting documentation to be verified.
                                            <br /><br />
                                            <button
                                                onClick={requestFormSummary}
                                                className="text-xs font-semibold text-accent hover:text-accent-light bg-accent-bg hover:bg-accent-border px-3 py-1.5 rounded-lg transition-colors inline-flex items-center space-x-1.5 border border-accent/20"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>Generate Full AI Summary</span>
                                            </button>
                                        </div>
                                    ) : null}

                                    <div className="text-sm text-ink pt-2 text-ink-secondary">
                                        <p className="mb-1"><span className="font-semibold text-ink">Categories:</span> {categories.join(', ')}</p>
                                        <p><span className="font-semibold text-ink">Preparation Time:</span> Approx. 10–15 mins</p>
                                    </div>

                                    {/* Important Conditions Alert */}
                                    {requirements.some(r => r.sourceClause) && (
                                        <div className="bg-surface-100 rounded-xl border border-border-light p-4 mt-4">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <AlertTriangle className="w-4 h-4 text-ink-secondary" />
                                                <h3 className="text-sm font-bold text-ink">Important Conditions</h3>
                                            </div>
                                            <ul className="space-y-2 list-disc pl-5">
                                                {requirements.filter(r => r.sourceClause).slice(0, 4).map(r => (
                                                    <li key={r.requirementId} className="text-sm text-ink-secondary">
                                                        {r.sourceClause}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Requirements Accordion */}
                    {requirements.length > 0 && (
                        <div className="bg-surface-50 rounded-xl border border-border overflow-hidden shadow-card">
                            <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-surface-100/50">
                                <div className="flex items-center space-x-2.5">
                                    <h2 className="font-semibold text-ink text-base">Extracted Requirements</h2>
                                    <span className="text-sm font-medium text-ink-muted">({requirements.length})</span>
                                </div>
                                <button
                                    onClick={() => {
                                        if (openAccordions.size === requirements.length) {
                                            setOpenAccordions(new Set());
                                        } else {
                                            setOpenAccordions(new Set(requirements.map(r => r.requirementId)));
                                        }
                                    }}
                                    className="text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                                >
                                    {openAccordions.size === requirements.length ? 'Collapse all' : 'Expand all'}
                                </button>
                            </div>

                            {/* Requirements List */}
                            <div className="divide-y divide-border-light">
                                {mandatoryReqs.map(req => (
                                    <AccordionItem
                                        key={req.requirementId}
                                        req={req}
                                        isOpen={openAccordions.has(req.requirementId)}
                                        onToggle={() => toggleAccordion(req.requirementId)}
                                    />
                                ))}
                                {optionalReqs.map(req => (
                                    <AccordionItem
                                        key={req.requirementId}
                                        req={req}
                                        isOpen={openAccordions.has(req.requirementId)}
                                        onToggle={() => toggleAccordion(req.requirementId)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {requirements.length === 0 && (
                        <div className="bg-surface-50 rounded-xl border border-border p-12 text-center shadow-card">
                            <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-ink mb-2">Analyzing {formInfo?.title || 'form'}...</h3>
                            <p className="text-sm text-ink-muted">Extracting requirements from the document</p>
                            <div className="mt-8 space-y-3 max-w-md mx-auto">
                                <div className="skeleton h-3 w-full"></div>
                                <div className="skeleton h-3 w-4/5"></div>
                                <div className="skeleton h-3 w-3/5"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar — Desktop */}
                <div className="hidden lg:block w-[320px] flex-shrink-0">
                    <div className="sticky top-20 space-y-6">
                        {/* Application Status */}
                        <div className="bg-surface-50 rounded-xl border border-border overflow-hidden shadow-card">
                            <div className="px-5 py-3.5 border-b border-border-light bg-surface-100/50">
                                <h3 className="text-sm font-bold text-ink">Application Status</h3>
                            </div>
                            <div className="p-5 flex flex-col items-center text-center">
                                <p className="text-sm font-bold text-ink mb-4">Requirements Extracted</p>

                                {/* Large gauge visualization */}
                                <div className="relative w-32 h-20 overflow-hidden mb-2">
                                    <svg className="absolute bottom-0 left-0" viewBox="0 0 100 50" width="128" height="64">
                                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" strokeWidth="12" className="stroke-surface-200" strokeLinecap="round" />
                                        {requirements.length > 0 ? (
                                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" strokeWidth="12" className="stroke-accent" strokeLinecap="round" strokeDasharray="188" strokeDashoffset="188" />
                                        ) : null}
                                    </svg>
                                    <div className="absolute bottom-0 left-0 w-full text-center pb-1">
                                        <span className="text-2xl font-bold text-ink mt-2 block">{requirements.length > 0 ? '0%' : '—'}</span>
                                    </div>
                                </div>

                                {mandatoryReqs.length > 0 ? (
                                    <p className="text-xs font-semibold text-ink-secondary mb-6">
                                        0 of {mandatoryReqs.length} requirements matched
                                    </p>
                                ) : (
                                    <p className="text-xs font-semibold text-ink-muted mb-6">Waiting for extraction...</p>
                                )}

                                {/* Next action */}
                                <div className="w-full">
                                    <button
                                        onClick={generateChecklist}
                                        disabled={requirements.length === 0}
                                        className="w-full inline-flex items-center justify-center space-x-2 bg-accent hover:bg-accent-light text-white px-4 py-3 rounded-lg font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-wait transition-all"
                                    >
                                        <span>Generate Smart Checklist</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    {requirements.length > 0 && (
                                        <p className="text-xs text-ink-muted mt-2 text-center">Generate a smart checklist to match documents</p>
                                    )}
                                </div>
                            </div>

                            {/* Privacy */}
                            <div className="border-t border-border-light bg-surface-100/30 p-4 flex justify-center space-x-4">
                                <div className="flex items-center space-x-1.5 text-xs text-ink-muted bg-surface-50 px-2 py-1 rounded border border-border">
                                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                                    <span>Processed locally</span>
                                </div>
                                <div className="flex items-center space-x-1.5 text-xs text-ink-muted bg-surface-50 px-2 py-1 rounded border border-border">
                                    <Lock className="w-3.5 h-3.5 text-accent" />
                                    <span>Encrypted storage</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile CTA — sticky bottom */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border p-4 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                <button
                    onClick={generateChecklist}
                    disabled={requirements.length === 0}
                    className="w-full inline-flex items-center justify-center space-x-2 bg-accent hover:bg-accent-light text-white px-4 py-3 rounded-lg font-semibold text-base shadow-sm disabled:opacity-50 disabled:cursor-wait transition-all"
                >
                    <>
                        <span>Generate Smart Checklist</span>
                        <ArrowRight className="w-5 h-5" />
                    </>
                </button>
            </div>
        </div>
    );
}
