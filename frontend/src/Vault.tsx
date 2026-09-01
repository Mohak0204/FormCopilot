import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

type VaultDocument = {
    documentId: string;
    documentType: string;
    holderName: string;
    ocrConfidence: number;
    extractedFields: string;
};

export default function Vault() {
    const [documents, setDocuments] = useState<VaultDocument[]>([]);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        try {
            const endpoint = searchTerm ? `/api/v1/vault?search=${encodeURIComponent(searchTerm)}` : '/api/v1/vault';
            const { data } = await axios.get(endpoint);
            setDocuments(data);
        } catch (e) {
            console.error(e);
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

        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            await axios.post('/api/v1/vault/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchDocuments();
        } catch (err) {
            console.error(err);
            alert("Failed to upload document.");
        } finally {
            setUploading(false);
            e.target.value = ''; // reset
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this document with its encrypted file?")) return;
        setDeletingId(id);
        try {
            await axios.delete(`/api/v1/vault/${id}`);
            await fetchDocuments();
        } catch (e) {
            console.error(e);
            alert("Failed to delete.");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="space-y-8 animate-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl text-ivory tracking-tight">Document Vault</h1>
                    <p className="mt-2 text-ivory-dim text-sm">Securely store encrypted documents for automatic form matching.</p>
                </div>

                <div className="w-full sm:w-auto relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory-muted" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search vault..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2.5 border border-navy-600 rounded-lg bg-navy-800 text-ivory placeholder-ivory-muted focus:ring-1 focus:ring-bronze/50 focus:border-bronze/50 shadow-card transition-all text-sm"
                    />
                </div>
            </div>

            <div className="bg-navy-800 p-6 sm:p-8 rounded-xl border border-navy-700 flex flex-col items-center justify-center text-center shadow-card">
                <div className="w-14 h-14 bg-navy-700 text-bronze rounded-xl flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-ivory mb-1">Add to Encrypted Vault</h3>
                <p className="text-sm text-ivory-muted mb-6 max-w-md leading-relaxed">Documents are encrypted with AES-256 immediately upon upload. Extracts text locally without leaving your machine.</p>

                <label className="relative cursor-pointer">
                    <span className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all
                        ${uploading ? 'bg-bronze/60 text-navy-950 cursor-wait' : 'bg-gradient-to-r from-bronze to-bronze-dark text-navy-950 hover:from-bronze-light hover:to-bronze hover:shadow-glow-bronze'}`}>
                        {uploading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-navy-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Securing & Analyzing...
                            </>
                        ) : 'Select Document (PDF/Image)'}
                    </span>
                    <input type="file" name="file_upload" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                    <div key={doc.documentId} className="group bg-navy-800 rounded-xl border border-navy-700 overflow-hidden hover:border-navy-600 hover:shadow-card-hover transition-all flex flex-col">
                        <div className="p-5 border-b border-navy-700/50 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-navy-700 text-bronze rounded-lg flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-ivory leading-tight">{doc.documentType}</h4>
                                        <span className="text-xs text-ivory-muted font-mono" title={doc.documentId}>
                                            {doc.documentId.substring(0, 8)}...
                                        </span>
                                    </div>
                                </div>
                                {doc.ocrConfidence > 0 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-status-green-bg text-status-green border border-status-green-border">
                                        OCR: {Math.round(doc.ocrConfidence * 100)}%
                                    </span>
                                )}
                            </div>

                            <div>
                                <h4 className="text-[10px] uppercase font-bold text-ivory-muted tracking-widest mb-2">Parsed Data</h4>
                                <div className="text-xs bg-navy-900 text-ivory-dim p-3 rounded-lg h-24 overflow-y-auto font-mono whitespace-pre-wrap border border-navy-700/50">
                                    {doc.extractedFields || <span className="text-ivory-muted animate-pulse">Processing...</span>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-navy-900/50 px-5 py-3 flex items-center justify-between">
                            <a href={`/api/v1/vault/${doc.documentId}/preview`} target="_blank" rel="noreferrer" className="text-bronze hover:text-bronze-light text-sm font-medium flex items-center transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                Decrypt & View
                            </a>
                            <button
                                onClick={() => handleDelete(doc.documentId)}
                                disabled={deletingId === doc.documentId}
                                className="text-ivory-muted hover:text-status-red transition-colors opacity-0 group-hover:opacity-100 p-1"
                                title="Delete Document"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {documents.length === 0 && !uploading && (
                <div className="text-center py-20 px-4 border border-dashed border-navy-600 rounded-xl bg-navy-900/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-navy-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-ivory mb-1">Your vault is empty</h3>
                    <p className="text-ivory-muted text-sm">Upload your government IDs, certificates, and proofs to start automating forms.</p>
                </div>
            )}
        </div>
    );
}
