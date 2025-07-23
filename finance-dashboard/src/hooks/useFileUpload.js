import { useState, useRef, useCallback } from 'react';
import { processFileWithAI } from '../services/aiService';

export const useFileUpload = ({ onExpenseAdded, onBudgetUpdate }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(async (file) => {
    setIsProcessing(true);
    try {
      setUploadedFiles(prev => [...prev, { file, status: 'processing' }]);
      const processedExpense = await processFileWithAI(file);
      
      if (processedExpense) {
        onExpenseAdded(processedExpense);
        if (onBudgetUpdate && processedExpense.category) {
          onBudgetUpdate(processedExpense.category, processedExpense.amount);
        }
      }
      
      setUploadedFiles(prev => 
        prev.map(f => f.file === file ? { ...f, status: 'completed', expense: processedExpense } : f)
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

  const handleDrop = useCallback(async (e) => {
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

  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        await processFile(file);
      }
    }
  };

  const triggerFileInput = () => {
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