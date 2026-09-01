import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

type Form = {
    formId: string;
    title: string;
    pageCount: number;
    status: string;
};

export default function Forms() {
    const [forms, setForms] = useState<Form[]>([]);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchForms = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/v1/forms');
            setForms(data);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchForms();
    }, [fetchForms]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            const { data } = await axios.post('/api/v1/forms/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate(`/forms/${data.formId}`);
        } catch (err) {
            console.error(err);
            alert("Analysis failed.");
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm("Delete this form?")) return;

        setDeletingId(id);
        try {
            await axios.delete(`/api/v1/forms/${id}`);
            await fetchForms();
        } catch (e) {
            console.error(e);
            alert("Delete failed.");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="space-y-8 animate-in duration-500">
            <div>
                <h1 className="font-display text-3xl sm:text-4xl text-ivory tracking-tight">Form Analysis</h1>
                <p className="mt-2 text-ivory-dim text-sm">Upload official PDF forms to automatically extract requirements and build your checklist.</p>
            </div>

            <div className="bg-navy-800 p-6 sm:p-8 rounded-xl border border-navy-700 flex flex-col items-center justify-center text-center shadow-card">
                <div className="w-14 h-14 bg-navy-700 text-bronze rounded-xl flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-ivory mb-1">Analyze New Form</h3>
                <p className="text-sm text-ivory-muted mb-6 max-w-md leading-relaxed">Our deterministic engine extracts precisely what documents and conditions are required for submission.</p>

                <label className="relative cursor-pointer">
                    <span className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all
                        ${uploading ? 'bg-bronze/60 text-navy-950 cursor-wait' : 'bg-gradient-to-r from-bronze to-bronze-dark text-navy-950 hover:from-bronze-light hover:to-bronze hover:shadow-glow-bronze'}`}>
                        {uploading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-navy-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Reading Document...
                            </>
                        ) : 'Select PDF Form'}
                    </span>
                    <input type="file" name="file_upload" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {forms.map((form) => (
                    <Link
                        key={form.formId}
                        to={`/forms/${form.formId}`}
                        className="group bg-navy-800 p-5 rounded-xl border border-navy-700 hover:border-navy-600 hover:shadow-card-hover transition-all block relative"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-navy-700 text-ivory-muted rounded-lg group-hover:bg-navy-600 group-hover:text-bronze transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h4 className="font-semibold text-ivory truncate pr-4" title={form.title}>{form.title}</h4>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm mt-4">
                            <span className="text-ivory-muted">{form.pageCount} Pages</span>
                            <span className="text-bronze font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
                                Review <span className="ml-1">&rarr;</span>
                            </span>
                        </div>

                        <button
                            onClick={(e) => handleDelete(form.formId, e)}
                            disabled={deletingId === form.formId}
                            className="absolute top-4 right-4 text-ivory-muted hover:text-status-red transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </Link>
                ))}
            </div>

            {forms.length === 0 && !uploading && (
                <div className="text-center py-20 border border-dashed border-navy-600 rounded-xl bg-navy-900/30">
                    <p className="text-ivory-muted">No forms analyzed yet. Upload a form to begin.</p>
                </div>
            )}
        </div>
    );
}
