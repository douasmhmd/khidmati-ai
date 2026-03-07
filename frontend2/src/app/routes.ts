import { createBrowserRouter } from "react-router";
import { LanguageSelection } from "./screens/LanguageSelection";
import { VoiceAssistant } from "./screens/VoiceAssistant";
import { Services } from "./screens/Services";
import { DocumentCapture } from "./screens/DocumentCapture";
import { DataConfirmation } from "./screens/DataConfirmation";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LanguageSelection,
  },
  {
    path: "/voice",
    Component: VoiceAssistant,
  },
  {
    path: "/services",
    Component: Services,
  },
  {
    path: "/capture",
    Component: DocumentCapture,
  },
  {
    path: "/confirm",
    Component: DataConfirmation,
  },
]);
