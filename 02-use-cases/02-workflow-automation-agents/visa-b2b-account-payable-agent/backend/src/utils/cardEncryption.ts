/**
 * Card Encryption Utilities
 * 
 * Provides encryption and decryption functions for virtual card data using AWS KMS.
 * Used by backend API to securely handle card details for buyer and supplier portals.
 */

import { KMSClient, EncryptCommand, EncryptCommandInput, DecryptCommand, DecryptCommandInput } from '@aws-sdk/client-kms';

// Initialize KMS client
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });

// KMS Key ID from environment variable
const KMS_KEY_ID = process.env.KMS_KEY_ID || 'alias/rtp-overlay-payment-cards';

/**
 * Encrypt sensitive card data using AWS KMS
 * 
 * @param plaintext - String data to encrypt (card number or CVV)
 * @returns Base64-encoded encrypted data
 */
export async function encryptCardData(plaintext: string): Promise<string> {
  try {
    const params: EncryptCommandInput = {
      KeyId: KMS_KEY_ID,
      Plaintext: Buffer.from(plaintext),
    };

    const response = await kmsClient.send(new EncryptCommand(params));

    if (!response.CiphertextBlob) {
      throw new Error('KMS encryption failed: No ciphertext returned');
    }

    // Return base64-encoded ciphertext
    const encrypted = Buffer.from(response.CiphertextBlob!).toString('base64');
    console.log(`Successfully encrypted data (length: ${encrypted.length})`);
    return encrypted;
  } catch (error) {
    console.error('Error encrypting card data:', error);
    throw new Error(`Card encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt sensitive card data using AWS KMS
 * 
 * @param encryptedData - Base64-encoded encrypted data
 * @returns Decrypted plaintext string
 */
export async function decryptCardData(encryptedData: string): Promise<string> {
  try {
    // Decode base64
    const ciphertextBlob = Buffer.from(encryptedData, 'base64');

    const params: DecryptCommandInput = {
      CiphertextBlob: ciphertextBlob,
    };

    const response = await kmsClient.send(new DecryptCommand(params));

    if (!response.Plaintext) {
      throw new Error('KMS decryption failed: No plaintext returned');
    }

    // Return decrypted plaintext
    const plaintext = Buffer.from(response.Plaintext!).toString('utf-8');
    console.log('Successfully decrypted data');
    return plaintext;
  } catch (error) {
    console.error('Error decrypting card data:', error);
    throw new Error(`Card decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt all card details from a payment record
 * 
 * @param payment - Payment record with encrypted card fields
 * @returns Object with decrypted card details
 */
export async function decryptPaymentCardDetails(payment: {
  virtualCardNumberEncrypted?: string | null;
  virtualCardCvvEncrypted?: string | null;
  virtualCardExpiry?: string | null;
  trackingNumber?: string | null;
}): Promise<{
  cardNumber: string;
  cvv: string;
  expiry: string;
  trackingNumber: string;
}> {
  try {
    // Decrypt card number and CVV in parallel
    const [cardNumber, cvv] = await Promise.all([
      payment.virtualCardNumberEncrypted
        ? decryptCardData(payment.virtualCardNumberEncrypted)
        : Promise.resolve(''),
      payment.virtualCardCvvEncrypted
        ? decryptCardData(payment.virtualCardCvvEncrypted)
        : Promise.resolve(''),
    ]);

    return {
      cardNumber,
      cvv,
      expiry: payment.virtualCardExpiry || '',
      trackingNumber: payment.trackingNumber || '',
    };
  } catch (error) {
    console.error('Error decrypting payment card details:', error);
    throw new Error('Failed to decrypt card details');
  }
}

/**
 * Mask card number for display (show only last 4 digits)
 * 
 * @param cardNumber - Full card number
 * @returns Masked card number (e.g., "**** 1234")
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) {
    return '****';
  }
  const last4 = cardNumber.slice(-4);
  return `**** ${last4}`;
}

/**
 * Format card details for copying (plain text format)
 * 
 * @param cardDetails - Decrypted card details
 * @returns Formatted string for clipboard
 */
export function formatCardDetailsForCopy(cardDetails: {
  cardNumber: string;
  cvv: string;
  expiry: string;
  trackingNumber: string;
}): string {
  return `Card Number: ${cardDetails.cardNumber}
CVV: ${cardDetails.cvv}
Expiry: ${cardDetails.expiry}
Tracking Number: ${cardDetails.trackingNumber}`;
}
