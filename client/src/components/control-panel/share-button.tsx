import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  timelineId: number;
  disabled?: boolean;
}

export function ShareButton({ timelineId, disabled }: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/timelines/${timelineId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
    } catch (error) {
      toast.error('Failed to generate share link');
      console.error('Error sharing timeline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Share link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy share link');
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={disabled || isLoading}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Timeline
      </Button>
      
      {shareUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
} 