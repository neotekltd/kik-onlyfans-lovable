import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Camera, 
  Video, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  MessageSquare,
  Upload,
  Calendar,
  User,
  Star,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Play
} from 'lucide-react';

interface CustomRequest {
  id: string;
  fan_id: string;
  creator_id: string;
  fan_username: string;
  creator_username: string;
  title: string;
  description: string;
  content_type: 'photo' | 'video' | 'both';
  price: number;
  deadline: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'expired';
  is_anonymous: boolean;
  special_instructions: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  delivered_content?: string[];
  payment_status: 'pending' | 'paid' | 'refunded';
  rating?: number;
  feedback?: string;
}

interface RequestFormData {
  title: string;
  description: string;
  content_type: 'photo' | 'video' | 'both';
  price: number;
  deadline: string;
  is_anonymous: boolean;
  special_instructions: string;
}

// Create Custom Request Form
const CreateRequestForm: React.FC<{ 
  creatorId: string; 
  creatorUsername: string;
  onSuccess: () => void;
}> = ({ creatorId, creatorUsername, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<RequestFormData>({
    title: '',
    description: '',
    content_type: 'photo',
    price: 25,
    deadline: '',
    is_anonymous: false,
    special_instructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const response = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fan_id: user.id,
          creator_id: creatorId
        })
      });

      if (response.ok) {
        toast.success('Custom request sent successfully!');
        setOpen(false);
        setFormData({
          title: '',
          description: '',
          content_type: 'photo',
          price: 25,
          deadline: '',
          is_anonymous: false,
          special_instructions: ''
        });
        onSuccess();
      } else {
        throw new Error('Failed to create request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days max
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#00aff0] hover:bg-[#0095cc] text-white">
          <Camera className="h-4 w-4 mr-2" />
          Request Custom Content
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1e2029] border-[#2c2e36] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Custom Content from {creatorUsername}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Title */}
          <div>
            <Label>Request Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Beach photoshoot in red bikini"
              className="bg-[#252836] border-[#2c2e36] text-white mt-2"
              required
              maxLength={100}
            />
          </div>

          {/* Content Type */}
          <div>
            <Label>Content Type</Label>
            <Select value={formData.content_type} onValueChange={(value: 'photo' | 'video' | 'both') => 
              setFormData({ ...formData, content_type: value })
            }>
              <SelectTrigger className="bg-[#252836] border-[#2c2e36] text-white mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">
                  <div className="flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Photos Only
                  </div>
                </SelectItem>
                <SelectItem value="video">
                  <div className="flex items-center">
                    <Video className="h-4 w-4 mr-2" />
                    Videos Only
                  </div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    Photos & Videos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label>Detailed Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe exactly what you'd like to see. Be specific about poses, outfits, locations, etc."
              className="bg-[#252836] border-[#2c2e36] text-white mt-2 min-h-[100px]"
              required
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Special Instructions */}
          <div>
            <Label>Special Instructions (Optional)</Label>
            <Textarea
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              placeholder="Any special requests, props needed, specific angles, etc."
              className="bg-[#252836] border-[#2c2e36] text-white mt-2"
              maxLength={300}
            />
          </div>

          {/* Price and Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Your Offer ($)</Label>
              <Input
                type="number"
                min="5"
                max="1000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="bg-[#252836] border-[#2c2e36] text-white mt-2"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Minimum $5</p>
            </div>
            
            <div>
              <Label>Deadline</Label>
              <Input
                type="date"
                min={getMinDate()}
                max={getMaxDate()}
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="bg-[#252836] border-[#2c2e36] text-white mt-2"
                required
              />
            </div>
          </div>

          {/* Anonymous Request */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="anonymous">Send as anonymous request</Label>
          </div>

          {/* Payment Summary */}
          <div className="bg-[#252836] p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Content Price:</span>
                <span>${formData.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform Fee (5%):</span>
                <span>${(formData.price * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Processing Fee:</span>
                <span>${(formData.price * 0.029 + 0.30).toFixed(2)}</span>
              </div>
              <Separator className="bg-[#2c2e36]" />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>${(formData.price + formData.price * 0.05 + formData.price * 0.029 + 0.30).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-[#1e2029] p-4 rounded-lg border border-[#2c2e36]">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Payment will be held until content is delivered</p>
                <p>• Creator has 24 hours to accept/decline your request</p>
                <p>• Full refund if request is declined or not completed by deadline</p>
                <p>• Content will be delivered through private messages</p>
                <p>• All content is exclusive and personalized for you</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#00aff0] hover:bg-[#0095cc]"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Send Request (${(formData.price + formData.price * 0.05 + formData.price * 0.029 + 0.30).toFixed(2)})
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Request Management for Creators
const CreatorRequestManager: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'in_progress' | 'completed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/custom-requests/creator/${user.id}`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch(`/api/custom-requests/${requestId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success(`Request ${action}ed successfully`);
        fetchRequests();
      } else {
        throw new Error(`Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      toast.error(`Failed to ${action} request`);
    }
  };

  const handleFileUpload = async (requestId: string) => {
    if (deliveryFiles.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      deliveryFiles.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      formData.append('requestId', requestId);

      const response = await fetch('/api/custom-requests/deliver', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success('Content delivered successfully!');
        setDeliveryFiles([]);
        setSelectedRequest(null);
        fetchRequests();
      } else {
        throw new Error('Failed to deliver content');
      }
    } catch (error) {
      console.error('Error delivering content:', error);
      toast.error('Failed to deliver content');
    } finally {
      setUploading(false);
    }
  };

  const filteredRequests = requests.filter(request => 
    filter === 'all' || request.status === filter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-blue-400" />;
      case 'in_progress': return <Upload className="h-4 w-4 text-purple-400" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'declined': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600';
      case 'accepted': return 'bg-blue-600';
      case 'in_progress': return 'bg-purple-600';
      case 'completed': return 'bg-green-600';
      case 'declined': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00aff0]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Custom Content Requests</h2>
        <Badge variant="outline">
          {requests.filter(r => r.status === 'pending').length} pending
        </Badge>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {['all', 'pending', 'accepted', 'in_progress', 'completed'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status as any)}
            className={filter === status ? "bg-[#00aff0]" : ""}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            <Badge variant="secondary" className="ml-2">
              {status === 'all' ? requests.length : requests.filter(r => r.status === status).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="bg-[#1e2029] border-[#2c2e36]">
          <CardContent className="p-8 text-center">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Custom Requests</h3>
            <p className="text-gray-400">You don't have any custom content requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="bg-[#1e2029] border-[#2c2e36]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge variant="outline">
                        {request.content_type === 'both' ? 'Photos & Videos' : 
                         request.content_type === 'photo' ? 'Photos' : 'Videos'}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {request.is_anonymous ? 'Anonymous' : `From @${request.fan_username}`}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{request.title}</h3>
                    <p className="text-gray-300 mb-3">{request.description}</p>
                    
                    {request.special_instructions && (
                      <div className="bg-[#252836] p-3 rounded mb-3">
                        <p className="text-sm">
                          <strong>Special Instructions:</strong> {request.special_instructions}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${request.price}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {new Date(request.deadline).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleRequestAction(request.id, 'accept')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestAction(request.id, 'decline')}
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}
                    
                    {(request.status === 'accepted' || request.status === 'in_progress') && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                        className="bg-[#00aff0] hover:bg-[#0095cc]"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Deliver Content
                      </Button>
                    )}
                    
                    {request.status === 'completed' && request.rating && (
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < request.rating! ? 'text-yellow-400 fill-current' : 'text-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content Delivery Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="bg-[#1e2029] border-[#2c2e36] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Deliver Content for "{selectedRequest.title}"</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-[#252836] p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Request Details</h3>
                <p className="text-sm text-gray-300 mb-2">{selectedRequest.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Type: {selectedRequest.content_type}</span>
                  <span>Price: ${selectedRequest.price}</span>
                  <span>Due: {new Date(selectedRequest.deadline).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div>
                <Label>Upload Content Files</Label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => setDeliveryFiles(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-gray-400 mt-2
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#00aff0] file:text-white
                    hover:file:bg-[#0095cc]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Upload the custom content files. Max 10 files, 100MB each.
                </p>
              </div>
              
              {deliveryFiles.length > 0 && (
                <div className="bg-[#252836] p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Files to Upload ({deliveryFiles.length})</h4>
                  <div className="space-y-1">
                    {deliveryFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        {file.type.startsWith('image/') ? 
                          <ImageIcon className="h-4 w-4" /> : 
                          <Video className="h-4 w-4" />
                        }
                        <span>{file.name}</span>
                        <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleFileUpload(selectedRequest.id)}
                  disabled={deliveryFiles.length === 0 || uploading}
                  className="flex-1 bg-[#00aff0] hover:bg-[#0095cc]"
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Deliver Content
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Fan Request History
const FanRequestHistory: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/custom-requests/fan/${user.id}`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00aff0]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Custom Requests</h2>
      
      {requests.length === 0 ? (
        <Card className="bg-[#1e2029] border-[#2c2e36]">
          <CardContent className="p-8 text-center">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Custom Requests</h3>
            <p className="text-gray-400">You haven't made any custom content requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="bg-[#1e2029] border-[#2c2e36]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge className={`bg-${request.status === 'completed' ? 'green' : request.status === 'pending' ? 'yellow' : 'blue'}-600`}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        To @{request.creator_username}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{request.title}</h3>
                    <p className="text-gray-300 mb-3">{request.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>${request.price}</span>
                      <span>Due: {new Date(request.deadline).toLocaleDateString()}</span>
                      <span>Requested: {new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {request.status === 'completed' && request.delivered_content && (
                    <Button size="sm" className="bg-[#00aff0]">
                      <Eye className="h-4 w-4 mr-1" />
                      View Content
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export { CreateRequestForm, CreatorRequestManager, FanRequestHistory };
export default CreateRequestForm;