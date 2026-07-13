import Image from "next/image";

export function BrandMark({ priority = false }: { priority?: boolean }) {
  return (
    <Image
      alt=""
      className="brand-logo"
      height={36}
      priority={priority}
      src="/brand/zesume-mark.png"
      width={36}
    />
  );
}
