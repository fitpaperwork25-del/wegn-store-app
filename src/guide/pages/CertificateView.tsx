import { GuideIcon } from "../components/icons";
import { getLearningPath } from "../data/learningPaths";
import { formatDate } from "../lib/format";
import { useGuideProgress } from "../context/useGuideProgress";

interface CertificateViewProps {
  pathId: string;
  onBack: () => void;
}

export default function CertificateView({ pathId, onBack }: CertificateViewProps) {
  const { certificates, learnerName, setLearnerName, businessName } = useGuideProgress();
  const path = getLearningPath(pathId);
  const certificate = certificates[pathId];

  if (!path || !certificate) {
    return (
      <div>
        <div className="wg-breadcrumb">
          <button type="button" onClick={onBack}>Learning Paths</button>
        </div>
        <div className="wg-empty">
          <div className="wg-empty-icon"><GuideIcon.trophy /></div>
          <p className="wg-card-title" style={{ fontSize: "0.95rem" }}>No certificate yet</p>
          <p className="wg-card-body">Complete every lesson in this path to earn its Certificate of Completion.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wg-certificate-page">
      <div className="wg-breadcrumb">
        <button type="button" onClick={onBack}>Learning Paths</button>
        <GuideIcon.chevronRight />
        <span>Certificate</span>
      </div>

      <div className="wg-certificate-name-input-row" style={{ marginBottom: 16, textAlign: "center" }}>
        <label htmlFor="wg-cert-name" className="wg-progress-label" style={{ justifyContent: "center", marginBottom: 8 }}>
          Name on certificate
        </label>
        <input
          id="wg-cert-name"
          type="text"
          className="wg-certificate-name-input"
          value={learnerName}
          placeholder="Type your name"
          onChange={(e) => setLearnerName(e.target.value)}
        />
        <p className="wg-card-body" style={{ marginTop: 6, fontSize: "0.78rem" }}>
          Filled in automatically from your account where available — edit if it needs a correction.
        </p>
      </div>

      <div className="wg-certificate">
        <img src="/logo.png" alt="WEGN Store" className="wg-certificate-seal" />
        <p className="wg-certificate-kicker">Certificate of Completion</p>
        <h1 className="wg-certificate-title">WEGN Store Academy</h1>
        <p className="wg-certificate-presented">This certifies that</p>
        <p className="wg-certificate-name">{learnerName.trim() || "___________________"}</p>
        <p className="wg-certificate-path">has successfully completed the</p>
        <p className="wg-certificate-path" style={{ color: "var(--g-green-dark)" }}>{path.name} path</p>
        {businessName && <p className="wg-certificate-business">{businessName}</p>}
        <p className="wg-certificate-date">Awarded {formatDate(certificate.awardedAt)}</p>

        <div className="wg-certificate-signature-row">
          <div className="wg-certificate-signature">
            <span className="wg-certificate-signature-line">WEGN Store Academy</span>
            <span className="wg-certificate-signature-label">Authorized Signature</span>
          </div>
          <div className="wg-certificate-signature">
            <span className="wg-certificate-signature-line">{formatDate(certificate.awardedAt)}</span>
            <span className="wg-certificate-signature-label">Date</span>
          </div>
        </div>

        <div className="wg-certificate-footer">
          <span>{path.lessonIds.length} lessons completed</span>
          <span className="wg-certificate-id">Certificate ID: {certificate.certificateId}</span>
        </div>
      </div>

      <div className="wg-certificate-actions">
        <button type="button" className="wg-btn wg-btn-primary" onClick={() => window.print()}>
          <GuideIcon.check /> Print or save as PDF
        </button>
      </div>
    </div>
  );
}
