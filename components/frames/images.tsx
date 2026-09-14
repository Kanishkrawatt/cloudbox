/**
 * The images grid used to be a near-copy of recentImages; it only differed by
 * showing the file name in the card header. Same component, different caption.
 */
import RecentImages from "@/components/frames/recentImages";
import { datatype, themeType } from "@/components/types";

const ImagesFrame = (props: {
  data?: datatype[];
  loadingState: boolean;
  title?: string;
  theme: themeType;
  size?: "small" | "medium" | "large";
}) => <RecentImages {...props} caption="name" />;

export default ImagesFrame;
