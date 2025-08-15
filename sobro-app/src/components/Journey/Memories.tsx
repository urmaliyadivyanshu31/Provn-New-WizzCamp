import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Image as ImageIcon, ExternalLink, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "@campnetwork/origin/react";
import Sidebar from "../grants/sidebar";

interface UploadedMemory {
  id: string;
  title: string;
  description: string;
  preview: string;
  minted: boolean;
  mintedAt?: string;
  file?: {
    name: string;
    type: string;
  };
}

export default function Memories() {
  const [memories, setMemories] = useState<UploadedMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { authenticated } = useAuthState();

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = () => {
    try {
      const storedMemories = localStorage.getItem('sobro-memories');
      if (storedMemories) {
        const parsedMemories = JSON.parse(storedMemories);
        setMemories(parsedMemories);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleUploadClick = () => {
    // Always redirect to upload page - it will handle authentication there
    navigate('/upload-memories');
  };

  const isFullyConnected = authenticated;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
<div className="flex min-h-screen bg-background">
    <Sidebar />

    <div className="min-h-screen bg-background p-6">
            
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Memories</h1>
            <p className="text-muted-foreground">
              {memories.length === 0 
                ? "No memories yet. Start by uploading your first image!"
                : `${memories.length} ${memories.length === 1 ? 'memory' : 'memories'} preserved as IP-NFTs`
              }
            </p>
          </div>
          <Button onClick={handleUploadClick} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {isFullyConnected ? 'Upload New Memory' : 'Connect to Upload'}
          </Button>
        </div>

        {/* Empty State */}
        {memories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No memories yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upload your first image to start building your digital memory vault. Each image will be minted as an IP-NFT on the blockchain.
            </p>
            <Button onClick={handleUploadClick} size="lg" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {isFullyConnected ? 'Get Started' : 'Connect to Get Started'}
            </Button>
          </div>
        ) : (
          /* Memories Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <Card key={memory.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image Preview */}
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={memory.preview}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                  />
                  {memory.minted && (
                    <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
                      Minted
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">{memory.title}</CardTitle>
                  {memory.description && (
                    <CardDescription className="line-clamp-2">
                      {memory.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Mint Date */}
                    {memory.mintedAt && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Minted on {formatDate(memory.mintedAt)}
                      </div>
                    )}

                    {/* File Info */}
                    {memory.file && (
                      <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div className="font-medium truncate">{memory.file.name}</div>
                        <div className="uppercase">{memory.file.type}</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(memory.preview, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Full
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistics */}
        {memories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{memories.length}</div>
              <div className="text-sm text-muted-foreground">Total Memories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {memories.filter(m => m.minted).length}
              </div>
              <div className="text-sm text-muted-foreground">Minted as NFTs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(memories.map(m => m.mintedAt ? new Date(m.mintedAt).toDateString() : '')).size}
              </div>
              <div className="text-sm text-muted-foreground">Upload Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-sm text-muted-foreground">Forever Preserved</div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
    </>
  );
}