import type { SVGProps } from "react"

// 後台共用的線條圖示：24px 方格、1.75 描邊、圓角端點
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export const HashIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" />
  </Icon>
)

export const AtIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.4 6.8" />
  </Icon>
)

export const ArrowIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 12h15M14 7l5 5-5 5" />
  </Icon>
)

export const WarnIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4.5M12 17.2v.1" />
  </Icon>
)

export const BackIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M19 12H5M10 7l-5 5 5 5" />
  </Icon>
)
