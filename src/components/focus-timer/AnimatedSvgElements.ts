import { Animated } from "react-native";
import {
  Circle,
  Rect,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
} from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

export default {
  Circle: AnimatedCircle,
  Rect: AnimatedRect,
  Ellipse: AnimatedEllipse,
  G: AnimatedG,
  Line: AnimatedLine,
  Path: AnimatedPath,
  Polygon: AnimatedPolygon,
};
