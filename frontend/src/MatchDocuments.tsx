import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Search } from 'lucide-react';
import { WorkflowStepper } from './App';

export default function MatchDocuments() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Analyzing requirements...");

    useEffect(() => {
        let isMounted = true;
        const generate = async () => {
            try {
                if (isMounted) setStatus("Scanning Vault for matching documents...");
                await axios.post('/api/v1/checklists/generate', { formId: id });

                if (isMounted) setStatus("Finalizing checklist...");
                setTimeout(() => {
                    if (isMounted) navigate(`/checklists/${id}`);
                }, 1000);
            } catch (error) {
                console.error(error);
                alert('Failed to match documents.');
                if (isMounted) navigate(`/forms/${id}`);
            }
        };
        generate();
        return () => { isMounted = false; };
    }, [id, navigate]);

    return (
        <div className="animate-in duration-500 max-w-[1100px] mx-auto pb-16">
            <h1 className="font-display text-4xl text-ink tracking-tight text-center mb-10">Matching Documents</h1>

            <div className="mb-10 bg-surface-50 rounded-2xl border border-border p-6 shadow-sm">
                <WorkflowStepper currentStep={2} />
            </div>

            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-surface-50 rounded-xl border border-border shadow-card p-10">
                <div className="relative mb-6">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center animate-pulse">
                        <Search className="w-8 h-8 text-accent" />
                    </div>
                </div>
                <h2 className="text-xl font-semibold text-ink mb-2">AI Document Matcher</h2>
                <p className="text-sm font-medium text-ink-secondary flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent mr-1" />
                    {status}
                </p>
            </div>
        </div>
    );
}
