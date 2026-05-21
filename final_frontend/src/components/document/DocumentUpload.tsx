import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentUploadProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function DocumentUpload({ onFileSelected, disabled }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }
    setError(null);
    onFileSelected(file);
  };

  const stop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      stop(e);
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) accept(f);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl mx-auto">
      <label
        onDragEnter={(e) => { stop(e); setIsDragging(true); }}
        onDragLeave={(e) => { stop(e); setIsDragging(false); }}
        onDragOver={stop}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${isDragging ? 'border-primary bg-primary/10 glow-primary' : 'border-border hover:border-primary/50 hover:bg-secondary/50'}`}
      >
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) accept(f);
          }}
          className="hidden"
        />
        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div key="d" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex flex-col items-center">
              <FileText className="h-16 w-16 text-primary mb-4" />
              <p className="text-lg font-semibold text-primary">Drop your PDF here</p>
            </motion.div>
          ) : (
            <motion.div key="i" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-base font-medium text-foreground mb-1">Upload a scanned Sale Deed</p>
              <p className="text-sm text-muted-foreground">PDF only — full document is processed</p>
            </motion.div>
          )}
        </AnimatePresence>
      </label>
      {error && <p className="mt-3 text-sm text-destructive text-center">{error}</p>}
    </motion.div>
  );
}
