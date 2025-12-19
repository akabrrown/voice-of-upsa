// Field Encryption for Sensitive User Data
import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
}

class FieldEncryption {
  private static instance: FieldEncryption;
  private config: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16
  };
  private encryptionKey: Buffer;

  static getInstance(): FieldEncryption {
    if (!FieldEncryption.instance) {
      FieldEncryption.instance = new FieldEncryption();
    }
    return FieldEncryption.instance;
  }

  constructor() {
    // Initialize encryption key from environment
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    
    // Ensure key is correct length
    this.encryptionKey = Buffer.from(key.padEnd(this.config.keyLength, '0').slice(0, this.config.keyLength), 'utf8');
  }

  // Encrypt sensitive field
  encryptField(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(this.config.ivLength);
      const cipher = crypto.createCipheriv(this.config.algorithm, this.encryptionKey, iv) as any;
      cipher.setAAD(Buffer.from('user-field', 'utf8'));
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine iv, tag, and encrypted data
      const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt field');
    }
  }

  // Decrypt sensitive field
  decryptField(encryptedData: string): string {
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract iv, tag, and encrypted data
      const iv = combined.slice(0, this.config.ivLength);
      const tag = combined.slice(this.config.ivLength, this.config.ivLength + this.config.tagLength);
      const encrypted = combined.slice(this.config.ivLength + this.config.tagLength);
      
      const decipher = crypto.createDecipheriv(this.config.algorithm, this.encryptionKey, iv) as any;
      decipher.setAAD(Buffer.from('user-field', 'utf8'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt field');
    }
  }

  // Check if field is encrypted (base64 format)
  isEncrypted(data: string): boolean {
    try {
      const buffer = Buffer.from(data, 'base64');
      return buffer.length >= this.config.ivLength + this.config.tagLength;
    } catch {
      return false;
    }
  }

  // Encrypt user sensitive fields
  async encryptUserFields(userId: string, fields: Record<string, string>): Promise<void> {
    try {
      const encryptedFields: Record<string, string> = {};
      
      for (const [fieldName, fieldValue] of Object.entries(fields)) {
        if (fieldValue && !this.isEncrypted(fieldValue)) {
          encryptedFields[fieldName] = this.encryptField(fieldValue);
        } else {
          encryptedFields[fieldName] = fieldValue;
        }
      }
      
      // Update user with encrypted fields
      const { error } = await (await supabaseAdmin as any)
        .from('users')
        .update(encryptedFields)
        .eq('id', userId);
        
      if (error) {
        throw new Error(`Failed to update user fields: ${error.message}`);
      }
      
      console.info(`Encrypted sensitive fields for user ${userId}`);
    } catch (error) {
      console.error('Field encryption error:', error);
      throw error;
    }
  }

  // Decrypt user sensitive fields
  decryptUserFields(user: Record<string, any>): Record<string, any> {
    const decryptedUser = { ...user };
    
    const sensitiveFields = ['phone', 'address', 'emergency_contact', 'bio'];
    
    for (const fieldName of sensitiveFields) {
      if (decryptedUser[fieldName] && this.isEncrypted(decryptedUser[fieldName])) {
        try {
          decryptedUser[fieldName] = this.decryptField(decryptedUser[fieldName]);
        } catch (error) {
          console.error(`Failed to decrypt field ${fieldName}:`, error);
          // Keep original value if decryption fails
        }
      }
    }
    
    return decryptedUser;
  }

  // Migrate existing users to encrypt sensitive fields
  async migrateUserEncryption(): Promise<{ migrated: number; errors: string[] }> {
    const errors: string[] = [];
    let migrated = 0;
    
    try {
      // Get all users with sensitive fields that aren't encrypted
      const { data: users, error } = await (await supabaseAdmin)
        .from('users')
        .select('id, phone, address, emergency_contact, bio')
        .or('phone.not.is.null,address.not.is.null,emergency_contact.not.is.null,bio.not.is.null');
      
      if (error) {
        errors.push(`Failed to fetch users: ${error.message}`);
        return { migrated: 0, errors };
      }
      
      for (const user of (users as any[]) || []) {
        const fieldsToEncrypt: Record<string, string> = {};
        
        if (user.phone && !this.isEncrypted(user.phone)) {
          fieldsToEncrypt.phone = user.phone;
        }
        if (user.address && !this.isEncrypted(user.address)) {
          fieldsToEncrypt.address = user.address;
        }
        if (user.emergency_contact && !this.isEncrypted(user.emergency_contact)) {
          fieldsToEncrypt.emergency_contact = user.emergency_contact;
        }
        if (user.bio && !this.isEncrypted(user.bio)) {
          fieldsToEncrypt.bio = user.bio;
        }
        
        if (Object.keys(fieldsToEncrypt).length > 0) {
          try {
            await this.encryptUserFields(user.id, fieldsToEncrypt);
            migrated++;
          } catch (encryptError) {
            errors.push(`Failed to migrate user ${user.id}: ${encryptError instanceof Error ? encryptError.message : 'Unknown error'}`);
          }
        }
      }
      
      console.info(`Migrated ${migrated} users to field encryption`);
      return { migrated, errors };
      
    } catch (error) {
      errors.push(`Migration failed: ${(error as Error).message}`);
      return { migrated, errors };
    }
  }

  // Generate encryption key for new setup
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export class and singleton instance
export { FieldEncryption };
export const fieldEncryption = FieldEncryption.getInstance();

// Middleware to decrypt user data in API responses
export const withDecryptedUser = (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      // Decrypt user data if present
      if (data.data && Array.isArray(data.data)) {
        data.data = data.data.map((item: any) => 
          item.id ? fieldEncryption.decryptUserFields(item) : item
        );
      } else if (data.data && data.data.id) {
        data.data = fieldEncryption.decryptUserFields(data.data);
      }
      
      return originalJson.call(this, data);
    };
    
    return handler(req, res);
  };
};
