import Image from "next/image";

export function BrandMark({ priority = true }: { priority?: boolean }) {
  return (
    <Image
      alt=""
      className="brand-logo"
      height={36}
      priority={priority}
      src="/brand/zesume-mark-128.png"
      width={36}
    />
  );
}
