import { useAlerts } from '../contexts/AlertContext';

export const useNotificationSystem = () => {
  const { addHighAlert, addNormalAlert } = useAlerts();

  const triggerBadgeUnlock = (badgeName, badgeDescription) => {
    addNormalAlert(
      '🏆 New Badge Unlocked!',
      `${badgeName}: ${badgeDescription}`
    );
  };

  const triggerReportSubmission = (specieName) => {
    addNormalAlert(
      '✅ Wildlife Report Submitted',
      `${specieName} sighting reported successfully`
    );
  };

  const triggerInjuredAnimalAlert = (specieName, location, reportId) => {
    addHighAlert(
      '🚨 INJURED ANIMAL REPORTED',
      `${specieName} needs immediate attention! Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      reportId
    );
  };

  const triggerSystemNotification = (title, message) => {
    addNormalAlert(title, message);
  };

  return {
    triggerBadgeUnlock,
    triggerReportSubmission,
    triggerInjuredAnimalAlert,
    triggerSystemNotification,
  };
};
