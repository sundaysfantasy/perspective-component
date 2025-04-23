import * as React from "react";
import {
  ComponentMeta,
  ComponentProps,
  PComponent,
  PropertyTree,
  SizeObject,
} from "@inductiveautomation/perspective-client";
import {
  Viewer,
  XKTLoaderPlugin,
  AmbientLight,
  DirLight,
  NavCubePlugin,
} from "@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js";

export const COMPONENT_TYPE = "rad.display.smartViewer";

interface EntityColor {
  entityId: string;
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

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%";
    containerRef.current.appendChild(canvas);

    const navCanvas = document.createElement("canvas");
    navCanvas.style.cssText = `
      position:absolute; bottom:10px; left:10px;
      width:120px; height:120px; z-index:1000;
    `;
    containerRef.current.appendChild(navCanvas);

    const [r, g, b] = hexToRgb(backgroundColor);

    const viewer = new Viewer({
      canvasElement: canvas,
      transparent: false,
      backgroundColor: [r, g, b],
    });
    viewer.scene.gammaOutput = true;
    viewer.scene.gammaFactor = 2.2;

    new AmbientLight(viewer.scene, { color: [1, 1, 1], intensity: 0.6 });
    new DirLight(viewer.scene, {
      dir: [-0.5, -0.8, -0.3],
      color: [1, 1, 1],
      intensity: 1,
    });

    const xktLoader = new XKTLoaderPlugin(viewer);

    new NavCubePlugin(viewer, {
      canvasElement: navCanvas,
      color: "lightblue",
      visible: true,
      cameraFly: true,
      cameraFitFOV: 45,
      cameraFlyDuration: 0.5,
    } as any);

    viewerRef.current = { viewer, xktLoader };
    return () => viewer.destroy();
  }, []);

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

    // Resetăm toate culorile la cele implicite
    Object.values(ctx.viewer.scene.objects).forEach((obj: any) => {
      obj.mesh?.eachMaterial((mat: any) => {
        mat.color = null;
      });
    });

    // Aplicăm noile culori
    entityColors.forEach(({entityId, color}) => {
      if (!entityId || !color) return;

      const obj = ctx.viewer.scene.objects[entityId];
      if (!obj) {
        console.warn(`Entity not found: ${entityId}`);
        return;
      }

      const [r, g, b] = hexToRgb(color);
      obj.mesh?.eachMaterial((mat: any) => {
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
    return {
      source: tree.readString("source", ""),
      backgroundColor: tree.readString("backgroundColor", "#f0f0f0"),
      entityColors: tree.readArray("entityColors").map((item: PropertyTree) => ({
        entityId: item.readString("entityId", ""),
        color: item.readString("color", "#ff0000")
      }))
    };
  }
}

export { SmartViewer };