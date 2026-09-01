import { useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

type ChecklistItem = {
    itemId: string;
    requirementId: string;
    matchedDocumentId?: string;
    status: 'available' | 'missing' | 'expired' | 'expiring_soon' | 'needs_review';
    matchConfidence: number;
    ruleApplied: string;
    explanation: string; // sourceClause
    nextSteps: string;
};

// Map original requirement ID to the document type for display
type ReqDisplayInfo = {
    documentType: string;
    description: string;
    mandatory: boolean;
};

export default function Checklist() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [reqMap, setReqMap] = useState<Record<string, ReqDisplayInfo>>({});
    const [explainingId, setExplainingId] = useState<string | null>(null);
    const [llmExplanations, setLlmExplanations] = useState<Record<string, string>>({});

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const [checklistRes, reqsRes] = await Promise.all([
                axios.get(`/api/v1/checklists/${id}`),
                axios.get(`/api/v1/forms/${id}/requirements`)
            ]);

            const map: Record<string, ReqDisplayInfo> = {};
            reqsRes.data.forEach((r: any) => {
                map[r.requirementId] = {
                    documentType: r.documentTypeNeeded,
                    description: r.description,
                    mandatory: r.mandatory
                };
            });
            setReqMap(map);
            setItems(checklistRes.data);
        } catch (e) {
            console.error(e);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const requestExplanation = async (item: ChecklistItem) => {
        if (llmExplanations[item.itemId] || explainingId === item.itemId) return;
        setExplainingId(item.itemId);
        try {
            const ruleObj = JSON.parse(item.ruleApplied || '{}');
            const { data } = await axios.post('/api/v1/llm/explain', {
                rule: ruleObj.result || "No specific rule.",
                action: item.nextSteps,
                document: reqMap[item.requirementId]?.documentType || 'Document'
            });
            setLlmExplanations(prev => ({ ...prev, [item.itemId]: data.explanation }));
        } catch (e) {
            console.error(e);
            setLlmExplanations(prev => ({ ...prev, [item.itemId]: "Could not generate AI explanation." }));
        } finally {
            setExplainingId(null);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'available': return 'bg-status-green-bg border-status-green-border';
            case 'expired': return 'bg-status-red-bg border-status-red-border';
            case 'missing': return 'bg-status-red-bg border-status-red-border';
            case 'expiring_soon': return 'bg-status-amber-bg border-status-amber-border';
            default: return 'bg-navy-800 border-navy-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'available': return (
                <svg className="w-5 h-5 text-status-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            );
            case 'missing': return (
                <svg className="w-5 h-5 text-status-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            );
            default: return (
                <svg className="w-5 h-5 text-status-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            );
        }
    };

    // Calculate progress
    const mandatoryItems = items.filter(i => reqMap[i.requirementId]?.mandatory);
    const availableMandatory = mandatoryItems.filter(i => i.status === 'available');
    const progress = mandatoryItems.length > 0 ? Math.round((availableMandatory.length / mandatoryItems.length) * 100) : 100;

    // ===== READINESS SUMMARY DATA =====
    const readinessSummary = useMemo(() => {
        const available: string[] = [];
        const expiringSoon: string[] = [];
        const expired: string[] = [];
        const missing: string[] = [];

        items.forEach(item => {
            const docType = reqMap[item.requirementId]?.documentType || 'Unknown';
            switch (item.status) {
                case 'available':
                    available.push(docType);
                    break;
                case 'expiring_soon':
                    expiringSoon.push(docType);
                    break;
                case 'expired':
                    expired.push(docType);
                    break;
                case 'missing':
                    missing.push(docType);
                    break;
                default:
                    missing.push(docType);
                    break;
            }
        });

        const totalRequired = items.filter(i => reqMap[i.requirementId]?.mandatory).length;
        const readyRequired = items.filter(i => reqMap[i.requirementId]?.mandatory && i.status === 'available').length;

        return { available, expiringSoon, expired, missing, totalRequired, readyRequired };
    }, [items, reqMap]);

    // ===== ACTION REQUIRED DATA =====
    const actionItems = useMemo(() => {
        return items
            .filter(i => i.status !== 'available')
            .map(item => ({
                ...item,
                docType: reqMap[item.requirementId]?.documentType || 'Unknown',
                description: reqMap[item.requirementId]?.description || '',
                mandatory: reqMap[item.requirementId]?.mandatory ?? false
            }));
    }, [items, reqMap]);

    return (
        <div className="space-y-8 animate-in duration-500 max-w-4xl mx-auto pb-12">
            <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-ivory-muted hover:text-ivory transition-colors bg-navy-800 border border-navy-700 rounded-lg px-4 py-2 hover:bg-navy-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Analysis
            </button>

            {/* Header with Progress */}
            <div className="bg-navy-800 rounded-xl border border-navy-700 p-8 relative overflow-hidden shadow-card">
                <div className="absolute top-0 right-0 w-64 h-64 bg-bronze/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 items-start md:items-end">
                    <div>
                        <h1 className="font-display text-3xl sm:text-4xl text-ivory tracking-tight">Readiness Checklist</h1>
                        <p className="mt-2 text-ivory-dim text-sm max-w-lg">Based on your secure vault documents and the form requirements, here is your submission readiness status.</p>
                    </div>

                    <a
                        href={`/api/v1/checklists/${id}/export`}
                        download
                        className="inline-flex items-center justify-center space-x-2 bg-navy-700 border border-navy-600 text-bronze hover:text-bronze-light hover:bg-navy-600 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                        <span>Export PDF</span>
                    </a>
                </div>

                <div className="mt-8 relative z-10">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-ivory-muted uppercase tracking-widest">Mandatory Readiness</span>
                        <span className="text-lg font-black text-bronze">{progress}%</span>
                    </div>
                    <div className="w-full bg-navy-900 rounded-full h-2.5 overflow-hidden border border-navy-700">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${progress === 100 ? 'bg-status-green' : 'bg-bronze'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* ===== SECTION 3: Your Document Readiness ===== */}
            {items.length > 0 && (
                <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden shadow-card">
                    <div className="px-6 py-5 border-b border-navy-700/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 bg-navy-700 rounded-lg flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bronze" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h2 className="font-display text-xl text-ivory">Your Document Readiness</h2>
                            </div>
                            <div className="bg-navy-700 px-3 py-1.5 rounded-lg border border-navy-600">
                                <span className="text-sm font-bold text-bronze">
                                    {readinessSummary.readyRequired} of {readinessSummary.totalRequired} required ready
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Available */}
                        <div className="bg-status-green-bg rounded-xl p-4 border border-status-green-border">
                            <div className="flex items-center space-x-2 mb-3">
                                <svg className="w-4 h-4 text-status-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-status-green">Available in Vault</h4>
                            </div>
                            {readinessSummary.available.length > 0 ? (
                                <ul className="space-y-1">
                                    {readinessSummary.available.map((doc, i) => (
                                        <li key={i} className="text-sm text-ivory-dim font-medium">{doc}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-ivory-muted italic">None matched yet</p>
                            )}
                        </div>

                        {/* Expiring Soon */}
                        <div className="bg-status-amber-bg rounded-xl p-4 border border-status-amber-border">
                            <div className="flex items-center space-x-2 mb-3">
                                <svg className="w-4 h-4 text-status-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01" /></svg>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-status-amber">Expiring Soon</h4>
                            </div>
                            {readinessSummary.expiringSoon.length > 0 ? (
                                <ul className="space-y-1">
                                    {readinessSummary.expiringSoon.map((doc, i) => (
                                        <li key={i} className="text-sm text-ivory-dim font-medium">{doc}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-ivory-muted italic">None</p>
                            )}
                        </div>

                        {/* Expired */}
                        <div className="bg-status-red-bg rounded-xl p-4 border border-status-red-border">
                            <div className="flex items-center space-x-2 mb-3">
                                <svg className="w-4 h-4 text-status-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-status-red">Expired</h4>
                            </div>
                            {readinessSummary.expired.length > 0 ? (
                                <ul className="space-y-1">
                                    {readinessSummary.expired.map((doc, i) => (
                                        <li key={i} className="text-sm text-ivory-dim font-medium">{doc}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-ivory-muted italic">None</p>
                            )}
                        </div>

                        {/* Missing */}
                        <div className="bg-status-red-bg rounded-xl p-4 border border-status-red-border">
                            <div className="flex items-center space-x-2 mb-3">
                                <svg className="w-4 h-4 text-status-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-status-red">Missing</h4>
                            </div>
                            {readinessSummary.missing.length > 0 ? (
                                <ul className="space-y-1">
                                    {readinessSummary.missing.map((doc, i) => (
                                        <li key={i} className="text-sm text-ivory-dim font-medium">{doc}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-ivory-muted italic">None — all found!</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SECTION 4: Action Required ===== */}
            {actionItems.length > 0 && (
                <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden shadow-card">
                    <div className="px-6 py-5 border-b border-navy-700/50">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-status-amber-bg rounded-lg flex items-center justify-center border border-status-amber-border">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-status-amber" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="font-display text-xl text-ivory">Action Required</h2>
                                <p className="text-xs text-ivory-muted mt-0.5">{actionItems.length} document(s) need your attention before submission</p>
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-navy-700/50">
                        {actionItems.map(item => (
                            <div key={item.itemId} className="px-6 py-4 flex items-start gap-4 hover:bg-navy-700/20 transition-colors">
                                <div className="flex-shrink-0 mt-0.5">
                                    {item.status === 'missing' && (
                                        <div className="w-8 h-8 bg-status-red-bg rounded-lg flex items-center justify-center border border-status-red-border">
                                            <svg className="w-4 h-4 text-status-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </div>
                                    )}
                                    {item.status === 'expired' && (
                                        <div className="w-8 h-8 bg-status-red-bg rounded-lg flex items-center justify-center border border-status-red-border">
                                            <svg className="w-4 h-4 text-status-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    )}
                                    {item.status === 'expiring_soon' && (
                                        <div className="w-8 h-8 bg-status-amber-bg rounded-lg flex items-center justify-center border border-status-amber-border">
                                            <svg className="w-4 h-4 text-status-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        </div>
                                    )}
                                    {item.status === 'needs_review' && (
                                        <div className="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center border border-navy-600">
                                            <svg className="w-4 h-4 text-ivory-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-semibold text-ivory text-sm">{item.docType}</h4>
                                        {item.mandatory && (
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-bronze text-navy-950 px-1.5 py-0.5 rounded">Required</span>
                                        )}
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${item.status === 'missing' ? 'bg-status-red-bg text-status-red border-status-red-border' :
                                            item.status === 'expired' ? 'bg-status-red-bg text-status-red border-status-red-border' :
                                                item.status === 'expiring_soon' ? 'bg-status-amber-bg text-status-amber border-status-amber-border' :
                                                    'bg-navy-700 text-ivory-muted border-navy-600'
                                            }`}>
                                            {item.status === 'missing' ? 'Missing' :
                                                item.status === 'expired' ? 'Expired' :
                                                    item.status === 'expiring_soon' ? 'Expiring Soon' :
                                                        'Needs Review'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-ivory-dim leading-relaxed">
                                        {item.status === 'missing' && (
                                            <>Missing from your vault. {item.nextSteps || `Obtain a valid copy of your ${item.docType} and add it to the Document Vault before submitting the application.`}</>
                                        )}
                                        {item.status === 'expired' && (
                                            <>Your {item.docType} has expired. {item.nextSteps || `Renew your ${item.docType} and upload the latest version to the vault.`}</>
                                        )}
                                        {item.status === 'expiring_soon' && (
                                            <>Your {item.docType} is expiring soon. {item.nextSteps || `Check whether the application requires a validity period beyond the current expiry date. Consider renewing before submission.`}</>
                                        )}
                                        {item.status === 'needs_review' && (
                                            <>{item.nextSteps || `Please review your ${item.docType} and verify it meets the form's requirements.`}</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== Detailed Checklist Items ===== */}
            <div className="space-y-4">
                {items.map((item) => {
                    const reqInfo = reqMap[item.requirementId] || { documentType: 'Unknown', description: 'Unknown', mandatory: false };

                    return (
                        <div key={item.itemId} className={`p-6 rounded-xl border shadow-card transition-all relative overflow-hidden ${getStatusStyle(item.status)}`}>
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                <div className="flex-shrink-0 mt-1 bg-navy-900/50 p-2 rounded-lg">
                                    {getStatusIcon(item.status)}
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div>
                                        <div className="flex items-center space-x-3 mb-1">
                                            <h3 className="text-lg font-semibold text-ivory">{reqInfo.documentType}</h3>
                                            {reqInfo.mandatory ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider bg-bronze text-navy-950">Mandatory</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-navy-700 text-ivory-muted border border-navy-600">Optional</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-ivory-dim">{reqInfo.description}</p>
                                    </div>

                                    {item.explanation && (
                                        <div className="bg-navy-900/60 rounded-lg p-3 border border-navy-700/50 inline-block">
                                            <p className="text-xs text-ivory-muted font-mono">
                                                <span className="text-bronze-muted font-bold mr-2">SOURCE</span>
                                                {item.explanation}
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-white/5 mt-2">
                                        <h4 className="text-xs font-bold text-ivory uppercase tracking-widest mb-1">Next Steps</h4>
                                        <p className="text-sm font-medium text-ivory-dim leading-relaxed">{item.nextSteps}</p>
                                    </div>

                                    {llmExplanations[item.itemId] && (
                                        <div className="bg-navy-900 text-ivory-dim p-4 rounded-xl shadow-card mt-4 flex space-x-3 animate-in border border-bronze/20">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bronze" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M11.3 1.046A120.1 120.1 0 0010 1a120.16 120.16 0 00-1.3.046l-.15.008a2 2 0 00-1.737 1.576l-.187 1.058C6.113 4.195 5.736 4.7 5.253 5.3a2 2 0 00-.472 2.05l.39.992c.622 1.58.622 3.327 0 4.908l-.39.991a2 2 0 00.472 2.051c.483.6.86 1.105 1.371 1.616l.187 1.058a2 2 0 001.737 1.576l.15.008c.427.025.86.046 1.3.046a120.16 120.16 0 001.3-.046l.15-.008a2 2 0 001.737-1.576l.187-1.058c.511-.511.888-1.015 1.37-1.615a2 2 0 00.473-2.052l-.39-.991a7.994 7.994 0 010-4.908l.39-.992a2 2 0 00-.473-2.05l-1.37-1.616l-.187-1.058a2 2 0 00-1.737-1.576l-.15-.008z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <p className="text-sm leading-relaxed">{llmExplanations[item.itemId]}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="md:ml-auto flex flex-col items-end space-y-2 mt-4 md:mt-0">
                                    {item.matchConfidence > 0 && (
                                        <div className="bg-navy-900 px-3 py-1.5 rounded-lg border border-navy-700 font-medium text-xs text-ivory-muted whitespace-nowrap">
                                            Semantic Match: <span className="text-bronze font-bold">{Math.round(item.matchConfidence * 100)}%</span>
                                        </div>
                                    )}

                                    {item.status !== 'available' && !llmExplanations[item.itemId] && (
                                        <button
                                            onClick={() => requestExplanation(item)}
                                            disabled={explainingId === item.itemId}
                                            className="text-xs font-semibold px-4 py-2 bg-bronze text-navy-950 rounded-lg hover:bg-bronze-light transition-colors disabled:opacity-50 inline-flex items-center"
                                        >
                                            {explainingId === item.itemId ? (
                                                <><svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-navy-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Asking AI...</>
                                            ) : (
                                                'Simplify with AI'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
