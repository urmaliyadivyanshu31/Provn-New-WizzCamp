import React, { useState } from "react";
import { toast } from "sonner";
import { Header, Description } from "../src/components/shared";
import { Button } from "./Button";
import Section from "./Section";
import FileUpload from "./FileUpload";

interface FileUploadSectionProps {
  setSectionIndex: (index: number) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  setSectionIndex,
  uploadedFile,
  setUploadedFile,
}) => {
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    
    toast.success(`File uploaded: ${file.name}`, {
      description: `Size: ${(file.size / 1024).toFixed(1)} KB`,
    });
  };

  const handleContinue = () => {
    if (uploadedFile) {
      // Here you can add logic to process the uploaded file
      toast.success("File processed successfully!", {
        description: "Your file has been uploaded and is ready for processing.",
      });
      setSectionIndex(2); // Move to next section
    } else {
      toast.error("Please upload a file first", {
        description: "You need to select a file before continuing.",
      });
    }
  };

  const handleBack = () => {
    setSectionIndex(0); // Go back to welcome section
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return '🖼️';
      case 'txt':
      case 'md':
      case 'json':
        return '📄';
      case 'mp3':
      case 'wav':
      case 'm4a':
      case 'aac':
        return '🎵';
      case 'mp4':
      case 'mov':
      case 'avi':
        return '🎬';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Section className="max-w-lg">
      <Header text="Upload Your File" label="Step 2" />
      <Description text="Upload an image, text file, audio recording, or video to get started." />
      
      <div className="w-full">
        <FileUpload
          onFileSelect={handleFileSelect}
          selectedFile={uploadedFile}
        />
      </div>

      {/* File Preview Section */}
      {uploadedFile && (
        <div className="w-full mt-4">
          <div className="text-sm font-semibold text-gray-900 mb-3 text-center">
            File Preview
          </div>
          
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            {filePreview && uploadedFile.type.startsWith('image/') ? (
              // Image Preview
              <div className="flex flex-col items-center gap-3">
                <img 
                  src={filePreview} 
                  alt={uploadedFile.name}
                  className="max-w-full max-h-64 object-contain rounded-lg shadow-sm"
                />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                  </p>
                </div>
              </div>
            ) : (
              // Non-image file preview
              <div className="flex flex-col items-center gap-3">
                <div className="text-4xl">
                  {getFileTypeIcon(uploadedFile.name)}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                  </p>
                  {uploadedFile.type.startsWith('audio/') && (
                    <audio 
                      controls 
                      className="mt-2 w-full max-w-xs"
                      src={URL.createObjectURL(uploadedFile)}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  {uploadedFile.type.startsWith('video/') && (
                    <video 
                      controls 
                      className="mt-2 w-full max-w-xs rounded"
                      src={URL.createObjectURL(uploadedFile)}
                    >
                      Your browser does not support the video element.
                    </video>
                  )}
                  {uploadedFile.type.includes('text') && (
                    <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border max-h-32 overflow-y-auto">
                      <p>Text file uploaded successfully</p>
                      <p>File type: {uploadedFile.type}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex gap-2 w-full justify-between">
        <Button
          onClick={handleBack}
          text="Back"
          className="w-1/3"
          justifyContent="center"
          arrow="left"
        />
        <Button
          onClick={handleContinue}
          text="Continue"
          className="w-1/3"
          justifyContent="center"
          arrow="right"
          disabled={!uploadedFile}
        />
      </div>
    </Section>
  );
};

export default FileUploadSection; 