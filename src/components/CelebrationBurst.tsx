// components/CelebrationBurst.tsx
import React, { useState, useEffect, useRef } from "react";
import { BurstParticle } from "./BurstParticle";

type CelebrationBurstProps = {
  trigger: number;
  colorSet: string[];
  count?: number;
};

export const CelebrationBurst: React.FC<CelebrationBurstProps> = ({
  trigger,
  colorSet,
  count = 14,
}) => {
  const [active, setActive] = useState(false);
  const doneCount = useRef(0);

  useEffect(() => {
    if (trigger > 0) {
      doneCount.current = 0;
      setActive(true);
    }
  }, [trigger]);

  if (!active) return null;

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <BurstParticle
          key={`${trigger}-${i}`}
          seed={i + trigger * 100}
          colorSet={colorSet}
          trigger={trigger}
          onDone={() => {
            doneCount.current += 1;
            if (doneCount.current >= count) setActive(false);
          }}
        />
      ))}
    </>
  );
};
