import Image from "next/image";

export function LogoWordmark() {
  return (
    <Image
      className="zing-logo-image"
      src="/WhatsApp_Image_2026-08-07_at_13.37.59-removebg-preview.png"
      alt="Zing"
      width={98}
      height={36}
      priority
    />
  );
}
