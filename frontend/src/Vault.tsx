import { useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Search, Lock, FileText, Eye, Trash2, ShieldCheck, HardDrive,
    CloudOff, Loader2, CheckCircle, Key, ScanText, FolderOpen,
    CreditCard, GraduationCap, Landmark, MapPin, MoreVertical, Plus
} from 'lucide-react';

type VaultDocument = {
    documentId: string;
    documentType: string;
    holderName: string;
    ocrConfidence: number;
    extractedFields: string;
};

const CATEGORY_MAP: Record<string, string> = {
    'aadhaar': 'Identity',
    'pan': 'Identity',
    'passport': 'Identity',
    'voter': 'Identity',
    'driving': 'Identity',
    'birth': 'Identity',
    'address': 'Address',
    'utility': 'Address',
    'electricity': 'Address',
    'water': 'Address',
    'rent': 'Address',
    'marksheet': 'Education',
    'degree': 'Education',
    'diploma': 'Education',
    'certificate': 'Education',
    'school': 'Education',
    'income': 'Financial',
    'salary': 'Financial',
    'tax': 'Financial',
    'bank': 'Financial',
    'itr': 'Financial',
};

function getCategory(docType: string): string {
    const lower = docType.toLowerCase();
    for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
        if (lower.includes(key)) return cat;
    }
    return 'Other';
}

function getCategoryIcon(category: string) {
    switch (category) {
        case 'Identity': return CreditCard;
        case 'Address': return MapPin;
        case 'Education': return GraduationCap;
        case 'Financial': return Landmark;
        default: return FileText;
    }
}

const TABS = ['All', 'Identity', 'Address', 'Education', 'Financial', 'Other'] as const;

export default function Vault() {
    const [documents, setDocuments] = useState<VaultDocument[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadStage, setUploadStage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('All');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        try {
            const endpoint = searchTerm ? `/api/v1/vault?search=${encodeURIComponent(searchTerm)}` : '/api/v1/vault';
            const { data } = await axios.get(endpoint);
            setDocuments(data);
        } catch (_e) {
            console.error(_e);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchDocuments();
        const interval = setInterval(fetchDocuments, 3000);
        return () => clearInterval(interval);
    }, [fetchDocuments]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        setUploadStage(1);

        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        const stageTimer1 = setTimeout(() => setUploadStage(2), 600);
        const stageTimer2 = setTimeout(() => setUploadStage(3), 1200);
        const stageTimer3 = setTimeout(() => setUploadStage(4), 1800);

        try {
            await axios.post('/api/v1/vault/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchDocuments();
        } catch (_err) {
            console.error(_err);
            alert("Failed to upload document.");
        } finally {
            clearTimeout(stageTimer1);
            clearTimeout(stageTimer2);
            clearTimeout(stageTimer3);
            setUploading(false);
            setUploadStage(0);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this document with its encrypted file?")) return;
        setDeletingId(id);
        try {
            await axios.delete(`/api/v1/vault/${id}`);
            await fetchDocuments();
        } catch (_e) {
            console.error(_e);
            alert("Failed to delete.");
        } finally {
            setDeletingId(null);
        }
    };

    const categorizedDocs = useMemo(() => {
        return documents.map(doc => ({
            ...doc,
            category: getCategory(doc.documentType),
        }));
    }, [documents]);

    const filteredDocs = useMemo(() => {
        if (activeTab === 'All') return categorizedDocs;
        return categorizedDocs.filter(d => d.category === activeTab);
    }, [categorizedDocs, activeTab]);

    const tabCounts = useMemo(() => {
        const counts: Record<string, number> = { All: documents.length };
        for (const tab of TABS) {
            if (tab !== 'All') counts[tab] = 0;
        }
        for (const doc of categorizedDocs) {
            counts[doc.category] = (counts[doc.category] || 0) + 1;
        }
        return counts;
    }, [documents.length, categorizedDocs]);

    const uploadStages = [
        { label: 'Document uploaded', done: uploadStage >= 1 },
        { label: 'Document encrypted', done: uploadStage >= 2 },
        { label: 'Text extracted', done: uploadStage >= 3 },
        { label: 'Identifying document', done: uploadStage >= 4, active: uploadStage === 4 },
        { label: 'Extracting fields', done: false, active: false },
        { label: 'Preparing for matching', done: false, active: false },
    ];

    return (
        <div className="space-y-6 animate-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="font-display text-2xl sm:text-3xl text-ink tracking-tight">Secure Document Vault</h1>
                        <span className="text-xs font-semibold text-ink-muted bg-surface-200 border border-border px-2.5 py-0.5 rounded-full">{documents.length} docs</span>
                    </div>
                    <div className="flex items-center space-x-3 mt-1.5">
                        <div className="flex items-center space-x-1 text-xs text-ink-muted">
                            <Lock className="w-3 h-3 text-accent" />
                            <span>AES-256 encrypted</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-ink-muted">
                            <HardDrive className="w-3 h-3 text-ink-faint" />
                            <span>Local processing</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
                        <input
                            type="text"
                            placeholder="Search vault..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-56 pl-9 pr-3 py-2 border border-border rounded-lg bg-surface-50 text-ink placeholder-ink-faint focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-all text-sm"
                        />
                    </div>
                    <label className="relative cursor-pointer flex-shrink-0">
                        <span className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                            ${uploading ? 'bg-accent/60 text-white cursor-wait' : 'bg-ink text-surface-50 hover:bg-ink-secondary hover:shadow-card'}`}>
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    <span>Add Document</span>
                                </>
                            )}
                        </span>
                        <input type="file" name="file_upload" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* Processing Panel */}
            {uploading && (
                <div className="bg-surface-50 rounded-xl border border-border p-5 shadow-card">
                    <h3 className="text-sm font-semibold text-ink mb-3 flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 text-accent animate-spin" />
                        <span>Processing Document</span>
                    </h3>
                    <div className="space-y-2">
                        {uploadStages.map((stage, i) => (
                            <div key={i} className="flex items-center space-x-2.5">
                                {stage.done ? (
                                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                                ) : stage.active ? (
                                    <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border border-border-dark flex-shrink-0" />
                                )}
                                <span className={`text-sm ${stage.done ? 'text-ink' : stage.active ? 'text-accent' : 'text-ink-faint'}`}>
                                    {stage.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 -mx-1 px-1 border-b border-border">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-2 text-sm font-medium transition-all whitespace-nowrap flex items-center space-x-1.5 border-b-2 -mb-px ${activeTab === tab
                            ? 'border-ink text-ink'
                            : 'border-transparent text-ink-muted hover:text-ink hover:border-border-dark'
                            }`}
                    >
                        <span>{tab}</span>
                        <span className={`text-xs ${activeTab === tab ? 'text-ink-secondary' : 'text-ink-faint'}`}>
                            {tabCounts[tab] || 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* Document Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocs.map((doc) => {
                    const CategoryIcon = getCategoryIcon(doc.category);
                    const isProcessing = !doc.extractedFields;

                    return (
                        <div key={doc.documentId} className="group bg-surface-50 rounded-xl border border-border overflow-hidden hover:border-border-dark hover:shadow-card transition-all flex flex-col">
                            <div className="p-4 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 bg-surface-200 text-ink-secondary rounded-lg flex items-center justify-center">
                                            <CategoryIcon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-semibold text-ink text-sm leading-tight truncate">{doc.documentType}</h4>
                                            <div className="flex items-center space-x-2 mt-0.5">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted bg-surface-200 px-1.5 py-0.5 rounded">
                                                    {doc.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        {doc.ocrConfidence > 0 && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-green-bg text-status-green border border-status-green-border">
                                                <ScanText className="w-3 h-3 mr-0.5" />
                                                {Math.round(doc.ocrConfidence * 100)}%
                                            </span>
                                        )}
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === doc.documentId ? null : doc.documentId)}
                                                className="p-1 text-ink-faint hover:text-ink rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                aria-label="Document actions"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            {openMenuId === doc.documentId && (
                                                <div className="absolute right-0 top-full mt-1 bg-surface-50 border border-border rounded-lg shadow-elevated z-20 py-1 w-36">
                                                    <a
                                                        href={`/api/v1/vault/${doc.documentId}/preview`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center space-x-2 px-3 py-1.5 text-sm text-ink-secondary hover:text-ink hover:bg-surface-100 transition-colors"
                                                        onClick={() => setOpenMenuId(null)}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>View</span>
                                                    </a>
                                                    <button
                                                        onClick={() => { handleDelete(doc.documentId); setOpenMenuId(null); }}
                                                        disabled={deletingId === doc.documentId}
                                                        className="flex items-center space-x-2 px-3 py-1.5 text-sm text-status-red hover:bg-status-red-bg transition-colors w-full text-left"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Status indicators */}
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="flex items-center space-x-1 text-[10px] text-ink-muted">
                                        <Key className="w-3 h-3 text-accent" />
                                        <span>Encrypted</span>
                                    </div>
                                    {isProcessing ? (
                                        <div className="flex items-center space-x-1 text-[10px] text-status-amber">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>Processing</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-1 text-[10px] text-accent">
                                            <CheckCircle className="w-3 h-3" />
                                            <span>Extracted</span>
                                        </div>
                                    )}
                                </div>

                                {/* Extracted data preview */}
                                {isProcessing ? (
                                    <div className="space-y-2">
                                        <div className="skeleton h-3 w-full"></div>
                                        <div className="skeleton h-3 w-3/4"></div>
                                        <div className="skeleton h-3 w-1/2"></div>
                                    </div>
                                ) : (
                                    <div className="text-xs bg-surface-100 text-ink-secondary p-2.5 rounded-lg h-20 overflow-y-auto font-mono whitespace-pre-wrap border border-border-light">
                                        {doc.extractedFields}
                                    </div>
                                )}
                            </div>

                            <div className="bg-surface-100 px-4 py-2.5 flex items-center justify-between border-t border-border-light">
                                <a
                                    href={`/api/v1/vault/${doc.documentId}/preview`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-accent hover:text-accent-light text-xs font-medium flex items-center transition-colors space-x-1"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View</span>
                                </a>
                                <span className="text-[10px] text-ink-faint font-mono" title={doc.documentId}>
                                    {doc.documentId.substring(0, 8)}...
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredDocs.length === 0 && !uploading && (
                <div className="text-center py-16 px-4 border border-dashed border-border-dark rounded-xl bg-surface-50">
                    <FolderOpen className="w-10 h-10 mx-auto text-ink-faint mb-3" />
                    <h3 className="text-base font-semibold text-ink mb-1">
                        {activeTab === 'All' ? 'Your vault is empty' : `No ${activeTab.toLowerCase()} documents`}
                    </h3>
                    <p className="text-ink-muted text-sm max-w-sm mx-auto mb-4">
                        {activeTab === 'All'
                            ? 'Upload your government IDs, certificates, and proofs to start automating forms.'
                            : `Upload ${activeTab.toLowerCase()} documents to see them here.`
                        }
                    </p>
                    <label className="relative cursor-pointer inline-block">
                        <span className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-lg font-semibold text-sm bg-ink text-surface-50 hover:bg-ink-secondary transition-all">
                            <Plus className="w-4 h-4" />
                            <span>Add Document</span>
                        </span>
                        <input type="file" name="file_upload" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            )}

            {/* Privacy Panel */}
            <div className="bg-surface-50 rounded-xl border border-border p-5">
                <div className="flex items-center space-x-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <h4 className="text-sm font-semibold text-ink">Your documents stay under your control</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2 text-xs text-ink-secondary">
                        <Lock className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                        <span>AES-256 encrypted at rest</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-ink-secondary">
                        <HardDrive className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                        <span>Processed locally on your machine</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-ink-secondary">
                        <CloudOff className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                        <span>No cloud document storage</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
