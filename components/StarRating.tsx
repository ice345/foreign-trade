"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md"
}: Props) {
  const [hover, setHover] = useState(0);
  const iconSize = sizeMap[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => onChange?.(star)}
          >
            <Star
              className={`${iconSize} ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-white/20"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
