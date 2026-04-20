import { create } from "zustand";
import { SCENE_CONFIG, type SceneKey } from "@/config/sceneConfig";

type SceneStore = {
  activeScene: SceneKey;
  switchScene: (key: SceneKey) => void;
  setSceneSilent: (key: SceneKey) => void;
};

function applyAccentColor(key: SceneKey) {
  const color = SCENE_CONFIG[key].accentColor;
  document.documentElement.style.setProperty("--accent-color", color);
  document.documentElement.style.setProperty("--accent-hover", color);
}

export const useSceneStore = create<SceneStore>((set) => ({
  activeScene: "overview",
  switchScene: (key) => {
    set({ activeScene: key });
    applyAccentColor(key);
  },
  // 用于“路由同步到场景”时避免额外副作用：依然同步主题色，但不做其他事
  setSceneSilent: (key) => {
    set({ activeScene: key });
    applyAccentColor(key);
  },
}));

