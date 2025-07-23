import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { processFileWithAI } from '../services/apiService';
import { UploadedFile, Expense } from '../types';

interface UseFileUploadProps {
  onExpenseAdded: (expense: Expense) => Promise<void>;
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
      const processedExpense = await processFileWithAI(file);
      
      if (processedExpense) {
        await onExpenseAdded(processedExpense);
        if (onBudgetUpdate && processedExpense.category) {
          await onBudgetUpdate(processedExpense.category, processedExpense.amount);
        }
      }
      
      setUploadedFiles(prev => 
        prev.map(f => f.file === file ? { ...f, status: 'completed', expense: processedExpense || undefined } : f)
      );
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadedFiles(prev => 
        prev.map(f => f.file === file ? { ...f, status: 'error' } : f)
      );
    } finally {
      setIsProcessing(false);
    }
  }, [onExpenseAdded, onBudgetUpdate]);

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