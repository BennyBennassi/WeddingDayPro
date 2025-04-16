import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportOptionsProps {
  handleExportPdf: () => void;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ handleExportPdf }) => {
  const { toast } = useToast();

  const handleShare = () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: "My Wedding Timeline",
        text: "Check out my wedding day timeline planning!",
        url: shareUrl,
      }).catch((error) => {
        console.log("Error sharing:", error);
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Link Copied!",
          description: "Share link has been copied to clipboard.",
        });
      },
      (err) => {
        console.error("Failed to copy:", err);
        toast({
          title: "Failed to copy",
          description: "Could not copy the link to clipboard.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div>
      <h3 className="text-md font-medium text-gray-700 mb-4">Export Options</h3>
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="bg-secondary hover:bg-secondary-dark text-white py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
          onClick={handleExportPdf}
        >
          <Download className="h-4 w-4 mr-1" />
          PDF
        </Button>
        <Button
          className="bg-secondary hover:bg-secondary-dark text-white py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
          onClick={handleShare}
        >
          <Share className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default ExportOptions;
