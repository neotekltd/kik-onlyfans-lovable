
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Flag,
  Shield,
  Image,
  Video,
  MessageCircle
} from 'lucide-react';

interface ContentReport {
  id: string;
  content_type: 'post' | 'message' | 'profile';
  reported_content_id: string;
  reporter: {
    username: string;
    display_name: string;
  };
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  content_preview: {
    title?: string;
    description?: string;
    media_url?: string;
    creator_name: string;
  };
}

const ContentModerationPanel: React.FC = () => {
  const [reports, setReports] = useState<ContentReport[]>([]);

  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [moderationNote, setModerationNote] = useState('');

  const pendingReports = reports.filter(r => r.status === 'pending');
  const reviewedReports = reports.filter(r => r.status !== 'pending');

  const handleModeration = (reportId: string, action: 'approve' | 'reject') => {
    setReports(reports.map(report => 
      report.id === reportId 
        ? { ...report, status: action === 'approve' ? 'approved' : 'rejected' }
        : report
    ));
    setSelectedReport(null);
    setModerationNote('');
  };

  const getReasonBadge = (reason: string) => {
    const reasonMap = {
      'inappropriate_content': { label: 'Inappropriate', color: 'destructive' },
      'spam': { label: 'Spam', color: 'secondary' },
      'harassment': { label: 'Harassment', color: 'destructive' },
      'copyright': { label: 'Copyright', color: 'default' },
      'other': { label: 'Other', color: 'outline' }
    };
    
    const config = reasonMap[reason as keyof typeof reasonMap] || reasonMap.other;
    return <Badge variant={config.color as any}>{config.label}</Badge>;
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <Image className="h-4 w-4" />;
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Moderation</h2>
          <p className="text-gray-600">Review and moderate reported content</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium">{pendingReports.length} pending reports</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Pending ({pendingReports.length})</span>
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Reviewed ({reviewedReports.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No pending reports to review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reports List */}
              <div className="space-y-4">
                {pendingReports.map((report) => (
                  <Card 
                    key={report.id}
                    className={`cursor-pointer transition-all ${
                      selectedReport?.id === report.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getContentIcon(report.content_type)}
                          <span className="font-medium capitalize">{report.content_type}</span>
                          {getReasonBadge(report.reason)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-gray-900 font-medium">
                          {report.content_preview.title || 'Untitled Content'}
                        </p>
                        <p className="text-xs text-gray-600">
                          By {report.content_preview.creator_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Reported by {report.reporter.display_name}
                        </p>
                        {report.description && (
                          <p className="text-xs text-gray-600 italic">
                            "{report.description}"
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Report Detail */}
              <div>
                {selectedReport ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Flag className="h-5 w-5" />
                        <span>Report Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Content Information</h4>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Type:</span> {selectedReport.content_type}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Creator:</span> {selectedReport.content_preview.creator_name}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Title:</span> {selectedReport.content_preview.title || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Report Information</h4>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Reported by:</span> {selectedReport.reporter.display_name}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Reason:</span> {getReasonBadge(selectedReport.reason)}
                          </p>
                          {selectedReport.description && (
                            <div>
                              <span className="font-medium text-sm">Description:</span>
                              <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                                {selectedReport.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Moderation Note</h4>
                        <Textarea
                          placeholder="Add your moderation notes here..."
                          value={moderationNote}
                          onChange={(e) => setModerationNote(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          onClick={() => handleModeration(selectedReport.id, 'approve')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Content
                        </Button>
                        <Button
                          onClick={() => handleModeration(selectedReport.id, 'reject')}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Remove Content
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Select a report to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getContentIcon(report.content_type)}
                    <div>
                      <p className="font-medium">{report.content_preview.title || 'Untitled Content'}</p>
                      <p className="text-sm text-gray-600">
                        By {report.content_preview.creator_name} • Reported by {report.reporter.display_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getReasonBadge(report.reason)}
                    <Badge variant={report.status === 'approved' ? 'default' : 'destructive'}>
                      {report.status === 'approved' ? 'Approved' : 'Removed'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentModerationPanel;
