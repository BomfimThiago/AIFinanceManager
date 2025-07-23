import React, { useState } from 'react';
import { Upload as UploadIcon, FileText, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { UploadedFile, UploadHistory } from '../../types';
import { useUploadHistoryQuery, useDeleteUploadHistoryMutation } from '../../hooks/queries';
import { useCurrency } from '../../contexts/CurrencyContext';
import ConfirmationModal from '../ui/ConfirmationModal';

interface UploadProps {
  uploadedFiles: UploadedFile[];
  dragActive: boolean;
  isProcessing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDrag: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
  hideAmounts: boolean;
}

const Upload: React.FC<UploadProps> = ({ 
  uploadedFiles, 
  dragActive, 
  isProcessing, 
  fileInputRef, 
  handleDrag, 
  handleDrop, 
  handleFileInput, 
  triggerFileInput,
  hideAmounts 
}) => {
  const { formatAmount: formatCurrencyAmount, convertAmount, selectedCurrency } = useCurrency();
  const { data: uploadHistory = [] } = useUploadHistoryQuery();
  const deleteUploadMutation = useDeleteUploadHistoryMutation();
  const [uploadToDelete, setUploadToDelete] = useState<UploadHistory | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusIcon = (status: UploadHistory['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDeleteClick = (upload: UploadHistory) => {
    setUploadToDelete(upload);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!uploadToDelete) return;

    deleteUploadMutation.mutate(uploadToDelete.id, {
      onSuccess: () => {
        setIsConfirmModalOpen(false);
        setUploadToDelete(null);
      },
      onError: () => {
        setIsConfirmModalOpen(false);
        setUploadToDelete(null);
      },
    });
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setUploadToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Receipts & Documents</h2>
        <p className="text-gray-600">AI will automatically extract expense data from your files</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <UploadIcon className="h-8 w-8 text-white" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Drop files here</h3>
            <p className="text-gray-500">or click to select files</p>
          </div>
          
          <button
            onClick={triggerFileInput}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Choose Files
          </button>
          
          <p className="text-sm text-gray-500">
            Supports PDF receipts and images (JPG, PNG)
          </p>
        </div>
      </div>

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">Processing files with AI...</span>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processed Files</h3>
          <div className="space-y-3">
            {uploadedFiles.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{item.file.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.status === 'processing' && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  {item.status === 'completed' && item.expense && (
                    <div className="text-sm text-green-600 font-medium">
                      {(() => {
                        if (hideAmounts) return '*** - ' + item.expense.category;
                        
                        // Convert amount to selected currency
                        const convertedAmount = item.expense.amounts && item.expense.amounts[selectedCurrency] 
                          ? item.expense.amounts[selectedCurrency]
                          : convertAmount(item.expense.amount, item.expense.original_currency || 'EUR');
                        
                        return `${formatCurrencyAmount(convertedAmount)} - ${item.expense.category}`;
                      })()} 
                    </div>
                  )}
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    item.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload History Section */}
      {uploadHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload History</h3>
          <div className="space-y-3">
            {uploadHistory.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{upload.filename}</div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(upload.file_size)} • {formatDate(upload.upload_date)}
                    </div>
                    {upload.error_message && (
                      <div className="text-xs text-red-600 mt-1">{upload.error_message}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(upload.status)}
                    <span className={`text-xs font-medium capitalize ${
                      upload.status === 'success' ? 'text-green-600' :
                      upload.status === 'failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {upload.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(upload)}
                    disabled={deleteUploadMutation.isPending}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Delete upload history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Upload History"
        message={`Are you sure you want to delete the upload history for "${uploadToDelete?.filename}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteUploadMutation.isPending}
      />
    </div>
  );
};

export default Upload;