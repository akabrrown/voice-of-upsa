import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from './database-server';

export interface SecurityEvent {
  type: 'auth_failure' | 'csrf_failure' | 'rate_limit_exceeded' | 'admin_access' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  endpoint: string;
  method: string;
  details: Record<string, unknown>;
  timestamp: string;
}

class SecurityMonitor {
  private adminClient = getSupabaseAdmin();

  /**
   * Log security event to database
   */
  async logEvent(event: SecurityEvent): Promise<void> {
    try {
      await this.adminClient
        .from('security_events')
        .insert({
          event_type: event.type,
          severity: event.severity,
          user_id: event.userId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          endpoint: event.endpoint,
          method: event.method,
          details: event.details,
          created_at: event.timestamp
        });
    } catch (error) {
      // Don't fail the request if logging fails, but log to console
      console.error('Failed to log security event:', error);
      console.warn('Security event:', event);
    }
  }

  /**
   * Log authentication failure
   */
  async logAuthFailure(
    req: NextApiRequest,
    reason: string,
    severity: 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    const event: SecurityEvent = {
      type: 'auth_failure',
      severity,
      ipAddress: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      endpoint: req.url || 'unknown',
      method: req.method || 'unknown',
      details: { reason },
      timestamp: new Date().toISOString()
    };

    await this.logEvent(event);
  }

  /**
   * Log CSRF failure
   */
  async logCSRFFailure(req: NextApiRequest): Promise<void> {
    const event: SecurityEvent = {
      type: 'csrf_failure',
      severity: 'high',
      ipAddress: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      endpoint: req.url || 'unknown',
      method: req.method || 'unknown',
      details: {},
      timestamp: new Date().toISOString()
    };

    await this.logEvent(event);
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(
    req: NextApiRequest,
    limit: number,
    windowMs: number
  ): Promise<void> {
    const event: SecurityEvent = {
      type: 'rate_limit_exceeded',
      severity: 'medium',
      ipAddress: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      endpoint: req.url || 'unknown',
      method: req.method || 'unknown',
      details: { limit, windowMs },
      timestamp: new Date().toISOString()
    };

    await this.logEvent(event);
  }

  /**
   * Log admin access
   */
  async logAdminAccess(
    req: NextApiRequest,
    adminId: string,
    action: string
  ): Promise<void> {
    const event: SecurityEvent = {
      type: 'admin_access',
      severity: 'low',
      userId: adminId,
      ipAddress: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      endpoint: req.url || 'unknown',
      method: req.method || 'unknown',
      details: { action },
      timestamp: new Date().toISOString()
    };

    await this.logEvent(event);
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    req: NextApiRequest,
    reason: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    const event: SecurityEvent = {
      type: 'suspicious_activity',
      severity: 'high',
      ipAddress: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      endpoint: req.url || 'unknown',
      method: req.method || 'unknown',
      details: { reason, ...details },
      timestamp: new Date().toISOString()
    };

    await this.logEvent(event);
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: NextApiRequest): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           req.headers['x-real-ip'] as string || 
           req.socket.remoteAddress || 
           'unknown';
  }

  /**
   * Check for suspicious patterns
   */
  async detectSuspiciousActivity(req: NextApiRequest): Promise<boolean> {
    const suspiciousPatterns = [
      /\.\./,  // Path traversal
      /<script/i,  // XSS attempt
      /union.*select/i,  // SQL injection attempt
      /cmd\.exe|\/bin\/sh/i,  // Command injection
      /eval\(|exec\(/i,  // Code execution
    ];

    const url = req.url || '';
    const userAgent = req.headers['user-agent'] || '';
    const body = JSON.stringify(req.body);

    const combined = `${url} ${userAgent} ${body}`;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(combined)) {
        await this.logSuspiciousActivity(req, `Suspicious pattern detected: ${pattern.source}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Get recent security events
   */
  async getRecentEvents(limit: number = 100): Promise<SecurityEvent[]> {
    try {
      const { data } = await this.adminClient
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      return [];
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    highEvents: number;
    mediumEvents: number;
    lowEvents: number;
    eventsByType: Record<string, number>;
  }> {
    try {
      const { data } = await this.adminClient
        .from('security_events')
        .select('severity, event_type');

      if (!data) {
        return {
          totalEvents: 0,
          criticalEvents: 0,
          highEvents: 0,
          mediumEvents: 0,
          lowEvents: 0,
          eventsByType: {}
        };
      }

      const stats = data.reduce((acc, event) => {
        acc.totalEvents++;
        const severityKey = `${event.severity}Events` as keyof typeof acc;
        acc[severityKey]++;
        acc.eventsByType[event.event_type] = (acc.eventsByType[event.event_type] || 0) + 1;
        return acc;
      }, {
        totalEvents: 0,
        criticalEvents: 0,
        highEvents: 0,
        mediumEvents: 0,
        lowEvents: 0,
        eventsByType: {} as Record<string, number>
      });

      return stats;
    } catch (error) {
      console.error('Failed to fetch security stats:', error);
      return {
        totalEvents: 0,
        criticalEvents: 0,
        highEvents: 0,
        mediumEvents: 0,
        lowEvents: 0,
        eventsByType: {}
      };
    }
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

/**
 * Middleware for automatic security monitoring
 */
export function withSecurityMonitoring(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Detect suspicious activity
    await securityMonitor.detectSuspiciousActivity(req);

    // Continue with the request
    return handler(req, res);
  };
}

export default SecurityMonitor;
