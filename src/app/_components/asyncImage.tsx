import { useState, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/utils";

interface AsyncImageProps extends ImageProps {
  containerClassName?: string;
  fallback?: ReactNode;
}

export const AsyncImage = ({
  containerClassName,
  fallback = <>Loading...</>,
  className,
  src,
  alt,
  ...props
}: AsyncImageProps) => {
  const [loading, setLoading] = useState(true);

  console.log(loading, src);

  return (
    <div className={cn("relative -z-1 h-fit", containerClassName)}>
      {loading && fallback}
      <Image
        {...props}
        alt={alt}
        src={src}
        className={cn(className, loading ? "invisible" : "block")}
        onLoadingComplete={() => {
          console.log("Loaded image!");
          setLoading(false);
        }}
        onError={() => alert("error loading image")}
        onAbort={() => alert("Aborted loading image")}
      />
    </div>
  );
};
