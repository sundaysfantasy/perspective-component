import * as React from "react";
import {
  ComponentMeta,
  ComponentProps,
  PComponent,
  PropertyTree,
  SizeObject,
} from "@inductiveautomation/perspective-client";

// importăm plugin-urile din xeokit-sdk v2.6.0
import {
  Viewer,
  XKTLoaderPlugin,
  AmbientLight,
  DirLight,
  NavCubePlugin,
  TreeViewPlugin,
} from "@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js";

export const COMPONENT_TYPE = "rad.display.smartViewer";

interface EntityColor {
  id: string;
  color: string;
}

interface SmartViewerProps {
  source: string;
  backgroundColor: string;
  entityColors: EntityColor[];
}

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};

const SmartViewer: React.FC<ComponentProps<SmartViewerProps>> = ({
  props,
  emit,
}) => {
  const { source, backgroundColor, entityColors } = props;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = React.useRef<{ viewer: any; xktLoader: any }>();

  // ─── INITIALIZARE ───
  React.useEffect(() => {
    if (!containerRef.current) return;

    // 1) Canvas principal
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%";
    containerRef.current.appendChild(canvas);

    const navCanvas = document.createElement("canvas");
    navCanvas.style.cssText = `
      position:absolute; bottom:10px; left:10px;
      width:120px; height:120px; z-index:1000;
    `;
    containerRef.current.appendChild(navCanvas);

    // 3) Container pentru TreeView
    const treeContainer = document.createElement("div");
    treeContainer.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 200px;
      height: 300px;
      overflow: auto;
      background: rgba(255,255,255,0.8);
      z-index: 1000;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
    `;
    containerRef.current.appendChild(treeContainer);

    const [r, g, b] = hexToRgb(backgroundColor);

    const viewer = new Viewer({
      canvasElement: canvas,
      transparent: false,
      backgroundColor: [r, g, b],
    });
    viewer.scene.gammaOutput = true;
    viewer.scene.gammaFactor = 2.2;

    // 5) Lumini
    new AmbientLight(viewer.scene, { color: [1, 1, 1], intensity: 0.6 });
    new DirLight(viewer.scene, {
      dir: [-0.5, -0.8, -0.3],
      color: [1, 1, 1],
      intensity: 1,
    });

    // 6) Loader pentru .xkt
    const xktLoader = new XKTLoaderPlugin(viewer);

    // 7) NavCubePlugin
    new NavCubePlugin(viewer, {
      canvasElement: navCanvas,
      color: "lightblue",
      visible: true,
      cameraFly: true,
      cameraFitFOV: 45,
      cameraFlyDuration: 0.5,
    } as any);

    // 8) TreeViewPlugin pentru listă ierarhică
    const treeView = new TreeViewPlugin(viewer, {
          containerElement: treeContainer,
          hierarchy: "containment",      // poți și "types", "storeys" etc.
          autoExpandDepth: 1,            // câte niveluri să extindă inițial
        });

    // 9) Ascultăm click‑urile pe titlul nodurilor:
    treeView.on("nodeTitleClicked", (e) => {
      // e.treeViewNode.objectId este ID‑ul entităţii
      console.log("ID-ul nodului apăsat:", e.treeViewNode.objectId);
    });

    viewerRef.current = { viewer, xktLoader };

    return () => viewer.destroy();
  }, []); // doar la mount/unmount

  // ─── ÎNCĂRCARE MODEL ───
  React.useEffect(() => {
    const ctx = viewerRef.current;
    if (!ctx || !source) return;

    const model = ctx.xktLoader.load({
      id: "model",
      src: source,
      edges: true,
    });

    if (model) {
      ctx.viewer.cameraFlight.flyTo({ aabb: model.aabb });
    }
  }, [source]);

  // ─── COLOREAZĂ ENTITĂȚILE ───
  React.useEffect(() => {
    const ctx = viewerRef.current;
    if (!ctx || !entityColors || entityColors.length === 0) return;

    // Resetăm toate culorile (modificare aici)
    Object.values(ctx.viewer.scene.objects).forEach((obj: any) => {
      obj.mesh?.eachMaterial((mat: any) => {
        mat.color = null;
      });
    });

    // Aplicăm noile culori
    entityColors.forEach(({id, color}) => {
      if (!id || !color) return;

      // Căutare entitate în multiple locații
      const entity = ctx.viewer.scene.objects[id] ||
                   ctx.viewer.metaScene.metaObjects[id]?.entity;

      if (!entity) {
        console.warn(`Entity not found: ${id}`);
        return;
      }

      const [r, g, b] = hexToRgb(color);
      entity.mesh?.eachMaterial((mat: any) => {
        mat.color = [r, g, b];
      });
    });
  }, [entityColors]);
  return (
    <div
      {...emit()}
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    />
  );
};

export class SmartViewerMeta implements ComponentMeta {
  getComponentType() {
    return COMPONENT_TYPE;
  }
  getViewComponent(): PComponent {
    return SmartViewer;
  }
  getDefaultSize(): SizeObject {
    return { width: 400, height: 300 };
  }
  getPropsReducer(tree: PropertyTree): SmartViewerProps {
    const entityColors = tree.read("entityColors", []).map((item: any) => ({
      id: item.id || "", // Folosește item.id în loc de item.readString
      color: item.color || "#ff0000"
    }));

    return {
      source: tree.readString("source", ""),
      backgroundColor: tree.readString("backgroundColor", "#f0f0f0"),
      entityColors
    };
  }
}

export { SmartViewer };