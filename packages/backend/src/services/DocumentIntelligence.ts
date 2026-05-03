// Document Intelligence Service — Poonawalla Fincorp LoanWizard OS
// Mock implementation — production uses AWS Textract + custom ML models

export interface PanDetails {
  pan_number: string;
  name: string;
  dob: string;
  confidence: number;
  extraction_time_ms: number;
}

export interface AadhaarDetails {
  aadhaar_masked: string; // Last 4 digits only — UIDAI mandate
  name: string;
  address: string;
  dob: string;
  gender: string;
  confidence: number;
  extraction_time_ms: number;
}

export interface BankStatementSummary {
  avg_balance: number;
  min_balance: number;
  max_balance: number;
  salary_credits: number;
  salary_credit_dates: string[];
  emi_debits: number;
  total_credits: number;
  total_debits: number;
  months_analysed: number;
  confidence: number;
  extraction_time_ms: number;
}

export interface DocumentAuthenticityResult {
  authentic: boolean;
  confidence: number;
  flags: string[];
  tamper_detected: boolean;
  font_consistency: boolean;
  metadata_valid: boolean;
  extraction_time_ms: number;
}

export class DocumentIntelligence {
  /**
   * Extract PAN card details from base64 image.
   * Production: AWS Textract + custom PAN regex validation.
   */
  static async extractPanDetails(imageBase64: string): Promise<PanDetails> {
    const start = Date.now();
    // Validate input
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Invalid image data');
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 180));

    // Mock extraction — in production, run OCR on the image
    const mockPans = ['ABCDE1234F', 'FGHIJ5678K', 'KLMNO9012P', 'UVWXY7890Z'];
    const pan = mockPans[Math.floor(Math.random() * mockPans.length)];

    return {
      pan_number: pan,
      name: 'CUSTOMER NAME',
      dob: '1990-05-15',
      confidence: 0.94 + Math.random() * 0.05,
      extraction_time_ms: Date.now() - start,
    };
  }

  /**
   * Extract Aadhaar details from base64 image.
   * Only last 4 digits stored per UIDAI mandate.
   */
  static async extractAadhaarDetails(imageBase64: string): Promise<AadhaarDetails> {
    const start = Date.now();
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Invalid image data');
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      aadhaar_masked: 'XXXX XXXX 5678',
      name: 'CUSTOMER NAME',
      address: '123, Sample Street, Mumbai, Maharashtra - 400001',
      dob: '1990-05-15',
      gender: 'M',
      confidence: 0.91 + Math.random() * 0.08,
      extraction_time_ms: Date.now() - start,
    };
  }

  /**
   * Extract bank statement summary from base64 image/PDF.
   * Production: AWS Textract + custom financial parser.
   */
  static async extractBankStatement(imageBase64: string): Promise<BankStatementSummary> {
    const start = Date.now();
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Invalid image data');
    }

    await new Promise(resolve => setTimeout(resolve, 350));

    const avgBalance = 45000 + Math.floor(Math.random() * 80000);
    const salaryCredit = 55000 + Math.floor(Math.random() * 50000);

    return {
      avg_balance: avgBalance,
      min_balance: Math.floor(avgBalance * 0.3),
      max_balance: Math.floor(avgBalance * 2.5),
      salary_credits: salaryCredit,
      salary_credit_dates: ['2024-01-01', '2024-02-01', '2024-03-01'],
      emi_debits: Math.floor(salaryCredit * 0.15),
      total_credits: salaryCredit * 3 + Math.floor(Math.random() * 20000),
      total_debits: Math.floor(salaryCredit * 2.8),
      months_analysed: 3,
      confidence: 0.88 + Math.random() * 0.1,
      extraction_time_ms: Date.now() - start,
    };
  }

  /**
   * Verify document authenticity using metadata and visual analysis.
   * Production: ML model trained on genuine vs tampered documents.
   */
  static async verifyDocumentAuthenticity(
    imageBase64: string,
    docType: 'pan' | 'aadhaar' | 'bank_statement' | 'salary_slip'
  ): Promise<DocumentAuthenticityResult> {
    const start = Date.now();
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error('Invalid image data');
    }

    await new Promise(resolve => setTimeout(resolve, 250));

    // Mock: 95% of documents pass authenticity check
    const isAuthentic = Math.random() > 0.05;
    const flags: string[] = [];

    if (!isAuthentic) {
      const possibleFlags = [
        'Font inconsistency detected',
        'Metadata timestamp mismatch',
        'Compression artefacts near text fields',
        'Colour profile inconsistency',
      ];
      flags.push(possibleFlags[Math.floor(Math.random() * possibleFlags.length)]);
    }

    return {
      authentic: isAuthentic,
      confidence: isAuthentic ? 0.92 + Math.random() * 0.07 : 0.3 + Math.random() * 0.3,
      flags,
      tamper_detected: !isAuthentic,
      font_consistency: isAuthentic,
      metadata_valid: isAuthentic,
      extraction_time_ms: Date.now() - start,
    };
  }
}
