// Log Rotation and Purge System
import { supabaseAdmin } from '@/lib/database-server';

interface LogRotationConfig {
  retentionDays: number;
  maxLogSize: number; // in MB
  batchSize: number;
  schedule: string; // cron expression
}

class LogRotationManager {
  private static instance: LogRotationManager;
  private config: LogRotationConfig = {
    retentionDays: 30, // Keep logs for 30 days
    maxLogSize: 100, // 100MB max
    batchSize: 1000, // Process 1000 records at a time
    schedule: '0 2 * * *' // Daily at 2 AM
  };

  static getInstance(): LogRotationManager {
    if (!LogRotationManager.instance) {
      LogRotationManager.instance = new LogRotationManager();
    }
    return LogRotationManager.instance;
  }

  // Rotate audit logs
  async rotateAuditLogs(): Promise<{ rotated: number; errors: string[] }> {
    const errors: string[] = [];
    let rotated = 0;

    try {
      // Get logs older than retention period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      // Count old logs
      const { data: oldLogs, error: countError } = await supabaseAdmin
        .from('audit_logs')
        .select('id', { count: 'exact' })
        .lt('created_at', cutoffDate.toISOString());

      if (countError) {
        errors.push(`Failed to count old logs: ${countError.message}`);
        return { rotated: 0, errors };
      }

      const oldLogCount = oldLogs.length;
      
      if (oldLogCount === 0) {
        return { rotated: 0, errors };
      }

      // Delete old logs in batches
      const batchesToProcess = Math.ceil(oldLogCount / this.config.batchSize);
      
      for (let batch = 0; batch < batchesToProcess; batch++) {
        const { data: logsToDelete, error: fetchError } = await supabaseAdmin
          .from('audit_logs')
          .select('id')
          .lt('created_at', cutoffDate.toISOString())
          .limit(this.config.batchSize);

        if (fetchError) {
          errors.push(`Failed to fetch logs batch ${batch}: ${fetchError.message}`);
          continue;
        }

        if (logsToDelete.length === 0) {
          continue;
        }

        // Delete the batch
        const { error: deleteError } = await supabaseAdmin
          .from('audit_logs')
          .delete()
          .in('id', logsToDelete.map(log => log.id));

        if (deleteError) {
          errors.push(`Failed to delete logs batch ${batch}: ${deleteError.message}`);
          continue;
        }

        rotated += logsToDelete.length;
        
        // Add small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.info(`Rotated ${rotated} audit logs older than ${this.config.retentionDays} days`);
      return { rotated, errors };

    } catch (error) {
      errors.push(`Unexpected error during log rotation: ${(error as Error).message}`);
      return { rotated, errors };
    }
  }

  // Rotate security alerts
  async rotateSecurityAlerts(): Promise<{ rotated: number; errors: string[] }> {
    const errors: string[] = [];
    let rotated = 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const { data: oldAlerts, error: countError } = await supabaseAdmin
        .from('security_alerts')
        .select('id', { count: 'exact' })
        .lt('created_at', cutoffDate.toISOString());

      if (countError) {
        errors.push(`Failed to count old alerts: ${countError.message}`);
        return { rotated: 0, errors };
      }

      const oldAlertCount = oldAlerts.length;
      
      if (oldAlertCount === 0) {
        return { rotated: 0, errors };
      }

      // Delete old alerts in batches
      const batchesToProcess = Math.ceil(oldAlertCount / this.config.batchSize);
      
      for (let batch = 0; batch < batchesToProcess; batch++) {
        const { data: alertsToDelete, error: fetchError } = await supabaseAdmin
          .from('security_alerts')
          .select('id')
          .lt('created_at', cutoffDate.toISOString())
          .limit(this.config.batchSize);

        if (fetchError) {
          errors.push(`Failed to fetch alerts batch ${batch}: ${fetchError.message}`);
          continue;
        }

        if (alertsToDelete.length === 0) {
          continue;
        }

        const { error: deleteError } = await supabaseAdmin
          .from('security_alerts')
          .delete()
          .in('id', alertsToDelete.map(alert => alert.id));

        if (deleteError) {
          errors.push(`Failed to delete alerts batch ${batch}: ${deleteError.message}`);
          continue;
        }

        rotated += alertsToDelete.length;
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.info(`Rotated ${rotated} security alerts older than ${this.config.retentionDays} days`);
      return { rotated, errors };

    } catch (error) {
      errors.push(`Unexpected error during alert rotation: ${(error as Error).message}`);
      return { rotated, errors };
    }
  }

  // Get log statistics
  async getLogStatistics(): Promise<{
    auditLogs: { total: number; size: string };
    securityAlerts: { total: number; size: string };
    recommendations: string[];
  }> {
    try {
      // Get audit log statistics
      const { data: auditStats, error: auditError } = await supabaseAdmin
        .from('audit_logs')
        .select('id, created_at')
        .limit(1);

      // Get security alert statistics
      const { data: alertStats, error: alertError } = await supabaseAdmin
        .from('security_alerts')
        .select('id, created_at')
        .limit(1);

      if (auditError || alertError) {
        return {
          auditLogs: { total: 0, size: '0 MB' },
          securityAlerts: { total: 0, size: '0 MB' },
          recommendations: ['Unable to fetch log statistics', 'Check database connection']
        };
      }

      // Estimate table sizes (rough calculation)
      const auditLogSize = Math.round((auditStats?.length || 0) * 0.001); // ~1KB per log
      const alertLogSize = Math.round((alertStats?.length || 0) * 0.0005); // ~0.5KB per alert

      const recommendations: string[] = [];
      
      if (auditLogSize > this.config.maxLogSize) {
        recommendations.push(`Audit logs exceed ${this.config.maxLogSize}MB - consider increasing rotation frequency`);
      }
      
      if (alertLogSize > this.config.maxLogSize) {
        recommendations.push(`Security alerts exceed ${this.config.maxLogSize}MB - consider increasing rotation frequency`);
      }

      return {
        auditLogs: {
          total: auditStats?.length || 0,
          size: `${auditLogSize} MB`
        },
        securityAlerts: {
          total: alertStats?.length || 0,
          size: `${alertLogSize} MB`
        },
        recommendations
      };

    } catch (error) {
      return {
        auditLogs: { total: 0, size: '0 MB' },
        securityAlerts: { total: 0, size: '0 MB' },
        recommendations: [`Error fetching statistics: ${(error as Error).message}`]
      };
    }
  }

  // Run all rotation tasks
  async runAllRotations(): Promise<{
    auditLogs: { rotated: number; errors: string[] };
    securityAlerts: { rotated: number; errors: string[] };
    totalRotated: number;
    totalErrors: string[];
  }> {
    const auditResult = await this.rotateAuditLogs();
    const alertResult = await this.rotateSecurityAlerts();

    return {
      auditLogs: auditResult,
      securityAlerts: alertResult,
      totalRotated: auditResult.rotated + alertResult.rotated,
      totalErrors: [...auditResult.errors, ...alertResult.errors]
    };
  }

  // Schedule automatic rotation (would be implemented with a job scheduler)
  scheduleRotation(): void {
    console.info('Log rotation scheduled with config:', this.config);
    // In production, this would integrate with your job scheduler
    // For now, logs can be rotated manually via API
  }
}

// Export singleton instance
export const logRotationManager = LogRotationManager.getInstance();
