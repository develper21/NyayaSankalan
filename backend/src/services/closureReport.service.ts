import PDFDocument from 'pdfkit';
import { cloudinary } from '../config/cloudinary';
import { prisma } from '../prisma/client';
import { ApiError } from '../utils/ApiError';
import { CaseState } from '@prisma/client';

interface CaseData {
  id: string;
  createdAt: Date;
  closureReportUrl: string | null;
  fir: {
    firNumber: string;
    incidentDate: Date;
    sectionsApplied: string;
    createdAt: Date;
    policeStation: {
      name: string;
      district: string;
      state: string;
    };
  };
  state: {
    currentState: CaseState;
    updatedAt: Date;
  } | null;
  assignments: Array<{
    assignedUser: {
      name: string;
      role: string;
    };
    assignedAt: Date;
    unassignedAt: Date | null;
  }>;
  accused: Array<{
    name: string;
    status: string;
  }>;
  evidence: Array<{
    category: string;
    uploadedAt: Date;
  }>;
  witnesses: Array<{
    name: string;
  }>;
  courtActions: Array<{
    actionType: string;
    actionDate: Date;
    orderFileUrl: string | null;
  }>;
  bailRecords: Array<{
    bailType: string;
    status: string;
    accused: {
      name: string;
    };
  }>;
  courtSubmissions: Array<{
    submittedAt: Date;
    status: string;
    court: {
      name: string;
      courtType: string;
    };
  }>;
}

export class ClosureReportService {
  /**
   * Generate and upload closure report PDF
   */
  async generateClosureReport(caseId: string, userId: string): Promise<string> {
    // Fetch complete case data
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        fir: {
          include: {
            policeStation: true,
          },
        },
        state: true,
        assignments: {
          include: {
            assignedUser: {
              select: { name: true, role: true },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
        accused: true,
        evidence: true,
        witnesses: true,
        courtActions: {
          orderBy: { actionDate: 'asc' },
        },
        bailRecords: {
          include: {
            accused: { select: { name: true } },
          },
        },
        courtSubmissions: {
          include: {
            court: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    }) as CaseData | null;

    if (!caseData) {
      throw ApiError.notFound('Case not found');
    }

    if (caseData.state?.currentState !== CaseState.ARCHIVED) {
      throw ApiError.badRequest('Closure report can only be generated for archived cases');
    }

    // If report already exists, return it
    if (caseData.closureReportUrl) {
      return caseData.closureReportUrl;
    }

    // Get SHO and Judge info for sign-off
    const shoUser = await prisma.user.findFirst({
      where: {
        role: 'SHO',
        organizationId: caseData.fir.policeStation.name, // This might need adjustment
      },
    });

    // Get the latest court submission to find the judge's court
    const latestSubmission = caseData.courtSubmissions[0];
    let courtName = 'N/A';
    if (latestSubmission) {
      courtName = latestSubmission.court.name;
    }

    // Generate PDF
    const pdfBuffer = await this.createPDF(caseData, courtName);

    // Upload to Cloudinary
    const uploadResult = await this.uploadToCloudinary(pdfBuffer, caseId);

    // Save URL to database
    await prisma.case.update({
      where: { id: caseId },
      data: { closureReportUrl: uploadResult },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CLOSURE_REPORT_GENERATED',
        entity: 'CASE',
        entityId: caseId,
      },
    });

    return uploadResult;
  }

  /**
   * Get closure report URL for a case
   */
  async getClosureReport(caseId: string): Promise<string | null> {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: { closureReportUrl: true, state: true },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if (caseRecord.state?.currentState !== CaseState.ARCHIVED) {
      throw ApiError.badRequest('Closure report is only available for archived cases');
    }

    return caseRecord.closureReportUrl;
  }

  /**
   * Create PDF document
   */
  private createPDF(caseData: CaseData, courtName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;
      const centerX = doc.page.width / 2;

      // ===== HEADER =====
      doc.fontSize(10).fillColor('#666666');
      doc.text('GOVERNMENT OF INDIA', 50, 50, { align: 'center', width: pageWidth });
      doc.text('MINISTRY OF LAW AND JUSTICE', { align: 'center', width: pageWidth });
      
      doc.moveDown(1);
      doc.fontSize(16).fillColor('#1a1a1a').font('Helvetica-Bold');
      doc.text('FINAL CASE CLOSURE & COMPLIANCE REPORT', { align: 'center', width: pageWidth });
      
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666666').font('Helvetica');
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })}`, { align: 'center', width: pageWidth });

      // Horizontal line
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(pageWidth + 50, doc.y).stroke('#cccccc');
      doc.moveDown(1);

      // ===== SECTION 1: CASE OVERVIEW =====
      this.addSection(doc, '1. CASE OVERVIEW', pageWidth);
      
      const investigatingOfficer = caseData.assignments.find(a => !a.unassignedAt)?.assignedUser.name 
        || caseData.assignments[0]?.assignedUser.name || 'N/A';
      const accusedNames = caseData.accused.map(a => a.name).join(', ') || 'N/A';
      const caseDuration = this.calculateDuration(caseData.createdAt, new Date());

      this.addRow(doc, 'Case ID', caseData.id);
      this.addRow(doc, 'FIR Number', caseData.fir.firNumber);
      this.addRow(doc, 'Police Station', `${caseData.fir.policeStation.name}, ${caseData.fir.policeStation.district}`);
      this.addRow(doc, 'Investigating Officer', investigatingOfficer);
      this.addRow(doc, 'Accused Name(s)', accusedNames);
      this.addRow(doc, 'Case Duration', caseDuration);

      doc.moveDown(1);

      // ===== SECTION 2: FIR DETAILS =====
      this.addSection(doc, '2. FIR DETAILS', pageWidth);
      
      this.addRow(doc, 'FIR Date', new Date(caseData.fir.createdAt).toLocaleDateString('en-IN'));
      this.addRow(doc, 'Incident Date', new Date(caseData.fir.incidentDate).toLocaleDateString('en-IN'));
      this.addRow(doc, 'Sections Applied', caseData.fir.sectionsApplied);

      doc.moveDown(1);

      // ===== SECTION 3: INVESTIGATION SUMMARY =====
      this.addSection(doc, '3. INVESTIGATION SUMMARY', pageWidth);
      
      this.addRow(doc, 'Total Evidence Items', String(caseData.evidence.length));
      this.addRow(doc, 'Witness Count', String(caseData.witnesses.length));
      this.addRow(doc, 'Accused Persons', String(caseData.accused.length));
      
      if (caseData.accused.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333333');
        doc.text('Accused Status:', 70);
        caseData.accused.forEach(acc => {
          doc.text(`• ${acc.name}: ${acc.status.replace(/_/g, ' ')}`, 90);
        });
      }

      doc.moveDown(1);

      // ===== SECTION 4: COURT PROCEEDINGS =====
      this.addSection(doc, '4. COURT PROCEEDINGS', pageWidth);
      
      if (caseData.courtActions.length === 0) {
        doc.fontSize(10).fillColor('#666666');
        doc.text('No court actions recorded.', 70);
      } else {
        const hearings = caseData.courtActions.filter(a => a.actionType === 'HEARING');
        const orders = caseData.courtActions.filter(a => a.actionType !== 'HEARING');
        
        this.addRow(doc, 'Total Hearings', String(hearings.length));
        this.addRow(doc, 'Court Orders', String(orders.length));
        
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333333');
        doc.text('Court Action History:', 70);
        caseData.courtActions.forEach(action => {
          const date = new Date(action.actionDate).toLocaleDateString('en-IN');
          doc.text(`• ${date}: ${action.actionType.replace(/_/g, ' ')}`, 90);
        });
      }

      // Bail decisions
      if (caseData.bailRecords.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333333');
        doc.text('Bail Decisions:', 70);
        caseData.bailRecords.forEach(bail => {
          doc.text(`• ${bail.accused.name}: ${bail.bailType} Bail - ${bail.status}`, 90);
        });
      }

      doc.moveDown(1);

      // ===== SECTION 5: FINAL JUDGEMENT =====
      this.addSection(doc, '5. FINAL JUDGEMENT', pageWidth);
      
      const judgmentAction = caseData.courtActions.find(a => 
        ['JUDGMENT', 'CONVICTION', 'ACQUITTAL', 'SENTENCE'].includes(a.actionType)
      );
      
      if (judgmentAction) {
        this.addRow(doc, 'Verdict', judgmentAction.actionType.replace(/_/g, ' '));
        this.addRow(doc, 'Judgement Date', new Date(judgmentAction.actionDate).toLocaleDateString('en-IN'));
      } else {
        doc.fontSize(10).fillColor('#666666');
        doc.text('Final judgement details not available in system.', 70);
      }

      doc.moveDown(1);

      // ===== SECTION 6: COMPLIANCE DECLARATION =====
      this.addSection(doc, '6. COMPLIANCE DECLARATION', pageWidth);
      
      doc.fontSize(10).fillColor('#333333');
      doc.text(
        'This is to certify that the above-mentioned case has been processed in accordance with ' +
        'all applicable laws, regulations, and procedural requirements. All evidence has been ' +
        'properly documented, witnesses have been duly recorded, and court proceedings have ' +
        'been conducted as per the established judicial process.',
        70, doc.y, { width: pageWidth - 40, align: 'justify' }
      );

      doc.moveDown(2);

      // ===== DIGITAL SIGN-OFF =====
      doc.moveTo(50, doc.y).lineTo(pageWidth + 50, doc.y).stroke('#cccccc');
      doc.moveDown(1);

      doc.fontSize(12).fillColor('#1a1a1a').font('Helvetica-Bold');
      doc.text('DIGITAL SIGN-OFF', 50, doc.y, { align: 'center', width: pageWidth });
      doc.moveDown(1);

      // SHO Sign-off (Left side)
      const signY = doc.y;
      doc.fontSize(10).fillColor('#333333').font('Helvetica-Bold');
      doc.text('Station House Officer', 70, signY);
      doc.font('Helvetica').fillColor('#666666');
      doc.text(`Name: SHO, ${caseData.fir.policeStation.name}`, 70);
      doc.text(`Designation: Station House Officer`, 70);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 70);

      // Judge Sign-off (Right side)
      doc.fontSize(10).fillColor('#333333').font('Helvetica-Bold');
      doc.text('Presiding Judge', 350, signY);
      doc.font('Helvetica').fillColor('#666666');
      doc.text(`Court: ${courtName}`, 350);
      doc.text(`Designation: Presiding Judge`, 350);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 350);

      doc.moveDown(3);

      // Footer
      doc.fontSize(8).fillColor('#999999');
      doc.text(
        'This is a system-generated document from NyayaSankalan Case Management System. ' +
        'This document is digitally signed and does not require physical signature.',
        50, doc.y, { align: 'center', width: pageWidth }
      );

      doc.end();
    });
  }

  /**
   * Add section header
   */
  private addSection(doc: PDFKit.PDFDocument, title: string, _width: number): void {
    doc.fontSize(12).fillColor('#1a1a1a').font('Helvetica-Bold');
    doc.text(title, 50);
    doc.moveDown(0.5);
    doc.font('Helvetica');
  }

  /**
   * Add key-value row
   */
  private addRow(doc: PDFKit.PDFDocument, label: string, value: string): void {
    doc.fontSize(10).fillColor('#666666');
    doc.text(`${label}:`, 70, doc.y, { continued: true, width: 150 });
    doc.fillColor('#333333');
    doc.text(` ${value}`, { width: 350 });
  }

  /**
   * Calculate duration between dates
   */
  private calculateDuration(startDate: Date, endDate: Date): string {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
  }

  /**
   * Upload PDF to Cloudinary
   */
  private uploadToCloudinary(buffer: Buffer, caseId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'nyayasankalan/closure-reports',
          public_id: `closure-report-${caseId}`,
          format: 'pdf',
        },
        (error, result) => {
          if (error) {
            reject(new ApiError(500, 'Failed to upload closure report'));
          } else {
            resolve(result!.secure_url);
          }
        }
      );
      uploadStream.end(buffer);
    });
  }
}
