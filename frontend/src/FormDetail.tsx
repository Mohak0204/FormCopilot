import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

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

export default function FormDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [requirements, setRequirements] = useState<FormRequirement[]>([]);
    const [formInfo, setFormInfo] = useState<FormInfo | null>(null);
    const [generating, setGenerating] = useState(false);

    // Guidance state
    const [formSummary, setFormSummary] = useState<string | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryRequested, setSummaryRequested] = useState(false);

    const fetchReqs = useCallback(async () => {
        try {
            const [reqsRes, formRes] = await Promise.all([
                axios.get(`/api/v1/forms/${id}/requirements`),
                axios.get(`/api/v1/forms/${id}`)
            ]);
            setRequirements(reqsRes.data);
            setFormInfo(formRes.data);
        } catch (e) {
            console.error(e);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchReqs();
    }, [fetchReqs, id]);

    const generateChecklist = async () => {
        setGenerating(true);
        try {
            await axios.post('/api/v1/checklists/generate', { formId: id });
            navigate(`/checklists/${id}`);
        } catch (e) {
            console.error(e);
            alert('Failed to generate checklist.');
            setGenerating(false);
        }
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
        } catch (e) {
            console.error(e);
            setFormSummary('Unable to generate form summary at this time.');
        } finally {
            setSummaryLoading(false);
        }
    };

    // Helper: build plain-english guidance for each requirement
    const getGuidanceText = (req: FormRequirement): string => {
        const docType = req.documentTypeNeeded;
        const category = req.category?.toLowerCase() || 'general';

        let sectionHint = 'Provide this in the relevant section of the form.';
        if (category === 'identity') {
            sectionHint = 'Provide this information in the identity/personal details section of the form.';
        } else if (category === 'address') {
            sectionHint = 'Provide this in the address/residence section of the form.';
        } else if (category === 'financial') {
            sectionHint = 'Provide this in the financial details or income section of the form.';
        } else if (category === 'education') {
            sectionHint = 'Provide this in the educational qualifications section of the form.';
        }

        let keepReady = `Keep your ${docType} ready for reference or verification.`;
        if (docType.toLowerCase().includes('aadhaar')) {
            keepReady = 'Enter your name exactly as it appears on your Aadhaar card. Keep your Aadhaar ready for verification.';
        } else if (docType.toLowerCase().includes('pan')) {
            keepReady = 'Enter your PAN number accurately. Keep your PAN Card ready.';
        } else if (docType.toLowerCase().includes('birth certificate')) {
            keepReady = 'Keep your original or certified Birth Certificate ready. Ensure date of birth matches across all documents.';
        } else if (docType.toLowerCase().includes('marksheet')) {
            keepReady = `Keep your ${docType} ready. Ensure marks/percentage and school/college name are legible.`;
        }

        return `${sectionHint}\n${keepReady}`;
    };

    const mandatoryReqs = requirements.filter(r => r.mandatory);
    const optionalReqs = requirements.filter(r => !r.mandatory);

    return (
        <div className="space-y-8 animate-in duration-500 max-w-5xl mx-auto">
            <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-ivory-muted hover:text-ivory transition-colors bg-navy-800 border border-navy-700 rounded-lg px-4 py-2 hover:bg-navy-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Forms
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-navy-700 pb-8">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl text-ivory tracking-tight">Extracted Requirements</h1>
                    <p className="mt-2 text-ivory-dim text-sm">The deterministic engine has extracted these rules from the document text.</p>
                </div>
                <button
                    onClick={generateChecklist}
                    disabled={generating || requirements.length === 0}
                    className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-bronze to-bronze-dark text-navy-950 px-6 py-3 rounded-lg font-semibold text-sm shadow-glow-bronze hover:from-bronze-light hover:to-bronze disabled:opacity-50 disabled:cursor-wait transition-all"
                >
                    {generating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-navy-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Matching with Vault...
                        </>
                    ) : (
                        <>
                            <span>Generate Smart Checklist</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                        </>
                    )}
                </button>
            </div>

            {/* ===== SECTION 1: Understand This Form ===== */}
            {requirements.length > 0 && (
                <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden shadow-card">
                    <div className="px-6 py-5 border-b border-navy-700/50 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-navy-700 rounded-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bronze" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h2 className="font-display text-xl text-ivory">Understand This Form</h2>
                        </div>
                        {!formSummary && !summaryLoading && (
                            <button
                                onClick={requestFormSummary}
                                className="text-sm font-semibold text-bronze hover:text-bronze-light bg-navy-700 hover:bg-navy-600 px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-1.5 border border-navy-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M11.3 1.046A120.1 120.1 0 0010 1a120.16 120.16 0 00-1.3.046l-.15.008a2 2 0 00-1.737 1.576l-.187 1.058C6.113 4.195 5.736 4.7 5.253 5.3a2 2 0 00-.472 2.05l.39.992c.622 1.58.622 3.327 0 4.908l-.39.991a2 2 0 00.472 2.051c.483.6.86 1.105 1.371 1.616l.187 1.058a2 2 0 001.737 1.576l.15.008c.427.025.86.046 1.3.046a120.16 120.16 0 001.3-.046l.15-.008a2 2 0 001.737-1.576l.187-1.058c.511-.511.888-1.015 1.37-1.615a2 2 0 00.473-2.052l-.39-.991a7.994 7.994 0 010-4.908l.39-.992a2 2 0 00-.473-2.05l-1.37-1.616l-.187-1.058a2 2 0 00-1.737-1.576l-.15-.008z" />
                                </svg>
                                <span>Summarize with AI</span>
                            </button>
                        )}
                    </div>
                    <div className="px-6 py-5">
                        {summaryLoading && (
                            <div className="flex items-center space-x-3 text-bronze">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span className="text-sm font-medium text-ivory-dim">Analyzing form and generating plain-English summary...</span>
                            </div>
                        )}
                        {formSummary && (
                            <div className="whitespace-pre-line text-sm text-ivory-dim leading-relaxed">
                                {formSummary}
                            </div>
                        )}
                        {!summaryRequested && !summaryLoading && (
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <span className="text-bronze font-bold text-sm mt-0.5">•</span>
                                    <p className="text-sm text-ivory-dim"><span className="font-semibold text-ivory">Form:</span> {formInfo?.title || 'Government/Institutional Form'} ({formInfo?.pageCount || '?'} pages)</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <span className="text-bronze font-bold text-sm mt-0.5">•</span>
                                    <p className="text-sm text-ivory-dim"><span className="font-semibold text-ivory">Total Requirements:</span> {mandatoryReqs.length} mandatory, {optionalReqs.length} optional</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <span className="text-bronze font-bold text-sm mt-0.5">•</span>
                                    <p className="text-sm text-ivory-dim"><span className="font-semibold text-ivory">Categories:</span> {[...new Set(requirements.map(r => r.category || 'General'))].join(', ')}</p>
                                </div>
                                <p className="text-xs text-ivory-muted mt-3 italic">Click "Summarize with AI" above for a detailed plain-English explanation of this form.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== SECTION 2: What You Need to Fill / Provide ===== */}
            {requirements.length > 0 && (
                <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden shadow-card">
                    <div className="px-6 py-5 border-b border-navy-700/50">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-navy-700 rounded-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bronze" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="font-display text-xl text-ivory">What You Need to Fill / Provide</h2>
                                <p className="text-xs text-ivory-muted mt-0.5">Practical guidance for each requirement based on the analyzed form</p>
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-navy-700/50">
                        {mandatoryReqs.map(req => (
                            <div key={req.requirementId} className="px-6 py-4 hover:bg-navy-700/20 transition-colors">
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 mt-1 inline-flex items-center justify-center w-5 h-5 bg-status-red-bg rounded border border-status-red-border text-status-red">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h4 className="font-semibold text-ivory text-sm">{req.documentTypeNeeded}</h4>
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-status-red-bg text-status-red border border-status-red-border px-1.5 py-0.5 rounded">Required</span>
                                        </div>
                                        <p className="text-sm text-ivory-dim leading-relaxed whitespace-pre-line">{getGuidanceText(req)}</p>
                                        {req.sourceClause && (
                                            <p className="text-xs text-ivory-muted mt-1.5 italic">Condition: {req.sourceClause}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {optionalReqs.map(req => (
                            <div key={req.requirementId} className="px-6 py-4 hover:bg-navy-700/20 transition-colors opacity-75">
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 mt-1 inline-flex items-center justify-center w-5 h-5 bg-status-amber-bg rounded border border-status-amber-border text-status-amber">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h4 className="font-semibold text-ivory text-sm">{req.documentTypeNeeded}</h4>
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-status-amber-bg text-status-amber border border-status-amber-border px-1.5 py-0.5 rounded">Optional</span>
                                        </div>
                                        <p className="text-sm text-ivory-dim leading-relaxed whitespace-pre-line">{getGuidanceText(req)}</p>
                                        {req.sourceClause && (
                                            <p className="text-xs text-ivory-muted mt-1.5 italic">Condition: {req.sourceClause}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== Requirements Table ===== */}
            <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden shadow-card">
                <table className="min-w-full divide-y divide-navy-700 text-sm">
                    <thead className="bg-navy-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-ivory-muted uppercase tracking-wider text-xs">Category</th>
                            <th className="px-6 py-4 text-left font-semibold text-ivory-muted uppercase tracking-wider text-xs">Required Document</th>
                            <th className="px-6 py-4 text-left font-semibold text-ivory-muted uppercase tracking-wider text-xs">Description & Rules</th>
                            <th className="px-6 py-4 text-left font-semibold text-ivory-muted uppercase tracking-wider text-xs">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-700/50">
                        {requirements.map((req) => (
                            <tr key={req.requirementId} className="hover:bg-navy-700/20 transition-colors">
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-navy-700 text-ivory-dim border border-navy-600">
                                        {req.category || 'General'}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="font-semibold text-ivory">{req.documentTypeNeeded}</div>
                                </td>
                                <td className="px-6 py-5 max-w-md">
                                    <div className="text-ivory-dim font-medium mb-1">{req.description}</div>
                                    {req.sourceClause && (
                                        <div className="text-xs text-ivory-muted font-mono bg-navy-900 p-2 rounded border border-navy-700 mt-2 line-clamp-2" title={req.sourceClause}>
                                            <span className="font-semibold mr-1 text-bronze-muted">Clause:</span>{req.sourceClause}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    {req.mandatory ? (
                                        <span className="inline-flex items-center text-xs font-bold text-status-red bg-status-red-bg border border-status-red-border px-2.5 py-1 rounded">
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                                            Mandatory
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center text-xs font-bold text-status-amber bg-status-amber-bg border border-status-amber-border px-2.5 py-1 rounded">
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                                            Optional
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {requirements.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-ivory-muted">
                                    <p>No requirements extracted yet. Please try analyzing a different file.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
