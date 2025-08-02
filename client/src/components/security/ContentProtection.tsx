import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Download, 
  Lock, 
  Unlock,
  AlertTriangle,
  CheckCircle,
  Camera,
  Monitor,
  Smartphone
} from 'lucide-react';

interface ProtectedContentProps {
  src: string;
  type: 'image' | 'video' | 'audio';
  contentId: string;
  creatorId: string;
  isSubscribed: boolean;
  isPPV?: boolean;
  ppvPrice?: number;
  watermarkText?: string;
  allowScreenshots?: boolean;
  allowDownload?: boolean;
  onUnauthorizedAccess?: () => void;
  onScreenshotAttempt?: () => void;
}

interface WatermarkOptions {
  text: string;
  opacity: number;
  fontSize: number;
  color: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  rotation: number;
  repeat: boolean;
}

// Main Protected Content Component
const ProtectedContent: React.FC<ProtectedContentProps> = ({
  src,
  type,
  contentId,
  creatorId,
  isSubscribed,
  isPPV = false,
  ppvPrice = 0,
  watermarkText,
  allowScreenshots = false,
  allowDownload = false,
  onUnauthorizedAccess,
  onScreenshotAttempt
}) => {
  const { user } = useAuth();
  const contentRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isBlurred, setIsBlurred] = useState(!isSubscribed || isPPV);
  const [hasAccess, setHasAccess] = useState(false);
  const [protectionViolations, setProtectionViolations] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    checkAccess();
    setupContentProtection();
    detectDevice();
    
    return () => {
      cleanupProtection();
    };
  }, []);

  const checkAccess = async () => {
    if (!user || !isSubscribed) {
      setHasAccess(false);
      return;
    }

    try {
      const response = await fetch(`/api/content/${contentId}/access`, {
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      const data = await response.json();
      setHasAccess(data.hasAccess);
      setIsBlurred(!data.hasAccess);
    } catch (error) {
      console.error('Error checking content access:', error);
      setHasAccess(false);
    }
  };

  const setupContentProtection = () => {
    if (!allowScreenshots) {
      setupScreenshotProtection();
    }
    
    setupRightClickProtection();
    setupKeyboardProtection();
    setupDevToolsProtection();
    setupVisibilityProtection();
  };

  const setupScreenshotProtection = () => {
    // Detect screenshot attempts (limited browser support)
    document.addEventListener('keydown', handleKeyDown);
    
    // Monitor for suspicious activity
    let screenshotAttempts = 0;
    const monitorScreenshots = () => {
      // Check for rapid keystrokes that might indicate screenshot tools
      const suspiciousKeys = ['PrintScreen', 'F12', 'F5'];
      document.addEventListener('keydown', (e) => {
        if (suspiciousKeys.includes(e.key)) {
          screenshotAttempts++;
          if (screenshotAttempts > 3) {
            handleSecurityViolation('Multiple screenshot attempts detected');
          }
        }
      });
    };

    monitorScreenshots();
  };

  const setupRightClickProtection = () => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleSecurityViolation('Right-click disabled for content protection');
      return false;
    };

    if (contentRef.current) {
      contentRef.current.addEventListener('contextmenu', handleContextMenu);
    }
  };

  const setupKeyboardProtection = () => {
    const protectedKeys = [
      'F12', // Developer tools
      'F5',  // Refresh
      'PrintScreen', // Screenshot
      'S',   // Save (when Ctrl+S)
      'A',   // Select all (when Ctrl+A)
      'C',   // Copy (when Ctrl+C)
      'P',   // Print (when Ctrl+P)
      'U'    // View source (when Ctrl+U)
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      if (protectedKeys.includes(e.key) || 
          (isCtrlOrCmd && ['s', 'a', 'c', 'p', 'u'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        e.stopPropagation();
        handleSecurityViolation(`Keyboard shortcut ${e.key} disabled for content protection`);
        return false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
  };

  const setupDevToolsProtection = () => {
    // Monitor for developer tools opening
    let devtools = { open: false };
    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          handleSecurityViolation('Developer tools detected');
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Detect console usage
    const originalConsole = { ...console };
    const consoleKeys = ['log', 'warn', 'error', 'info', 'debug'] as const;
    consoleKeys.forEach(key => {
      if (typeof console[key] === 'function') {
        console[key] = (...args: any[]) => {
          handleSecurityViolation('Console usage detected');
          return (originalConsole[key] as any)(...args);
        };
      }
    });
  };

  const setupVisibilityProtection = () => {
    // Hide content when tab is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else if (hasAccess) {
        setIsBlurred(false);
      }
    });

    // Hide content when window loses focus
    window.addEventListener('blur', () => setIsBlurred(true));
    window.addEventListener('focus', () => {
      if (hasAccess) setIsBlurred(false);
    });
  };

  const detectDevice = () => {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isAndroid: /Android/.test(navigator.userAgent),
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };

    setDeviceInfo(deviceInfo);
    
    // Log device access for security monitoring
    logDeviceAccess(deviceInfo);
  };

  const logDeviceAccess = async (deviceInfo: any) => {
    try {
      await fetch('/api/security/device-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          contentId,
          creatorId,
          deviceInfo,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging device access:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Detect screenshot attempts
    if (e.key === 'PrintScreen' || 
        (e.metaKey && e.shiftKey && e.key === '4') || // Mac screenshot
        (e.ctrlKey && e.shiftKey && e.key === 'S')) { // Windows snipping tool
      
      handleSecurityViolation('Screenshot attempt detected');
      onScreenshotAttempt?.();
    }
  };

  const handleSecurityViolation = (violation: string) => {
    setProtectionViolations(prev => prev + 1);
    
    // Log security violation
    fetch('/api/security/violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id,
        contentId,
        creatorId,
        violation,
        timestamp: new Date().toISOString(),
        deviceInfo
      })
    });

    // Show warning to user
    if (protectionViolations > 2) {
      alert('Multiple security violations detected. Content access may be revoked.');
      setIsBlurred(true);
      onUnauthorizedAccess?.();
    }
  };

  const cleanupProtection = () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('visibilitychange', () => {});
    window.removeEventListener('blur', () => {});
    window.removeEventListener('focus', () => {});
  };

  const applyWatermark = (canvas: HTMLCanvasElement, content: HTMLImageElement | HTMLVideoElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw original content
    canvas.width = content.offsetWidth;
    canvas.height = content.offsetHeight;
    
    if (content instanceof HTMLImageElement) {
      ctx.drawImage(content, 0, 0, canvas.width, canvas.height);
    } else if (content instanceof HTMLVideoElement) {
      ctx.drawImage(content, 0, 0, canvas.width, canvas.height);
    }

    // Apply watermark
    const watermark = watermarkText || `© KikStars - ${new Date().getFullYear()}`;
    
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    
    // Add multiple watermarks across the content
    const watermarkSpacing = 150;
    for (let x = 0; x < canvas.width; x += watermarkSpacing) {
      for (let y = 0; y < canvas.height; y += watermarkSpacing) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 4); // 45-degree rotation
        ctx.fillText(watermark, 0, 0);
        ctx.restore();
      }
    }

    // Add user-specific watermark
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`Viewed by: ${user?.id || 'User'}`, canvas.width - 150, canvas.height - 20);
  };

  const unlockPPVContent = async () => {
    // This would trigger the payment flow
    try {
      // Payment processing would happen here
      setHasAccess(true);
      setIsBlurred(false);
    } catch (error) {
      console.error('Error unlocking PPV content:', error);
    }
  };

  const renderProtectedImage = () => (
    <div className="relative overflow-hidden rounded-lg">
      <img
        ref={contentRef as React.RefObject<HTMLImageElement>}
        src={src}
        alt="Protected content"
        className={`w-full h-auto transition-all duration-300 ${
          isBlurred ? 'blur-xl scale-110' : ''
        }`}
        onLoad={(e) => {
          if (canvasRef.current && hasAccess) {
            applyWatermark(canvasRef.current, e.target as HTMLImageElement);
          }
        }}
        onError={() => handleSecurityViolation('Content load error')}
        draggable={false}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none'
        } as React.CSSProperties}
      />
      
      {hasAccess && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'multiply' }}
        />
      )}

      {isBlurred && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white p-6">
            <Lock className="h-12 w-12 mx-auto mb-4" />
            {isPPV ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
                <p className="text-sm mb-4">Unlock for ${ppvPrice}</p>
                <Button onClick={unlockPPVContent} className="bg-[#00aff0]">
                  Unlock Content
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-2">Subscription Required</h3>
                <p className="text-sm">Subscribe to view this content</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderProtectedVideo = () => (
    <div className="relative overflow-hidden rounded-lg">
      <video
        ref={contentRef as React.RefObject<HTMLVideoElement>}
        src={src}
        className={`w-full h-auto transition-all duration-300 ${
          isBlurred ? 'blur-xl scale-110' : ''
        }`}
        controls={hasAccess && !isBlurred}
        controlsList="nodownload nofullscreen"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onLoadedData={(e) => {
          if (canvasRef.current && hasAccess) {
            applyWatermark(canvasRef.current, e.target as HTMLVideoElement);
          }
        }}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      />

      {hasAccess && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'multiply' }}
        />
      )}

      {isBlurred && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white p-6">
            <Lock className="h-12 w-12 mx-auto mb-4" />
            {isPPV ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Premium Video</h3>
                <p className="text-sm mb-4">Unlock for ${ppvPrice}</p>
                <Button onClick={unlockPPVContent} className="bg-[#00aff0]">
                  Unlock Video
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-2">Subscription Required</h3>
                <p className="text-sm">Subscribe to view this video</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (type === 'image') return renderProtectedImage();
  if (type === 'video') return renderProtectedVideo();
  
  return null;
};

// Content Protection Dashboard for Creators
const ContentProtectionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [protectionSettings, setProtectionSettings] = useState({
    enableWatermarks: true,
    watermarkText: '',
    preventScreenshots: true,
    preventDownloads: true,
    preventRightClick: true,
    enableDeviceTracking: true,
    maxViolationsBeforeBlock: 3
  });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [stats, setStats] = useState({
    totalViolations: 0,
    blockedUsers: 0,
    protectedContent: 0
  });

  useEffect(() => {
    fetchProtectionSettings();
    fetchSecurityLogs();
    fetchSecurityStats();
  }, []);

  const fetchProtectionSettings = async () => {
    try {
      const response = await fetch(`/api/creators/${user?.id}/protection-settings`);
      const data = await response.json();
      setProtectionSettings(data);
    } catch (error) {
      console.error('Error fetching protection settings:', error);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const response = await fetch(`/api/creators/${user?.id}/security-logs`);
      const data = await response.json();
      setSecurityLogs(data);
    } catch (error) {
      console.error('Error fetching security logs:', error);
    }
  };

  const fetchSecurityStats = async () => {
    try {
      const response = await fetch(`/api/creators/${user?.id}/security-stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching security stats:', error);
    }
  };

  const updateProtectionSettings = async (newSettings: any) => {
    try {
      await fetch(`/api/creators/${user?.id}/protection-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      setProtectionSettings(newSettings);
    } catch (error) {
      console.error('Error updating protection settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Protection</h2>
        <Badge variant="outline" className="bg-green-100 text-green-800">
          <Shield className="h-4 w-4 mr-1" />
          Active Protection
        </Badge>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1e2029] border-[#2c2e36]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Security Violations</p>
                <p className="text-2xl font-bold text-red-400">{stats.totalViolations}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2029] border-[#2c2e36]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Blocked Users</p>
                <p className="text-2xl font-bold text-orange-400">{stats.blockedUsers}</p>
              </div>
              <EyeOff className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2029] border-[#2c2e36]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Protected Content</p>
                <p className="text-2xl font-bold text-green-400">{stats.protectedContent}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protection Settings */}
      <Card className="bg-[#1e2029] border-[#2c2e36]">
        <CardHeader>
          <CardTitle>Protection Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              These settings help protect your content from unauthorized access and piracy.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={protectionSettings.enableWatermarks}
                  onChange={(e) => updateProtectionSettings({
                    ...protectionSettings,
                    enableWatermarks: e.target.checked
                  })}
                  className="rounded"
                />
                <span>Enable Watermarks</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={protectionSettings.preventScreenshots}
                  onChange={(e) => updateProtectionSettings({
                    ...protectionSettings,
                    preventScreenshots: e.target.checked
                  })}
                  className="rounded"
                />
                <span>Prevent Screenshots</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={protectionSettings.preventDownloads}
                  onChange={(e) => updateProtectionSettings({
                    ...protectionSettings,
                    preventDownloads: e.target.checked
                  })}
                  className="rounded"
                />
                <span>Prevent Downloads</span>
              </label>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={protectionSettings.preventRightClick}
                  onChange={(e) => updateProtectionSettings({
                    ...protectionSettings,
                    preventRightClick: e.target.checked
                  })}
                  className="rounded"
                />
                <span>Disable Right-Click</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={protectionSettings.enableDeviceTracking}
                  onChange={(e) => updateProtectionSettings({
                    ...protectionSettings,
                    enableDeviceTracking: e.target.checked
                  })}
                  className="rounded"
                />
                <span>Enable Device Tracking</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Logs */}
      <Card className="bg-[#1e2029] border-[#2c2e36]">
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          {securityLogs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No security events recorded</p>
          ) : (
            <div className="space-y-3">
              {securityLogs.slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-[#252836] rounded">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <div>
                      <p className="font-medium">{log.violation}</p>
                      <p className="text-sm text-gray-400">User: {log.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                    <Badge variant={log.severity === 'high' ? 'destructive' : 'secondary'}>
                      {log.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { ProtectedContent, ContentProtectionDashboard };
export default ProtectedContent;