import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { requireAdminOrEditor } from '@/lib/auth-helpers';
import { fieldEncryption, FieldEncryption } from '@/lib/security/field-encryption';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Server-side role check - only admins can manage encryption
    await requireAdminOrEditor(req);

    const { action, data } = req.body;

    switch (action) {
      case 'generate-key':
        const newKey = FieldEncryption.generateEncryptionKey();
        return res.status(200).json({
          success: true,
          data: {
            key: newKey,
            instructions: [
              'Add this key to your environment variables as ENCRYPTION_KEY',
              'Keep this key secure and never expose it in client-side code',
              'Store this key in a secure location (password manager, secrets manager)',
              'If you lose this key, encrypted data will be unrecoverable'
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'migrate-users':
        const migrationResult = await fieldEncryption.migrateUserEncryption();
        return res.status(200).json({
          success: true,
          data: {
            ...migrationResult,
            recommendations: [
              'Review any errors that occurred during migration',
              'Test decryption of migrated user data',
              'Monitor application performance after migration',
              'Document the encryption process for your team'
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'encrypt-user':
        if (!data?.userId || !data?.fields) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'userId and fields are required for encrypt-user action',
              details: 'fields should be an object with field names and values'
            },
            timestamp: new Date().toISOString()
          });
        }

        await fieldEncryption.encryptUserFields(data.userId, data.fields);
        return res.status(200).json({
          success: true,
          data: {
            message: 'User fields encrypted successfully',
            userId: data.userId,
            encryptedFields: Object.keys(data.fields)
          },
          timestamp: new Date().toISOString()
        });

      case 'test-encryption':
        if (!data?.testData) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'testData is required for test-encryption action',
              details: 'testData should be a string to test encryption/decryption'
            },
            timestamp: new Date().toISOString()
          });
        }

        const encrypted = fieldEncryption.encryptField(data.testData);
        const decrypted = fieldEncryption.decryptField(encrypted);
        
        return res.status(200).json({
          success: true,
          data: {
            original: data.testData,
            encrypted,
            decrypted,
            encryptionWorking: data.testData === decrypted,
            recommendations: [
              'If original matches decrypted, encryption is working correctly',
              'Store the encrypted version in your database',
              'Use decryptField() when reading data back'
            ]
          },
          timestamp: new Date().toISOString()
        });

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'Invalid action specified',
            details: 'Valid actions: generate-key, migrate-users, encrypt-user, test-encryption'
          },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Field encryption error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ENCRYPTION_FAILED',
        message: 'Failed to perform encryption operation',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);
