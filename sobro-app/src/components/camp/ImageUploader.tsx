import React, { useState, useRef } from "react";
import { useAuth, useAuthState } from "@campnetwork/origin/react";
import { useCampfireIntegration } from "@/hooks/useCampfireIntegration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadedMemory {
  id: string;
  file: File;
  title: string;
  description: string;
  preview: string;
  minted: boolean;
  mintedAt?: Date;
}

interface LicenseTerms {
  price: string;
  duration: string;
  royalty: string;
  paymentToken: string;
}

interface IPMetadata {
  name: string;
  description: string;
  mimeType?: string;
  size?: number;
}

export default function ImageUploader() {
  const { authenticated } = useAuthState();
  const { origin, jwt } = useAuth();
  const {
    mintIPWithOrigin,
    loading,
    clearError,
    clearSuccess 
  } = useCampfireIntegration();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const metadata: IPMetadata = {
    name: '',
    description: '',
  };
  const license: LicenseTerms = {
    price: '0',
    duration: '2629800',
    royalty: '0',
    paymentToken: '0x0000000000000000000000000000000000000000',
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use hook states when available
  const finalLoading = loading;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select a valid image file");
    }
  };

  const handleMint = async () => {
    if (!selectedFile || !title.trim()) {
      return
    }
    if (!authenticated || !origin || !jwt) {
      return;
    }

    // Clear previous messages
 
    clearError()
    clearSuccess()

    try {
      const updatedMetadata = {
        ...metadata,
        name: title,
        description: description || `A unique memory created by SoBro App`,
        mimeType: selectedFile.type,
        size: selectedFile.size,
      };

      const tokenId = await mintIPWithOrigin(
        selectedFile,
        updatedMetadata,
        license,
        ''
      )

      if (tokenId) {
        
        // Store in localStorage for memories display
        const memories = JSON.parse(localStorage.getItem('sobro-memories') || '[]');
        const newMemory: UploadedMemory = {
          id: Date.now().toString(),
          file: selectedFile,
          title,
          description,
          preview,
          minted: true,
          mintedAt: new Date()
        };
        
        memories.push(newMemory);
        localStorage.setItem('sobro-memories', JSON.stringify(memories));

        toast.success("Memory minted successfully as IP-NFT!");
        
        // Reset form
        setSelectedFile(null);
        setPreview("");
        setTitle("");
        setDescription("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err) {
      console.error('Minting error:', err)
      toast.error('Failed to mint memory. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Upload Your Memory
        </CardTitle>
        <CardDescription>
          Upload an image and mint it as an IP-NFT to preserve your memories forever on the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select Image</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your memory a title..."
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell the story behind this memory..."
            rows={3}
          />
        </div>

        {/* Mint Button */}
        <Button
          onClick={handleMint}
          disabled={!selectedFile || !title.trim() || finalLoading || !authenticated}
          className="w-full"
          size="lg"
        >
          {finalLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Minting Memory...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Mint as IP-NFT
            </>
          )}
        </Button>

        {!authenticated && (
          <p className="text-sm text-muted-foreground text-center">
            Connect your wallet to mint memories
          </p>
        )}

        {authenticated && (
          <p className="text-sm text-green-600 dark:text-green-400 text-center">
            ✅ Ready to mint!
          </p>
        )}
      </CardContent>
    </Card>
  );
}