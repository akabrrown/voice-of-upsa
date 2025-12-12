// Security Health Monitoring System
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

interface SecurityMetrics {
  totalAuthAttempts: number;
  failedAuthAttempts: number;
  suspiciousIPs: string[];
  rateLimitViolations: number;
  emergencyActions: number;
  lastSecurityCheck: string;
  overallSecurityScore: number;
}

interface SecurityAlert {
  type: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private metrics: SecurityMetrics = {
    totalAuthAttempts: 0,
    failedAuthAttempts: 0,
    suspiciousIPs: [],
    rateLimitViolations: 0,
    emergencyActions: 0,
    lastSecurityCheck: new Date().toISOString(),
    overallSecurityScore: 100
  };

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  // Track authentication attempts
  async trackAuthAttempt(success: boolean, ip: string, userId?: string) {
    this.metrics.totalAuthAttempts++;
    
    if (!success) {
      this.metrics.failedAuthAttempts++;
      
      // Check for suspicious patterns
      const failureRate = this.metrics.failedAuthAttempts / this.metrics.totalAuthAttempts;
      if (failureRate > 0.3) { // 30% failure rate threshold
        await this.createSecurityAlert('medium', 'High authentication failure rate detected', {
          failureRate: Math.round(failureRate * 100),
          ip,
          userId
        });
      }
    }

    await this.updateMetrics();
  }

  // Track rate limit violations
  async trackRateLimitViolation(ip: string, endpoint: string) {
    this.metrics.rateLimitViolations++;
    
    // Add to suspicious IPs if multiple violations
    if (!this.metrics.suspiciousIPs.includes(ip)) {
      this.metrics.suspiciousIPs.push(ip);
    }

    await this.createSecurityAlert('medium', 'Rate limit violation detected', {
      ip,
      endpoint,
      totalViolations: this.metrics.rateLimitViolations
    });

    await this.updateMetrics();
  }

  // Track emergency actions
  async trackEmergencyAction(action: string, userId: string) {
    this.metrics.emergencyActions++;
    
    await this.createSecurityAlert('high', 'Emergency action triggered', {
      action,
      userId,
      timestamp: new Date().toISOString()
    });

    await this.updateMetrics();
  }

  // Create security alerts
  private async createSecurityAlert(type: 'high' | 'medium' | 'low', message: string, details?: Record<string, unknown>) {
    try {
      await supabaseAdmin
        .from('security_alerts')
        .insert({
          type,
          message,
          details,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }

  // Calculate overall security score
  private calculateSecurityScore(): number {
    let score = 100;
    
    // Deduct points for failed auth attempts
    const authFailurePenalty = Math.min((this.metrics.failedAuthAttempts / this.metrics.totalAuthAttempts) * 20, 20);
    score -= authFailurePenalty;
    
    // Deduct points for rate limit violations
    const rateLimitPenalty = Math.min(this.metrics.rateLimitViolations * 2, 15);
    score -= rateLimitPenalty;
    
    // Deduct points for emergency actions (these are serious)
    const emergencyPenalty = this.metrics.emergencyActions * 10;
    score -= emergencyPenalty;
    
    // Deduct points for suspicious IPs
    const suspiciousIPPEnalty = this.metrics.suspiciousIPs.length * 3;
    score -= suspiciousIPPEnalty;
    
    return Math.max(score, 0);
  }

  // Update metrics in database
  private async updateMetrics() {
    this.metrics.overallSecurityScore = this.calculateSecurityScore();
    this.metrics.lastSecurityCheck = new Date().toISOString();

    try {
      await supabaseAdmin
        .from('security_metrics')
        .upsert({
          id: 'current',
          ...this.metrics,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to update security metrics:', error);
    }
  }

  // Get current security status
  async getSecurityStatus(): Promise<SecurityMetrics & { alerts: SecurityAlert[] }> {
    try {
      const { data: alerts } = await supabaseAdmin
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        ...this.metrics,
        alerts: alerts || []
      };
    } catch (error) {
      console.error('Failed to get security status:', error);
      return {
        ...this.metrics,
        alerts: []
      };
    }
  }

  // Check if security is compromised
  isSecurityCompromised(): boolean {
    return this.metrics.overallSecurityScore < 70 || // Score below 70
           this.metrics.emergencyActions > 0 || // Any emergency actions
           this.metrics.rateLimitViolations > 10; // High rate limit violations
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

// Middleware for automatic security tracking
export const trackSecurityEvent = (type: 'auth' | 'rate_limit' | 'emergency') => {
  return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const ip = (req as any).ip || (req as any).connection?.remoteAddress || 'unknown';
    
    switch (type) {
      case 'auth':
        const success = res.statusCode < 400;
        await securityMonitor.trackAuthAttempt(success, ip, (req as any).user?.id);
        break;
      case 'rate_limit':
        if (res.statusCode === 429) {
          await securityMonitor.trackRateLimitViolation(ip, (req as any).path || (req as any).url);
        }
        break;
      case 'emergency':
        await securityMonitor.trackEmergencyAction(req.body.action, (req as any).user?.id);
        break;
    }
    
    next();
  };
};
