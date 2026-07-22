import zoomSdk from '@zoom/appssdk';

export const initZoom = async () => {
  try {
    const configResponse = await zoomSdk.config({
      popoutSize: { width: 480, height: 360 },
      capabilities: [
        'onMeeting',
        'getMeetingContext',
        'getRunningContext',
        'openUrl',
        'onMessage',
        'postMessage'
      ]
    });
    return configResponse;
  } catch (error) {
    console.error('Failed to configure Zoom SDK', error);
    throw error;
  }
};

export const getMeetingContext = async () => {
  try {
    const context = await zoomSdk.getMeetingContext();
    return context;
  } catch (error) {
    console.error('Failed to get meeting context', error);
    throw error;
  }
};

export const getRunningContext = async () => {
  try {
    const context = await zoomSdk.getRunningContext();
    return context;
  } catch (error) {
    console.error('Failed to get running context', error);
    throw error;
  }
};
