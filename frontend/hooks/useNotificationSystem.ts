import { useAlerts } from '../contexts/AlertContext';

export const useNotificationSystem = () => {
  const { addHighAlert, addNormalAlert } = useAlerts();

  const triggerBadgeUnlock = (badgeName: string, badgeDescription: string) => {
    addNormalAlert(
      '🏆 New Badge Unlocked!',
      `${badgeName}: ${badgeDescription}`
    );
  };

  const triggerReportSubmission = (specieName: string) => {
    addNormalAlert(
      '✅ Wildlife Report Submitted',
      `${specieName} sighting reported successfully`
    );
  };

  const triggerInjuredAnimalAlert = (specieName: string, location: { latitude: number; longitude: number }, reportId: string) => {
    addHighAlert(
      '🚨 INJURED ANIMAL REPORTED',
      `${specieName} needs immediate attention! Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      reportId
    );
  };

  const triggerSystemNotification = (title: string, message: string) => {
    addNormalAlert(title, message);
  };

  return {
    triggerBadgeUnlock,
    triggerReportSubmission,
    triggerInjuredAnimalAlert,
    triggerSystemNotification,
  };
};
