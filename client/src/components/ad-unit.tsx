import React, { useEffect } from "react";

interface AdUnitProps extends React.HTMLAttributes<HTMLDivElement> {
  adSlot: string;
}

export default function AdUnit({ adSlot, ...props }: AdUnitProps) {
  useEffect(() => {
    try {
      // @ts-expect-error
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("Failed to push to adsbygoogle", err);
    }
  }, []);

  return (
    <div {...props}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}