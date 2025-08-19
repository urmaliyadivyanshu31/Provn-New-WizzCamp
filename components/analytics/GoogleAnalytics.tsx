'use client';

import Script from 'next/script';

const GA_TRACKING_ID = 'G-VBPWLWZR9N';

export function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  );
}

// Analytics event tracking functions
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Provn-specific event tracking
export const trackVideoEvent = (action: string, videoId: string, additionalParams?: Record<string, any>) => {
  trackEvent(`video_${action}`, {
    video_id: videoId,
    ...additionalParams
  });
};

export const trackLicenseEvent = (action: string, videoId: string, price?: number, duration?: number) => {
  trackEvent(`license_${action}`, {
    video_id: videoId,
    license_price: price,
    license_duration: duration
  });
};

export const trackUserEvent = (action: string, additionalParams?: Record<string, any>) => {
  trackEvent(`user_${action}`, additionalParams);
};

// Declare gtag type for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}