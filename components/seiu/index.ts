/**
 * 星羽元件庫
 *
 * 專案內的獨立元件庫：所有元件只吃 styles/seiu.css 裡的 --seiu-* 變數，
 * 不依賴專案其他樣式，之後要抽成獨立套件時只需要搬 components/seiu 與那份 CSS。
 *
 * 用法：把畫面包進 <SeiuRoot>，深色由 next-themes 的 .dark class 驅動。
 */

export { SeiuRoot, Starfield, ThemeSwitch, useSeiuTheme } from "./theme"

export {
  SeiuButton,
  SeiuIconButton,
  SeiuLinkButton,
  type SeiuButtonProps,
  type SeiuLinkButtonProps,
  type SeiuButtonSize,
  type SeiuButtonVariant,
} from "./button"

export {
  SeiuCheckbox,
  SeiuDropdown,
  SeiuField,
  SeiuInput,
  SeiuRadioGroup,
  SeiuSearchInput,
  SeiuSlider,
  SeiuTextarea,
  type SeiuRadioOption,
} from "./form"

export {
  SeiuCard,
  SeiuDivider,
  SeiuFeatureCard,
  SeiuImageCard,
  SeiuMetricsRow,
  SeiuPanelCard,
  SeiuSection,
  SeiuSectionHeading,
  SeiuSideLabel,
  SeiuStarredList,
  SeiuStatCard,
  SeiuSwatch,
} from "./card"

export {
  SeiuAvatar,
  SeiuAvatarGroup,
  SeiuBadge,
  SeiuPresence,
  SeiuTag,
  SeiuTagList,
  type SeiuTagTone,
} from "./tag"

export {
  SeiuAlert,
  SeiuEmptyState,
  SeiuModal,
  SeiuMoonProgress,
  SeiuProgress,
  SeiuSkeleton,
  SeiuSpinner,
  SeiuToast,
  SeiuTooltip,
  useSeiuToast,
  type SeiuAlertTone,
} from "./feedback"

export {
  SeiuBreadcrumb,
  SeiuBurger,
  SeiuDrawer,
  SeiuNavbar,
  SeiuPagination,
  SeiuSidebarNav,
  SeiuTabs,
} from "./navigation"

export {
  SeiuAccordion,
  SeiuGallery,
  SeiuTable,
  type SeiuAccordionItem,
  type SeiuColumn,
  type SeiuGalleryItem,
} from "./data"

export { SeiuDropzone, SeiuUploadRow } from "./upload"

export {
  SeiuAstrolabeFrame,
  SeiuGridBackdrop,
  SeiuMonogram,
  SeiuPortraitFrame,
} from "./decor"

export {
  SeiuFooter,
  SeiuNewsletter,
  type SeiuFooterColumn,
} from "./marketing"
