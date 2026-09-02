import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
    FileText, Upload, Trash2, ArrowRight, Loader2, BookOpen, Plus, Search as SearchIcon, CheckCircle
} from 'lucide-react';
import { WorkflowStepper } from './App';

type Form = {
    formId: string;
    title: string;
    pageCount: number;
    status: string;
};

export default function Forms() {
    const [forms, setForms] = useState<Form[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchForms = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/v1/forms');
            setForms(data);
        } catch (_e) {
            console.error(_e);
        }
    }, []);

    useEffect(() => {
        fetchForms();
    }, [fetchForms]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        const file = e.target.files[0];
        formData.append('file', file);

        // Simulate progress
        const progressTimer = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) { clearInterval(progressTimer); return 90; }
                return prev + Math.random() * 15;
            });
        }, 300);

        try {
            const { data } = await axios.post('/api/v1/forms/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            clearInterval(progressTimer);
            setUploadProgress(100);
            setTimeout(() => navigate(`/forms/${data.formId}`), 400);
        } catch (_err) {
            console.error(_err);
            alert("Analysis failed.");
        } finally {
            clearInterval(progressTimer);
            setUploading(false);
            setUploadProgress(0);
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
        } catch (_e) {
            console.error(_e);
            alert("Delete failed.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="font-display text-2xl sm:text-3xl text-ink tracking-tight">Form Analysis</h1>
                        {forms.length > 0 && (
                            <span className="text-xs font-semibold text-ink-muted bg-surface-200 border border-border px-2.5 py-0.5 rounded-full">{forms.length} forms</span>
                        )}
                    </div>
                    <p className="mt-1 text-ink-secondary text-sm">Upload official PDF forms to automatically extract requirements and build your checklist.</p>
                </div>
                <label className="relative cursor-pointer flex-shrink-0">
                    <span className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                        ${uploading ? 'bg-accent/60 text-white cursor-wait' : 'bg-ink text-surface-50 hover:bg-ink-secondary hover:shadow-card'}`}>
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                <span>Analyze Form</span>
                            </>
                        )}
                    </span>
                    <input type="file" name="file_upload" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
            </div>

            {/* Stepper (Only show if not uploading, otherwise focus on upload state) */}
            {!uploading && forms.length > 0 && (
                <div className="bg-surface-50 rounded-xl border border-border p-6 shadow-card mb-6">
                    <h2 className="text-center font-display text-xl text-ink mb-6">Unified Form Analysis Overview</h2>
                    <WorkflowStepper currentStep={0} />
                </div>
            )}

            {/* Upload Processing State */}
            {uploading && (
                <div className="bg-surface-50 rounded-xl border border-border p-8 shadow-card flex flex-col items-center max-w-xl mx-auto my-12">
                    <WorkflowStepper currentStep={0} />
                    <div className="flex flex-col items-center mt-8 w-full">
                        <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
                        <h3 className="text-base font-semibold text-ink">Analyzing form...</h3>
                        <p className="text-sm text-ink-muted mb-4">Extracting requirements from PDF</p>

                        <div className="w-full bg-surface-200 rounded-full h-2 overflow-hidden border border-border">
                            <div
                                className="h-2 rounded-full bg-accent transition-all duration-300 ease-out"
                                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-ink-muted mt-3">
                            {uploadProgress < 30 ? 'Reading document...' : uploadProgress < 60 ? 'Extracting text...' : uploadProgress < 90 ? 'Identifying requirements...' : 'Finalizing...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Forms Grid */}
            {!uploading && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {forms.map((form) => (
                        <Link
                            key={form.formId}
                            to={`/forms/${form.formId}`}
                            className="group bg-surface-50 rounded-xl border border-border overflow-hidden hover:border-border-dark hover:shadow-card transition-all block relative"
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 bg-surface-100 text-ink-muted rounded-lg flex items-center justify-center group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-semibold text-ink text-sm truncate pr-4" title={form.title}>{form.title}</h4>
                                            <div className="flex items-center space-x-2 mt-0.5">
                                                <span className="inline-flex items-center space-x-1 text-[10px] text-ink-muted">
                                                    <BookOpen className="w-3 h-3" />
                                                    <span>{form.pageCount} pages</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(form.formId, e)}
                                        disabled={deletingId === form.formId}
                                        className="text-ink-faint hover:text-status-red hover:bg-status-red-bg rounded-md p-1 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Delete form"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-border-light">
                                    <span className="text-xs text-ink-secondary font-medium">
                                        {form.status === 'ANALYZED' ? (
                                            <span className="flex items-center space-x-1 text-accent"><CheckCircle className="w-3 h-3" /><span>Analysis complete</span></span>
                                        ) : form.status}
                                    </span>
                                    <span className="text-ink text-xs font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center space-x-1">
                                        <span>Review</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {forms.length === 0 && !uploading && (
                <div className="text-center py-16 px-4 border border-dashed border-border-dark rounded-xl bg-surface-50">
                    <SearchIcon className="w-10 h-10 mx-auto text-ink-faint mb-3" />
                    <h3 className="text-base font-semibold text-ink mb-1">No forms analyzed yet</h3>
                    <p className="text-ink-muted text-sm mb-5 max-w-sm mx-auto">Upload an official PDF form to extract its requirements automatically and build your checklist.</p>
                    <label className="relative cursor-pointer inline-block">
                        <span className="inline-flex items-center space-x-1.5 px-6 py-3 rounded-lg font-semibold text-sm bg-ink text-surface-50 hover:bg-ink-secondary shadow-card hover:shadow-card-hover transition-all">
                            <Upload className="w-4 h-4" />
                            <span>Upload Form for Analysis</span>
                        </span>
                        <input type="file" name="file_upload" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            )}
        </div>
    );
}
