import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CircleAlert, CircleCheck, Download,
    CheckCircle, XCircle, Info, ChevronDown, Lock, Sparkles, Loader2
} from 'lucide-react';
import { WorkflowStepper } from './App';

type FormRequirement = {
    requirementId: string;
    description: string;
    documentTypeNeeded: string;
    mandatory: boolean;
};

type ChecklistItem = {
    itemId: string;
    requirementId: string;
    status: string; // 'available', 'missing', 'expired', 'expiring_soon', 'needs_review'
    matchedDocumentId?: string;
    explanation?: string;
    nextSteps?: string;
    matchConfidence?: number;
};

type ChecklistData = {
    formId: string;
    readinessPercentage: number;
    items: Array<ChecklistItem & FormRequirement & { isMatched: boolean }>;
};

function ChecklistAccordionItem({ item, isOpen, onToggle, explanation, expLoading, fetchDetails }: {
    item: ChecklistData['items'][0];
    isOpen: boolean;
    onToggle: () => void;
    explanation: string | null;
    expLoading: boolean;
    fetchDetails: () => void;
}) {
    const isMatched = item.isMatched;

    return (
        <div className="border-b border-border-light last:border-b-0">
            <button
                onClick={() => {
                    onToggle();
                    if (!isOpen && !explanation && !expLoading && !isMatched) {
                        fetchDetails();
                    }
                }}
                className={`w-full flex items-center justify-between px-5 py-4 transition-colors text-left group
                    ${isMatched ? 'bg-status-green-bg/30 hover:bg-status-green-bg/60' : 'bg-surface-50 hover:bg-surface-100'}
                `}
            >
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                    {isMatched ? (
                        <div className="w-8 h-8 rounded-full bg-status-green flex items-center justify-center flex-shrink-0">
                            <CircleCheck className="w-4 h-4 text-surface-50" />
                        </div>
                    ) : item.mandatory ? (
                        <div className="w-8 h-8 rounded-full bg-status-amber-bg flex items-center justify-center flex-shrink-0">
                            <CircleAlert className="w-4 h-4 text-status-amber" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center flex-shrink-0 border border-border-dark">
                            <span className="text-xs font-bold text-ink-muted">OPT</span>
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                            <span className={`text-sm font-semibold truncate ${item.status === 'MISSING' && item.mandatory ? 'text-status-red' : 'text-ink'}`}>
                                {item.documentTypeNeeded}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 border
                                ${isMatched ? 'bg-status-green border-status-green text-surface-50' :
                                    item.mandatory ? 'bg-status-amber-bg border-status-amber-border text-status-amber' :
                                        'bg-surface-200 border-border-dark text-ink-muted'}`}
                            >
                                {isMatched ? 'Ready' : item.mandatory ? 'Missing' : 'Optional'}
                            </span>
                        </div>
                        {isMatched && (
                            <p className="text-xs text-status-green-light mt-1 flex items-center font-medium">
                                <Lock className="w-3 h-3 mr-1 opacity-70" />
                                {item.matchedDocumentId ? `Vault Document ID: ${item.matchedDocumentId.split('-')[0]}` : 'Matched securely'}
                            </p>
                        )}
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isMatched ? 'text-status-green-light' : 'text-ink-faint'} ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                <div className={`px-5 pb-5 pl-[4.5rem] pt-2 ${isMatched ? 'bg-status-green-bg/30' : 'bg-surface-50'}`}>
                    <p className="text-sm text-ink-secondary mb-3">{item.description}</p>
                    {item.nextSteps && <p className="text-sm font-medium text-ink-secondary mb-3">Action: {item.nextSteps}</p>}

                    {/* AI Explanation state */}
                    {!isMatched && (
                        <div className="bg-surface-100 rounded-lg p-4 mt-3 border border-border-light relative overflow-hidden">
                            <div className="flex items-center space-x-2 text-accent mb-2">
                                <Sparkles className="w-4 h-4" />
                                <span className="font-semibold text-xs tracking-wide uppercase">AI Assistant Tip</span>
                            </div>

                            {expLoading ? (
                                <div className="space-y-2 mt-3 w-full">
                                    <div className="skeleton h-3 w-full"></div>
                                    <div className="skeleton h-3 w-4/5"></div>
                                </div>
                            ) : explanation ? (
                                <p className="text-sm text-ink-secondary leading-relaxed">
                                    {explanation}
                                </p>
                            ) : (
                                <p className="text-sm text-ink-muted">Click to load contextual alternative documents...</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Checklist() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [checklist, setChecklist] = useState<ChecklistData | null>(null);
    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [expLoading, setExpLoading] = useState<Record<string, boolean>>({});
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
    const [exporting, setExporting] = useState(false);

    const fetchChecklist = useCallback(async () => {
        try {
            const [checklistRes, formReqsRes] = await Promise.all([
                axios.get(`/api/v1/checklists/${id}`),
                axios.get(`/api/v1/forms/${id}/requirements`)
            ]);

            const items: ChecklistItem[] = checklistRes.data;
            const reqs: FormRequirement[] = formReqsRes.data;

            const reqMap = new Map<string, FormRequirement>();
            reqs.forEach(r => reqMap.set(r.requirementId, r));

            const combinedItems = items.map(item => {
                const req = reqMap.get(item.requirementId);
                return {
                    ...item,
                    ...req,
                    description: req?.description || '',
                    documentTypeNeeded: req?.documentTypeNeeded || 'Unknown Requirement',
                    mandatory: req?.mandatory || false,
                    isMatched: item.status === 'available'
                };
            });

            const availableCount = items.filter(i => i.status === 'available').length;
            const readinessPercentage = items.length > 0 ? Math.round((availableCount / items.length) * 100) : 0;

            const checklistData: ChecklistData = {
                formId: id!,
                readinessPercentage,
                items: combinedItems as any
            };

            setChecklist(checklistData);

            // Open missing items by default
            const missingIds = new Set<string>(checklistData.items.filter(i => !i.isMatched).map(i => i.itemId));
            setOpenAccordions(missingIds);

        } catch (_e) {
            console.error(_e);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchChecklist();
    }, [fetchChecklist, id]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const { data } = await axios.get(`/api/v1/checklists/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `readiness_report_${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (_e) {
            console.error(_e);
            alert("Export failed.");
        } finally {
            setExporting(false);
        }
    };

    const fetchExplanation = async (itemId: string, reqDesc: string, docNeeded: string) => {
        if (explanations[itemId] || expLoading[itemId]) return;

        setExpLoading(prev => ({ ...prev, [itemId]: true }));
        try {
            const formTitle = "Form"; // ideally passed in or fetched separately
            const { data } = await axios.post('/api/v1/llm/explain', {
                requirementContext: `This is required for ${formTitle}. ${reqDesc}`,
                missingDocumentType: docNeeded
            });
            setExplanations(prev => ({ ...prev, [itemId]: data.explanation }));
        } catch (_e) {
            console.error(_e);
            setExplanations(prev => ({ ...prev, [itemId]: 'Failed to generate explanation. Please try again.' }));
        } finally {
            setExpLoading(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const toggleAccordion = (id: string, reqDesc: string, docNeeded: string, isMatched: boolean) => {
        setOpenAccordions(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
                if (!isMatched && !explanations[id] && !expLoading[id]) {
                    fetchExplanation(id, reqDesc, docNeeded);
                }
            }
            return next;
        });
    };

    if (!checklist) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
                <p className="text-ink-secondary text-sm">Building smart checklist...</p>
            </div>
        );
    }

    const items = checklist.items;
    const mandatoryMissing = items.filter(i => i.mandatory && !i.isMatched).length;
    const isComplete = checklist.readinessPercentage >= 100;

    // Sort array: Missing mandatory -> Missing optional -> matched
    const sortedItems = [...items].sort((a, b) => {
        if (a.isMatched !== b.isMatched) {
            if (!a.isMatched) return -1;
            return 1;
        }
        if (a.mandatory !== b.mandatory) return a.mandatory ? -1 : 1;
        return 0;
    });

    const circumference = 2 * Math.PI * 40; // R=40
    const offset = circumference - (checklist.readinessPercentage / 100) * circumference;

    return (
        <div className="animate-in duration-500 max-w-[1100px] mx-auto pb-16">
            <div className="mb-6 flex items-center">
                <button onClick={() => navigate(`/forms/${checklist.formId}`)} className="inline-flex items-center text-sm font-medium text-ink-muted hover:text-ink transition-colors mr-4">
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back to Form Requirements
                </button>
            </div>

            {/* Title Section */}
            <h1 className="font-display text-4xl text-ink tracking-tight text-center mb-10">Application Readiness</h1>

            {/* Progress Stepper */}
            <div className="mb-10 bg-surface-50 rounded-2xl border border-border p-6 shadow-sm">
                <WorkflowStepper currentStep={3} />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-6">

                    {/* Header Summary */}
                    <div className="bg-surface-50 rounded-xl border border-border overflow-hidden shadow-card p-6 flex flex-col sm:flex-row items-center gap-6">

                        {/* Circle progress overlay logic */}
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-200" />
                                <circle
                                    cx="50" cy="50" r="40"
                                    stroke="currentColor"
                                    strokeWidth="8" fill="transparent"
                                    className={isComplete ? "text-status-green" : "text-accent transition-all duration-1000 ease-out"}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                />
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center flex-col">
                                <span className={`text-xl font-bold ${isComplete ? 'text-status-green' : 'text-ink'}`}>{checklist.readinessPercentage}%</span>
                                <span className="text-[9px] uppercase font-bold text-ink-muted tracking-wider">Ready</span>
                            </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="font-display text-2xl text-ink mb-1">
                                {isComplete ? "You're ready to submit!" : "Ready for compilation"}
                            </h2>
                            <p className="text-sm text-ink-secondary mb-4">
                                {isComplete
                                    ? "All required documents have been matched from your vault."
                                    : `You have ${mandatoryMissing} mandatory documents remaining.`
                                }
                            </p>

                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                <div className="flex items-center space-x-2 bg-status-green-bg border border-status-green-border px-3 py-1.5 rounded-full">
                                    <CheckCircle className="w-4 h-4 text-status-green" />
                                    <span className="text-xs font-semibold text-status-green-dark">
                                        {items.filter(i => i.isMatched).length} Matched
                                    </span>
                                </div>
                                {mandatoryMissing > 0 && (
                                    <div className="flex items-center space-x-2 bg-status-red-bg border border-status-red-border px-3 py-1.5 rounded-full">
                                        <XCircle className="w-4 h-4 text-status-red" />
                                        <span className="text-xs font-semibold text-status-red-dark">
                                            {mandatoryMissing} Missing
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-surface-50 rounded-xl border border-border overflow-hidden shadow-card">
                        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-surface-100/50">
                            <div className="flex items-center space-x-2.5">
                                <h2 className="font-semibold text-ink text-base">Checklist Details</h2>
                                <span className="text-sm font-medium text-ink-muted">({items.length} items)</span>
                            </div>
                            <button
                                onClick={() => {
                                    if (openAccordions.size === items.length) {
                                        setOpenAccordions(new Set());
                                    } else {
                                        setOpenAccordions(new Set(items.map(r => r.itemId)));
                                    }
                                }}
                                className="text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                            >
                                {openAccordions.size === items.length ? 'Collapse all' : 'Expand all'}
                            </button>
                        </div>
                        <div className="divide-y divide-border-light">
                            {sortedItems.map(item => (
                                <ChecklistAccordionItem
                                    key={item.itemId}
                                    item={item}
                                    isOpen={openAccordions.has(item.itemId)}
                                    onToggle={() => toggleAccordion(item.itemId, item.description, item.documentTypeNeeded, item.isMatched)}
                                    explanation={explanations[item.itemId] || null}
                                    expLoading={expLoading[item.itemId] || false}
                                    fetchDetails={() => fetchExplanation(item.itemId, item.description, item.documentTypeNeeded)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="hidden lg:block w-[320px] flex-shrink-0">
                    <div className="sticky top-20 space-y-6">
                        {/* Final Action Card */}
                        <div className="bg-surface-50 rounded-xl border border-border overflow-hidden shadow-card p-5">
                            <h3 className="text-sm font-bold text-ink mb-4">Export & Next Steps</h3>
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="w-full inline-flex items-center justify-center space-x-2 bg-ink hover:bg-ink-secondary text-white px-4 py-3 rounded-lg font-semibold text-sm shadow-sm disabled:opacity-50 transition-all mb-4"
                            >
                                {exporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Generating PDF...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span>Download Full Checklist</span>
                                    </>
                                )}
                            </button>

                            <div className="bg-surface-100 rounded-lg p-3 text-xs text-ink-secondary border border-border-light">
                                <div className="flex items-start space-x-2 mb-2">
                                    <Info className="w-4 h-4 text-ink-muted flex-shrink-0" />
                                    <p>Exporting will generate a PDF compilation checklist for your official submission.</p>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <Lock className="w-4 h-4 text-accent flex-shrink-0" />
                                    <p>Your vault documents remain fully encrypted. The report only contains the checklist.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile CTA */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border p-4 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full inline-flex items-center justify-center space-x-2 bg-ink hover:bg-ink-secondary text-white px-4 py-3 rounded-lg font-semibold text-base shadow-sm disabled:opacity-50 transition-all"
                >
                    {exporting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Exporting...</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            <span>Download Full Checklist</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
