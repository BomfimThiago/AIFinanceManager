import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { useUploadExpenseFile } from './queries';
import { UploadedFile, Expense } from '../types';

interface UseFileUploadProps {
  onExpenseAdded: (expenses: Expense[]) => Promise<void>;
  onBudgetUpdate?: (category: string, amount: number) => Promise<void>;
}

interface UseFileUploadReturn {
  uploadedFiles: UploadedFile[];
  dragActive: boolean;
  isProcessing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDrag: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  handleFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
}

export const useFileUpload = ({ onExpenseAdded, onBudgetUpdate }: UseFileUploadProps): UseFileUploadReturn => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadFileMutation = useUploadExpenseFile();

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(async (file: File): Promise<void> => {
    setIsProcessing(true);
    try {
      setUploadedFiles(prev => [...prev, { file, status: 'processing' }]);
      const processedExpenses = await uploadFileMutation.mutateAsync(file);
      
      // Note: uploadFileMutation already creates expenses in the database via /api/expenses/upload
      // So we don't need to call onExpenseAdded which would create duplicates via /api/expenses/bulk
      
      if (processedExpenses && processedExpenses.length > 0 && onBudgetUpdate) {
        // Only update budgets, don't create expenses again
        for (const expense of processedExpenses) {
          if (expense.category) {
            await onBudgetUpdate(expense.category, expense.amount);
          }
        }
      }
      
      setUploadedFiles(prev => 
        prev.map(f => f.file === file ? { ...f, status: 'completed', expenses: processedExpenses || undefined } : f)
      );
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadedFiles(prev => 
        prev.map(f => f.file === file ? { ...f, status: 'error' } : f)
      );
    } finally {
      setIsProcessing(false);
    }
  }, [onExpenseAdded, onBudgetUpdate, uploadFileMutation]);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          await processFile(file);
        }
      }
    }
  }, [processFile]);

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        await processFile(file);
      }
    }
  };

  const triggerFileInput = (): void => {
    fileInputRef.current?.click();
  };

  return {
    uploadedFiles,
    dragActive,
    isProcessing,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileInput,
    triggerFileInput
  };
};