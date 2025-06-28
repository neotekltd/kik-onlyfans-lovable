
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TipModalProps {
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  children: React.ReactNode;
  onTipSent?: (amount: number, message?: string) => void;
}

const TipModal: React.FC<TipModalProps> = ({ creator, children, onTipSent }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const presetAmounts = [5, 10, 25, 50, 100];

  const handleSendTip = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSending(true);
    try {
      // Here you would integrate with your payment processor
      // For now, we'll simulate the tip sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onTipSent) {
        onTipSent(parseFloat(amount), message);
      }
      
      setAmount('');
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending tip:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <span>Send Tip</span>
          </DialogTitle>
          <DialogDescription>
            Show your appreciation with a tip
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Creator Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={creator.avatar_url} />
              <AvatarFallback>{creator.display_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-gray-900">{creator.display_name}</h4>
              <p className="text-sm text-gray-500">@{creator.username}</p>
            </div>
          </div>

          {/* Preset Amounts */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Quick amounts
            </label>
            <div className="grid grid-cols-5 gap-2">
              {presetAmounts.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  variant={amount === presetAmount.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(presetAmount.toString())}
                  className="text-xs"
                >
                  ${presetAmount}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Custom amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min="1"
                step="0.01"
              />
            </div>
          </div>

          {/* Optional Message */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Add a message (optional)
            </label>
            <Textarea
              placeholder="Say something nice..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/200 characters
            </p>
          </div>

          {/* Send Button */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-pink-600 hover:bg-pink-700"
              onClick={handleSendTip}
              disabled={!amount || parseFloat(amount) <= 0 || isSending}
            >
              {isSending ? 'Sending...' : `Send $${amount || '0'} Tip`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipModal;
