import { GuideIcon } from "../components/icons";
import { getLearningPath } from "../data/learningPaths";
import { formatDate } from "../lib/format";
import { useGuideProgress } from "../context/useGuideProgress";

interface VerifyCertificatePageProps {
  certificateId: string;
  onBack: () => void;
}

/**
 * The destination behind a certificate's printed "Verify at ..." line.
 * The Academy has no backend of its own (see GuideProgressContext's
 * header comment), so this checks the certificate records already on
 * this browser/device rather than a shared server — genuinely useful
 * for confirming a certificate on the device that earned it (e.g. a
 * shared store device), and honestly labeled as device-local rather
 * than claiming a cross-device guarantee it can't back up without a
 * real backend.
 */
export default function VerifyCertificatePage({ certificateId, onBack }: VerifyCertificatePageProps) {
  const { certificates, profile } = useGuideProgress();
  const match = Object.entries(certificates).find(([, cert]) => cert.certificateId === certificateId);
  const path = match ? getLearningPath(match[0]) : undefined;

  return (
    <div>
      <div className="wg-breadcrumb">
        <button type="button" onClick={onBack}>Learning Paths</button>
        <GuideIcon.chevronRight />
        <span>Verify Certificate</span>
      </div>

      <span className="wg-eyebrow">WEGN Store Academy</span>
      <h1 className="wg-page-title">Certificate Verification</h1>

      {match && path ? (
        <div className="wg-card" style={{ marginTop: 16 }}>
          <p className="wg-path-cert-badge" style={{ marginBottom: 14 }}>
            <GuideIcon.check /> Valid certificate on this device
          </p>
          <p className="wg-card-body"><strong>Recipient:</strong> {profile.fullName.trim() || profile.email.trim() || "—"}</p>
          <p className="wg-card-body"><strong>Path:</strong> {path.name}</p>
          <p className="wg-card-body"><strong>Awarded:</strong> {formatDate(match[1].awardedAt)}</p>
          <p className="wg-card-body"><strong>Certificate ID:</strong> {match[1].certificateId}</p>
        </div>
      ) : (
        <div className="wg-empty" style={{ marginTop: 16 }}>
          <div className="wg-empty-icon"><GuideIcon.close /></div>
          <p className="wg-card-title" style={{ fontSize: "0.95rem" }}>Not found on this device</p>
          <p className="wg-card-body">
            No certificate with id "{certificateId}" is on record here. The Academy checks only the device that
            earned the certificate — it has no shared server to check against.
          </p>
        </div>
      )}
    </div>
  );
}
