import os
import qrcode
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.core.config import settings
from app.models.models import Certificate, Application

STATE_CODES = {
    "Tamil Nadu": "TN", "Maharashtra": "MH", "Karnataka": "KR",
    "Delhi": "DL", "Gujarat": "GJ", "Uttar Pradesh": "UP",
    "Telangana": "TS", "Kerala": "KL", "West Bengal": "WB",
    "Rajasthan": "RJ", "Madhya Pradesh": "MP", "Punjab": "PB",
    "Haryana": "HR", "Bihar": "BR", "Andhra Pradesh": "AP"
}

class CertificateService:
    @staticmethod
    def generate_udyam_number(application: Application, state_name: str) -> str:
        code = STATE_CODES.get(state_name, "XX")
        app_id_str = f"{application.id:07d}"
        return f"UDYAM-{code}-00-{app_id_str}"

    @staticmethod
    def generate_qr_code(udyam_number: str) -> str:
        verify_url = f"{settings.FRONTEND_URL}/verify/{udyam_number}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(verify_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#1e293b", back_color="white")
        
        qr_dir = os.path.join(settings.CERTIFICATE_OUTPUT_DIR, "qr")
        os.makedirs(qr_dir, exist_ok=True)
        qr_path = os.path.join(qr_dir, f"{udyam_number}_qr.png")
        img.save(qr_path)
        return qr_path

    @staticmethod
    def generate_pdf(certificate: Certificate, qr_image_path: str) -> str:
        pdf_dir = os.path.join(settings.CERTIFICATE_OUTPUT_DIR, "pdf")
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_path = os.path.join(pdf_dir, f"{certificate.udyam_registration_number}.pdf")
        
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=landscape(letter),
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        story = []
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            name='TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0f172a")
        )
        
        sim_badge_style = ParagraphStyle(
            name='BadgeStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#b45309")
        )
        
        cert_num_style = ParagraphStyle(
            name='CertNumStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#1d4ed8")
        )
        
        cell_label_style = ParagraphStyle(
            name='CellLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#475569")
        )
        
        cell_val_style = ParagraphStyle(
            name='CellVal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#0f172a")
        )
        
        disclaimer_style = ParagraphStyle(
            name='Disclaimer',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=11,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#dc2626")
        )
        
        story.append(Paragraph("UDYAM MSME REGISTRATION PORTAL", title_style))
        story.append(Spacer(1, 4))
        story.append(Paragraph("SIH26130 PROTOTYPE — SIMULATED REGISTRATION CERTIFICATE", sim_badge_style))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"UDYAM REGISTRATION NUMBER: {certificate.udyam_registration_number}", cert_num_style))
        story.append(Spacer(1, 15))
        
        date_str = certificate.issue_date.strftime("%d %B %Y")
        
        table_data = [
            [
                Paragraph("NAME OF ENTERPRISE", cell_label_style),
                Paragraph(certificate.enterprise_name, cell_val_style),
                Paragraph("MAJOR ACTIVITY", cell_label_style),
                Paragraph(certificate.major_activity, cell_val_style)
            ],
            [
                Paragraph("TYPE OF ENTERPRISE", cell_label_style),
                Paragraph(f"<b>{certificate.enterprise_type}</b>", cell_val_style),
                Paragraph("ORGANISATION TYPE", cell_label_style),
                Paragraph(certificate.organisation_type.replace('_', ' '), cell_val_style)
            ],
            [
                Paragraph("STATE", cell_label_style),
                Paragraph(certificate.state, cell_val_style),
                Paragraph("DISTRICT", cell_label_style),
                Paragraph(certificate.district, cell_val_style)
            ],
            [
                Paragraph("DATE OF REGISTRATION", cell_label_style),
                Paragraph(date_str, cell_val_style),
                Paragraph("VALIDATION STATUS", cell_label_style),
                Paragraph("PROTOTYPE VERIFIED", cell_val_style)
            ]
        ]
        
        t = Table(table_data, colWidths=[150, 210, 150, 210])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(t)
        story.append(Spacer(1, 15))
        
        # QR Code and verification info
        if os.path.exists(qr_image_path):
            qr_img = RLImage(qr_image_path, width=1.1*inch, height=1.1*inch)
            qr_table_data = [
                [
                    qr_img,
                    Paragraph(
                        f"<b>Digital Verification:</b> Scan this QR code or visit our verification page to view prototype validation records for registration <b>{certificate.udyam_registration_number}</b>.<br/><br/>"
                        "<i>This simulated certificate has been issued under the SIH26130 platform test suite and carries no legal or official Government endorsement.</i>",
                        cell_val_style
                    )
                ]
            ]
            qr_table = Table(qr_table_data, colWidths=[100, 620])
            qr_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(qr_table)
            story.append(Spacer(1, 12))
            
        story.append(Paragraph(
            "NOTICE: This certificate is generated by the SIH26130 prototype and is for simulation & demonstration purposes only. It has no legal validity.",
            disclaimer_style
        ))
        
        doc.build(story)
        return pdf_path

    @staticmethod
    def generate_certificate(db: Session, application: Application) -> Certificate:
        # Check if already exists
        existing = db.query(Certificate).filter(Certificate.application_id == application.id).first()
        if existing:
            return existing
        
        # Determine details
        state_name = "Tamil Nadu"
        district_name = "Salem"
        if application.address:
            state_name = application.address.state
            district_name = application.address.district
        elif application.plants:
            state_name = application.plants[0].state
            district_name = application.plants[0].district

        enterprise_name = application.enterprise.name if application.enterprise else "Demo Enterprise"
        organisation_type = application.enterprise.organisation_type if application.enterprise else "PROPRIETORSHIP"
        
        major_activity = "MANUFACTURING"
        if application.activities:
            major_activity = application.activities[0].major_activity

        udyam_number = application.udyam_registration_number or CertificateService.generate_udyam_number(application, state_name)
        application.udyam_registration_number = udyam_number
        
        qr_path = CertificateService.generate_qr_code(udyam_number)
        
        cert = Certificate(
            application_id=application.id,
            udyam_registration_number=udyam_number,
            enterprise_name=enterprise_name,
            organisation_type=organisation_type,
            major_activity=major_activity,
            enterprise_type=application.enterprise_type or "MICRO",
            state=state_name,
            district=district_name,
            qr_code_path=qr_path,
            issue_date=datetime.now(timezone.utc)
        )
        db.add(cert)
        db.commit()
        db.refresh(cert)
        
        # Generate PDF
        pdf_path = CertificateService.generate_pdf(cert, qr_path)
        cert.pdf_path = pdf_path
        db.commit()
        db.refresh(cert)
        
        return cert
